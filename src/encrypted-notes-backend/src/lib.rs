mod ai_service;
mod helpers;
mod storage;
mod types;

use candid::{CandidType, Principal};
use ic_cdk::api::{canister_self, msg_caller};
use ic_cdk::management_canister::{
    VetKDCurve, VetKDDeriveKeyArgs, VetKDDeriveKeyResult, VetKDKeyId, VetKDPublicKeyArgs,
    VetKDPublicKeyResult,
};
use ic_cdk::{call, export_candid, query, update};
use ic_stable_structures::Storable;
use serde::Deserialize;
use storage::{get_ledger_ids, NFTS, SEARCH_INDICES, USER_PROFILES};
use types::{Account, Nft, NftId, SearchIndex, UserProfile};

use crate::ai_service::{
    AbstractSummaryRequest, AbstractSummaryResponse, ContentAnalysisRequest,
    ContentAnalysisResponse, SemanticSearchRequest, SemanticSearchResponse, SummaryRequest,
    SummaryResponse,
};
use crate::helpers::{assert_not_anonymous, get_next_id};
use crate::storage::NOTES;
use crate::types::{Note, NoteId};

const MAX_NOTE_SIZE: usize = 1024;
const SATS_PER_BTC: u64 = 100_000_000;

// -----------------------------
// Helpers
// -----------------------------
fn btc_to_stats(btc: f64) -> u64 {
    ((btc * SATS_PER_BTC as f64).round()) as u64
}

fn nns_canister_self_pointer_to_note(note_id: NoteId) -> String {
    format!("ic://{}/note/{}", canister_self().to_text(), note_id)
}

#[ic_cdk::query]
pub fn get_ledger_id() -> String {
    return get_ledger_ids().to_text();
}

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
    // 3. Verify that seller’s balance increased by at least `amount`
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

#[ic_cdk::query]
fn whoami() -> Principal {
    msg_caller()
}

#[update]
pub fn register_user(username: String, email: String) {
    let user = msg_caller();
    let _ = assert_not_anonymous(&user);

    let profile = UserProfile {
        id: user,
        username,
        email,
    };

    USER_PROFILES.with(|users| {
        users.borrow_mut().insert(user, profile);
    });
}

#[query]
pub fn get_profile(principal: Principal) -> Option<UserProfile> {
    USER_PROFILES.with(|map| map.borrow().get(&principal))
}

#[query]
pub fn get_registered_users() -> Vec<UserProfile> {
    USER_PROFILES.with(|map| map.borrow().iter().map(|(_, v)| v).collect())
}

#[query]
pub fn get_other_users(caller: Principal) -> Vec<UserProfile> {
    USER_PROFILES.with(|map| {
        map.borrow()
            .iter()
            .filter(|(id, _)| *id != caller)
            .map(|(_, v)| v)
            .collect()
    })
}

#[update]
pub fn create_note(encrypted: String) -> NoteId {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);
    assert!(encrypted.len() <= MAX_NOTE_SIZE, "Too large");

    let note_id = get_next_id();
    let note = Note {
        id: note_id,
        owner: caller,
        encrypted,
        shared_read: vec![],
        shared_edit: vec![],
    };

    NOTES.with_borrow_mut(|store| {
        store.insert(note_id, note);
    });

    note_id
}

#[update]
pub fn read_notes() -> Vec<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.owner == caller || note.shared_read.contains(&caller))
            .map(|(_, note)| note.clone())
            .collect()
    })
}

#[query]
pub fn get_note(note_id: NoteId) -> Option<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.can_read(&caller) {
                Some(note.clone())
            } else {
                None
            }
        } else {
            None
        }
    })
}

#[update]
pub fn update_note(note_id: NoteId, new_encrypted: String) {
    let caller = msg_caller();
    assert!(new_encrypted.len() <= MAX_NOTE_SIZE);

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if !note.can_edit(&caller) {
                ic_cdk::trap("Not authorized to update this note");
            }

            note.encrypted = new_encrypted;
            store.insert(note_id, note);
        } else {
            ic_cdk::trap("Note not found");
        }
    });
}

#[update]
pub fn delete_note(note_id: NoteId) {
    let caller = msg_caller();
    NOTES.with_borrow_mut(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can delete");
            }
            store.remove(&note_id);
        }
    });
}

#[update]
pub fn share_note_read(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can share");
            }

            if !note.shared_read.contains(&user) {
                note.shared_read.push(user);
                store.insert(note_id, note);
            }
        }
    });
}

#[update]
pub fn share_note_edit(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can share");
            }

            if !note.shared_edit.contains(&user) {
                note.shared_edit.push(user);
                store.insert(note_id, note);
            }
        }
    });
}

#[update]
pub fn unshare_note_read(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can unshare");
            }
            note.shared_read.retain(|p| p != &user);
            store.insert(note_id, note);
        }
    });
}

#[update]
pub fn unshare_note_edit(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can unshare");
            }
            note.shared_edit.retain(|p| p != &user);
            store.insert(note_id, note);
        }
    });
}

// encryption logic
fn bls12_381_g2_test_key_1() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "test_key_1".to_string(),
    }
}

#[update]
pub async fn symmetric_key_verification_key_for_note() -> String {
    let request = VetKDPublicKeyArgs {
        canister_id: None,
        context: b"note_symmetric_key".to_vec(),
        key_id: bls12_381_g2_test_key_1(),
    };

    let response: VetKDPublicKeyResult = ic_cdk::management_canister::vetkd_public_key(&request)
        .await
        .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

#[update]
pub async fn encrypted_symmetric_key_for_note(
    note_id: NoteId,
    transport_public_key: Vec<u8>,
) -> String {
    let caller = msg_caller();

    let request = NOTES.with_borrow(|notes| {
        if let Some(note) = notes.get(&note_id) {
            if !note.can_read(&caller) {
                ic_cdk::trap(format!(
                    "unauthorized key request by user {}",
                    caller.to_text()
                ));
            }

            VetKDDeriveKeyArgs {
                input: {
                    let mut buf = vec![];
                    buf.extend_from_slice(&note_id.to_be_bytes());
                    buf.extend_from_slice(&note.owner.to_bytes());
                    buf
                },
                context: b"note_symmetric_key".to_vec(),
                key_id: bls12_381_g2_test_key_1(),
                transport_public_key,
            }
        } else {
            ic_cdk::trap(format!("note with ID {note_id} does not exist"));
        }
    });

    let response: VetKDDeriveKeyResult = ic_cdk::management_canister::vetkd_derive_key(&request)
        .await
        .expect("call to vetkd_derive_key failed");

    hex::encode(response.encrypted_key)
}

// Search Index Management Endpoints

#[update]
pub fn store_search_index(encrypted_blob: String) {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    let search_index = SearchIndex {
        owner: caller,
        encrypted_blob,
        last_updated: ic_cdk::api::time(),
    };

    SEARCH_INDICES.with(|indices| {
        indices.borrow_mut().insert(caller, search_index);
    });
}

#[query]
pub fn get_search_index() -> Option<String> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        indices
            .borrow()
            .get(&caller)
            .map(|index| index.encrypted_blob)
    })
}

#[query]
pub fn get_search_index_info() -> Option<u64> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        indices
            .borrow()
            .get(&caller)
            .map(|index| index.last_updated)
    })
}

#[update]
pub fn delete_search_index() -> bool {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| indices.borrow_mut().remove(&caller).is_some())
}

// AI Integration Endpoints
#[update]
pub fn ai_summarize(request: SummaryRequest) -> SummaryResponse {
    ai_service::summarize_text(request)
}

#[update]
pub fn analyze_content(request: ContentAnalysisRequest) -> ContentAnalysisResponse {
    ai_service::analyze_content(request)
}

#[update]
pub fn semantic_search(request: SemanticSearchRequest) -> SemanticSearchResponse {
    ai_service::semantic_search(request)
}

#[update]
pub fn generate_abstract_summary(request: AbstractSummaryRequest) -> AbstractSummaryResponse {
    ai_service::generate_abstract_summary(request)
}

// User Preference Learning Endpoints
#[update]
pub fn learn_from_feedback(
    user_id: String,
    feedback: ai_service::UserFeedback,
) -> ai_service::UserPreferences {
    ai_service::learn_from_user_feedback(user_id, feedback)
}

#[update]
pub fn personalized_search(
    request: ai_service::PersonalizedSearchRequest,
) -> ai_service::PersonalizedSearchResponse {
    ai_service::personalized_search(request)
}

#[query]
pub fn get_user_insights(user_id: String) -> ai_service::UserPreferences {
    ai_service::get_user_insights(user_id)
}

#[ic_cdk::query]
pub fn ai_health_check() -> String {
    "Enhanced AI Service with ML features and user learning is running...".to_string()
}

// -----------------------------
// NFT: Mint from encrypted Note
// -----------------------------
/// Mint an NFT from an encrypted note.
/// - `note_id`: ID of the note to be minted.
/// - `title`: short title that will appear in NFT metadata (plaintext).
/// - `description`: short description (plaintext, do not leak note content).
/// - `ciphertext_hash_hex`: hash of the encrypted note data (hex string), for integrity check.
///   (Compute on FE or in another canister; only store the proof in the NFT)
/// - `price_btc_opt`: if Some, the NFT is listed immediately with that price (in BTC). If None, it’s not listed.
/// Returns: `NftId`
#[update]
pub fn mint_note_to_nft(
    note_id: NoteId,
    title: String,
    description: String,
    ciphertext_hash_hex: String,
    price_btc_opt: Option<f64>,
) -> NftId {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    // Validate ownership & size
    let (owner, pointer) = NOTES.with_borrow(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only the owner can mint this note to NFT");
            }
            if note.encrypted.len() > MAX_NOTE_SIZE {
                ic_cdk::trap("Note too large");
            }
            (note.owner, nns_canister_self_pointer_to_note(note_id))
        } else {
            ic_cdk::trap("Note not found");
        }
    });

    // Prepare NFT
    let nft_id = get_next_id();
    let mut nft = Nft {
        id: nft_id,
        note_id,
        owner,
        title,
        description,
        pointer,
        encrypted: true,
        ciphertext_hash_hex,
        listed: false,
        price: None,
        created_at_nano_second: ic_cdk::api::time(),
    };

    // If price is provided, auto-list the NFT
    if let Some(price_btc) = price_btc_opt {
        let sats = btc_to_stats(price_btc);
        nft.listed = true;
        nft.price = Some(sats);
    }

    // Store NFT
    NFTS.with_borrow_mut(|store| {
        store.insert(nft_id, nft);
    });

    nft_id
}

/// Fetch NFT metadata by ID
#[query]
pub fn get_nft(nft_id: NftId) -> Option<Nft> {
    NFTS.with_borrow(|store| store.get(&nft_id))
}

/// List all NFTs owned by the caller
#[query]
pub fn list_my_nfts() -> Vec<Nft> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NFTS.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, nft)| nft.owner == caller)
            .map(|(_, nft)| nft.clone())
            .collect()
    })
}

/// List all NFTs currently up for sale
#[query]
pub fn list_nfts_for_sale() -> Vec<Nft> {
    NFTS.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, nft)| nft.listed)
            .map(|(_, nft)| nft.clone())
            .collect()
    })
}

/// Update listing status & price of an NFT (in satoshis). Only the owner can do this.
#[update]
pub fn update_listing(nft_id: NftId, listed: bool, price_sats_opt: Option<u64>) {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NFTS.with_borrow_mut(|store| {
        if let Some(mut nft) = store.get(&nft_id) {
            if nft.owner != caller {
                ic_cdk::trap("Only the owner can update the listing");
            }
            nft.listed = listed;
            nft.price = if listed { price_sats_opt } else { None };
            store.insert(nft_id, nft);
        } else {
            ic_cdk::trap("NFT not found");
        }
    });
}

#[update]
pub fn transfer_nft(nft_id: NftId, to: Principal) {
    let caller = msg_caller();
    NFTS.with_borrow_mut(|store| {
        if let Some(mut nft) = store.get(&nft_id) {
            if nft.owner != caller {
                ic_cdk::trap("Only the owner can transfer this NFT");
            }
            nft.owner = to;
            store.insert(nft_id, nft);
        } else {
            ic_cdk::trap("NFT not found");
        }
    });
}

#[query]
pub fn owner_of(nft_id: NftId) -> Option<Principal> {
    NFTS.with_borrow(|store| store.get(&nft_id).map(|n| n.owner))
}

#[query]
pub fn tokens_of(owner: Principal) -> Vec<NftId> {
    NFTS.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, nft)| nft.owner == owner)
            .map(|(id, _)| id)
            .collect()
    })
}

#[update]
pub async fn buy_nft(nft_id: NftId) -> Result<String, String> {
    let buyer = msg_caller();

    let nft = NFTS.with_borrow(|nfts| nfts.get(&nft_id));
    let mut nft = match nft {
        Some(n) if n.listed && n.price.is_some() => n,
        _ => return Err("NFT not listed for sale".to_string()),
    };

    let price = nft.price.unwrap();
    let seller = nft.owner;

    let ledger_id = get_ledger_ids();

    #[derive(CandidType, Deserialize)]
    struct TransferFromArgs {
        from: Account,
        to: Account,
        amount: u128,
        fee: Option<u128>,
        memo: Option<Vec<u8>>,
        created_at_time: Option<u64>,
    }

    let args = TransferFromArgs {
        from: Account {
            owner: buyer,
            subaccount: None,
        },
        to: Account {
            owner: seller,
            subaccount: None,
        },
        amount: price as u128,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let res: Result<(Result<u128, String>,), _> =
        call(ledger_id, "icrc2_transfer_from", (args,)).await;

    match res {
        Ok((Ok(_index),)) => {
            nft.owner = buyer;
            nft.listed = false;

            NFTS.with_borrow_mut(|nfts| {
                nfts.insert(nft_id, nft.clone());
            });

            Ok(format!("Successfully bought NFT #{}", nft_id))
        }
        Ok((Err(e),)) => Err(format!("Ledger transfer_from failed: {}", e)),
        Err((code, msg)) => Err(format!("Ledger call error: {:?} - {}", code, msg)),
    }
}

export_candid!();
