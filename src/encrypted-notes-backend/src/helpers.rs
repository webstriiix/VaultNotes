use candid::Principal;
use ic_cdk::api::canister_self;
use ic_cdk::call;
use ic_cdk::{query};
use ic_cdk::management_canister::{VetKDCurve, VetKDKeyId};

use crate::storage::{NEXT_ID, MAX_NOTE_SIZE, get_ledger_ids};
use crate::types::{NoteId, Account};

// Note size management functions

/// Get the current maximum note size limit
pub fn get_max_note_size() -> usize {
    MAX_NOTE_SIZE.with_borrow(|cell| *cell.get() as usize)
}

/// Set the maximum note size limit
/// Only callable by controllers for security
/// Includes memory safety checks to prevent out-of-memory conditions
pub fn set_max_note_size(new_size: usize) -> Result<(), String> {
    // Basic sanity checks
    if new_size == 0 {
        return Err("Note size cannot be zero".to_string());
    }
    
    if new_size > get_safe_max_note_size() {
        return Err(format!(
            "Requested size {} exceeds safe limit {}",
            new_size,
            get_safe_max_note_size()
        ));
    }

    MAX_NOTE_SIZE.with_borrow_mut(|cell| {
        cell.set(new_size as u64)
            .map_err(|_| "Failed to update note size limit".to_string())
            .map(|_| ())
    })
}

/// Calculate a safe maximum note size based on available memory
/// This prevents setting limits that could cause out-of-memory errors
pub fn get_safe_max_note_size() -> usize {
    // Simple conservative approach: use a reasonable default based on typical canister limits
    // IC canisters have a 4GB memory limit, so we'll be conservative
    
    // Get stable memory size (this is available)
    let stable_memory_pages = ic_cdk::stable::stable_size();
    
    // Each page is 64KB, calculate total stable memory in bytes
    let stable_memory_bytes = stable_memory_pages * 65536;
    
    // Reserve 75% of stable memory for other operations and overhead
    // Use the remaining 25% for note content
    let available_for_notes = stable_memory_bytes / 4;
    
    // Cap at reasonable limits to prevent abuse
    // Max: 1MB per note, Min: 2KB per note (increased from 1KB)
    let max_reasonable = 1024 * 1024; // 1MB
    let min_reasonable = 2048; // 2KB
    
    // If we have very little stable memory, use a conservative default
    if stable_memory_pages < 32 { // Less than 2MB stable memory
        return min_reasonable;
    }
    
    if available_for_notes > max_reasonable as u64 {
        max_reasonable
    } else if available_for_notes < min_reasonable as u64 {
        min_reasonable
    } else {
        available_for_notes as usize
    }
}

/// Get memory usage statistics for monitoring
pub fn get_memory_stats() -> (u64, u64, usize, usize) {
    let stable_memory_pages = ic_cdk::stable::stable_size();
    let stable_memory_bytes = stable_memory_pages * 65536;
    let current_max_size = get_max_note_size();
    let safe_max_size = get_safe_max_note_size();
    
    (stable_memory_pages, stable_memory_bytes, current_max_size, safe_max_size)
}

/// Satoshis per BTC conversion factor
pub const SATS_PER_BTC: u64 = 100_000_000;

pub fn get_next_id() -> NoteId {
    NEXT_ID.with_borrow_mut(|id| {
        let next = *id.get();
        id.set(next + 1).unwrap();
        next
    })
}

pub fn assert_not_anonymous(principal: &Principal) -> Result<(), String> {
    if *principal == Principal::anonymous() {
        return Err("Anonymous principal not allowed".to_string());
    }
    Ok(())
}

/// Helper function for vetKD encryption logic
/// Returns the BLS12-381 G2 test key used for note encryption
pub fn bls12_381_g2_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

/// Convert BTC to satoshis
pub fn btc_to_stats(btc: f64) -> u64 {
    ((btc * SATS_PER_BTC as f64).round()) as u64
}

/// Generate canister self pointer for a note
pub fn nns_canister_self_pointer_to_note(note_id: NoteId) -> String {
    format!("ic://{}/note/{}", canister_self().to_text(), note_id)
}

/// Get ledger ID as string
#[query]
pub fn get_ledger_id() -> String {
    get_ledger_ids().to_text()
}

/// Check the balance of an account on the ckBTC ledger
pub async fn balance_of(owner: Principal) -> Result<u128, String> {
    let account = Account {
        owner,
        subaccount: None,
    };

    // Convert String → Principal
    let ledger_id = get_ledger_ids();

    // Retry mechanism - try up to 3 times
    for attempt in 1..=3 {
        ic_cdk::println!(
            "Balance check attempt {} for account {:?} on ledger {}",
            attempt,
            account,
            ledger_id.to_text()
        );

        let res: Result<(u128,), _> = call(ledger_id, "icrc1_balance_of", (account.clone(),)).await;

        match res {
            Ok((balance,)) => {
                ic_cdk::println!("Balance check successful: {}", balance);
                return Ok(balance);
            }
            Err((code, msg)) => {
                ic_cdk::println!(
                    "Balance check failed (attempt {}): {:?} - {}",
                    attempt,
                    code,
                    msg
                );

                if attempt == 3 {
                    return Err(format!(
                        "Ledger call failed after {} attempts: {:?} - {}. Ledger ID: {}",
                        attempt,
                        code,
                        msg,
                        ledger_id.to_text()
                    ));
                }
            }
        }
    }

    Err("Unexpected error in balance_of".to_string())
}

/// Verifies that a buyer has transferred `amount` of ckBTC to the seller.
/// This function does not perform the transfer itself (since the canister
/// cannot spend from the buyer's ckBTC wallet), it only checks ledger balances.
///
/// # Arguments
/// * `buyer`  - Principal of the buyer (who should send ckBTC).
/// * `seller` - Principal of the seller (who should receive ckBTC).
/// * `amount` - Expected payment amount in ckBTC smallest unit (satoshis).
///
/// # Returns
/// * `Ok(())` if the seller's balance increased by at least `amount`.
/// * `Err(String)` with a descriptive message otherwise.
pub async fn transfer_ckbtc(
    buyer: Principal,
    seller: Principal,
    amount: u128,
) -> Result<(), String> {
    // ---------------------------------------------------------------------
    // 1. Query seller's balance before payment
    // ---------------------------------------------------------------------
    let balance_before: u128 = balance_of(seller).await?;

    ic_cdk::println!(
        "[ckBTC transfer check] Seller balance before: {} (expected increase: {})",
        balance_before,
        amount
    );

    // ---------------------------------------------------------------------
    // 2. Re-query seller's balance after supposed payment
    // ---------------------------------------------------------------------
    let balance_after: u128 = balance_of(seller).await?;

    ic_cdk::println!(
        "[ckBTC transfer check] Seller balance after: {}",
        balance_after
    );

    // ---------------------------------------------------------------------
    // 3. Verify that seller's balance increased by at least `amount`
    // ---------------------------------------------------------------------
    if balance_after >= balance_before.saturating_add(amount) {
        ic_cdk::println!(
            "[ckBTC transfer check] Payment of {} detected successfully from {:?} to {:?}",
            amount,
            buyer,
            seller
        );
        Ok(())
    } else {
        Err(format!(
            "Payment not detected. Seller balance increased by only {} (expected at least {}).",
            balance_after.saturating_sub(balance_before),
            amount
        ))
    }
}
