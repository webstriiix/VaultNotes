use candid::{CandidType, Principal};
use ic_cdk::api::{canister_self, msg_caller};
use ic_cdk::{call, query, update};
use serde::Deserialize;

use crate::storage::{get_ledger_ids, NFTS, NOTES};
use crate::types::{Account, Nft, NftId, NoteId};
use crate::helpers::{
    assert_not_anonymous, get_next_id, get_max_note_size,
    btc_to_stats, nns_canister_self_pointer_to_note
};

const ADMIN_FEE_PERCENT: u64 = 3;

// -----------------------------
// NFT: Mint from encrypted Note
// -----------------------------

/// Mint an NFT from an encrypted note.
/// - `note_id`: ID of the note to be minted.
/// - `title`: short title that will appear in NFT metadata (plaintext).
/// - `description`: short description (plaintext, do not leak note content).
/// - `ciphertext_hash_hex`: hash of the encrypted note data (hex string), for integrity check.
///   (Compute on FE or in another canister; only store the proof in the NFT)
/// - `price_btc_opt`: if Some, the NFT is listed immediately with that price (in BTC). If None, it's not listed.
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
            let max_size = get_max_note_size();
            if note.encrypted.len() > max_size {
                ic_cdk::trap(&format!(
                    "Note too large: {} bytes exceeds limit of {} bytes", 
                    note.encrypted.len(), 
                    max_size
                ));
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

/// Transfer an NFT to another principal
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

/// Get the owner of an NFT
#[query]
pub fn owner_of(nft_id: NftId) -> Option<Principal> {
    NFTS.with_borrow(|store| store.get(&nft_id).map(|n| n.owner))
}

/// Get all NFT IDs owned by a specific principal
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

/// Buy an NFT from the marketplace
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

    if price == 0 {
        return Err("NFT price is invalid".to_string());
    }

    let admin_fee_raw = ((price as u128) * ADMIN_FEE_PERCENT as u128) / 100;
    let admin_fee = u64::try_from(admin_fee_raw).map_err(|_| "Admin fee overflow".to_string())?;
    let seller_amount = price
        .checked_sub(admin_fee)
        .ok_or("NFT price too low to cover administration fee")?;

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

    let seller_args = TransferFromArgs {
        from: Account {
            owner: buyer,
            subaccount: None,
        },
        to: Account {
            owner: seller,
            subaccount: None,
        },
        amount: seller_amount as u128,
        fee: None,
        memo: None,
        created_at_time: None,
    };

    let seller_transfer: Result<(Result<u128, String>,), _> =
        call(ledger_id, "icrc2_transfer_from", (seller_args,)).await;

    match seller_transfer {
        Ok((Ok(_index),)) => {
            if admin_fee > 0 {
                let admin_args = TransferFromArgs {
                    from: Account {
                        owner: buyer,
                        subaccount: None,
                    },
                    to: Account {
                        owner: canister_self(),
                        subaccount: None,
                    },
                    amount: admin_fee as u128,
                    fee: None,
                    memo: None,
                    created_at_time: None,
                };

                let admin_transfer: Result<(Result<u128, String>,), _> =
                    call(ledger_id, "icrc2_transfer_from", (admin_args,)).await;

                match admin_transfer {
                    Ok((Ok(_),)) => {}
                    Ok((Err(e),)) => return Err(format!("Ledger admin fee transfer failed: {}", e)),
                    Err((code, msg)) => {
                        return Err(format!(
                            "Ledger call error while collecting admin fee: {:?} - {}",
                            code, msg
                        ))
                    }
                }
            }

            NOTES.with_borrow_mut(|notes| {
                if let Some(mut note) = notes.get(&nft.note_id) {
                    note.owner = buyer;
                    note.shared_read.clear();
                    note.shared_edit.clear();
                    notes.insert(nft.note_id, note);
                }
            });

            nft.owner = buyer;
            nft.listed = false;
            nft.price = None;

            NFTS.with_borrow_mut(|nfts| {
                nfts.insert(nft_id, nft.clone());
            });

            Ok(format!(
                "Successfully bought NFT #{} (admin fee {} sats)",
                nft_id, admin_fee
            ))
        }
        Ok((Err(e),)) => Err(format!("Ledger transfer_from failed: {}", e)),
        Err((code, msg)) => Err(format!("Ledger call error: {:?} - {}", code, msg)),
    }
}
