use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_cdk::api::debug_print;
use ic_stable_structures::Storable;
use serde::Serialize;
use std::{borrow::Cow, cell::RefCell};

pub type NoteId = u128;
pub type NftId = u128;

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct Note {
    pub id: NoteId,
    pub owner: Principal,
    pub encrypted: String,
    pub shared_read: Vec<Principal>,
    #[serde(default)]
    pub shared_edit: Vec<Principal>,
}

#[derive(Clone, Debug, candid::CandidType, serde::Deserialize, serde::Serialize)]
pub struct UserProfile {
    pub id: Principal,
    pub username: String,
    pub email: String,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct Nft {
    pub id: NftId,
    pub note_id: NoteId,
    pub owner: Principal,
    pub title: String,
    pub description: String,
    pub pointer: String, // url for note ic://<canister>/note/{id}
    pub encrypted: bool,
    pub ciphertext_hash_hex: String,
    pub listed: bool,
    pub price: Option<u64>,
    pub created_at_nano_second: u64,
}

#[derive(CandidType, Deserialize, Debug)]
pub struct BalanceOfArgs {
    pub owner: Principal,
    pub subaccount: Option<[u8; 32]>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize, PartialEq, Eq, Hash)]
pub struct Account {
    pub owner: Principal,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub subaccount: Option<[u8; 32]>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub struct TransferArg {
    /// Amount in ckBTC satoshis (1 ckBTC = 100_000_000 satoshis).
    pub amount: u64,
    /// The destination account (recipient).
    pub to: Account,
    /// Optional subaccount from which funds are sent.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub from_subaccount: Option<[u8; 32]>,
    /// Optional fee
    pub fee: Option<u64>,
    /// Optional memo for the transaction.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub memo: Option<u64>,
    /// Optional created_at timestamp in nanoseconds.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub created_at_time: Option<u64>,
}

#[derive(Clone, Debug, CandidType, Deserialize, Serialize)]
pub enum TransferError {
    BadFee { expected_fee: u64 },
    InsufficientFunds { balance: u64 },
    TxTooOld { allowed_window_nanos: u64 },
    TxCreatedInFuture,
    Duplicate { duplicate_of: u64 },
    GenericError { error_code: u64, message: String },
}

impl Note {
    pub fn can_read(&self, principal: &Principal) -> bool {
        &self.owner == principal
            || self.shared_read.contains(principal)
            || self.shared_edit.contains(principal)
    }

    pub fn can_edit(&self, principal: &Principal) -> bool {
        &self.owner == principal || self.shared_edit.contains(principal)
    }
}

impl Storable for Note {
    fn to_bytes(&self) -> Cow<[u8]> {
        match candid::Encode!(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(e) => {
                debug_print(format!("Failed to encode Note: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::Decode!(bytes.as_ref(), Self) {
            Ok(note) => note,
            Err(e) => {
                debug_print(format!("Failed to decode Note: {}", e));
                // Return a default Note; adjust as needed for your use case
                Note {
                    id: 0,
                    owner: Principal::anonymous(),
                    encrypted: String::new(),
                    shared_read: Vec::new(),
                    shared_edit: Vec::new(),
                }
            }
        }
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

impl Storable for UserProfile {
    fn to_bytes(&self) -> Cow<[u8]> {
        match Encode!(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(e) => {
                debug_print(format!("Failed to encode UserProfile: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match Decode!(bytes.as_ref(), Self) {
            Ok(profile) => profile,
            Err(e) => {
                debug_print(format!("Failed to decode UserProfile: {}", e));
                // fallback profile
                UserProfile {
                    id: Principal::anonymous(),
                    username: String::new(),
                    email: String::new(),
                }
            }
        }
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct SearchIndex {
    pub owner: Principal,
    pub encrypted_blob: String,
    pub last_updated: u64,
}

impl Storable for SearchIndex {
    fn to_bytes(&self) -> Cow<[u8]> {
        match candid::Encode!(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(e) => {
                ic_cdk::print(format!("Failed to encode SearchIndex: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::Decode!(bytes.as_ref(), Self) {
            Ok(index) => index,
            Err(e) => {
                ic_cdk::print(format!("Failed to decode SearchIndex: {}", e));
                SearchIndex {
                    owner: Principal::anonymous(),
                    encrypted_blob: String::new(),
                    last_updated: 0,
                }
            }
        }
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}

impl Storable for Nft {
    fn to_bytes(&self) -> Cow<[u8]> {
        match Encode!(self) {
            Ok(bytes) => Cow::Owned(bytes),
            Err(e) => {
                debug_print(format!("Failed to encode Nft: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match Decode!(bytes.as_ref(), Self) {
            Ok(nft) => nft,
            Err(e) => {
                debug_print(format!("Failed to decode Nf: {}", e));
                Nft {
                    id: 0,
                    note_id: 0,
                    owner: Principal::anonymous(),
                    title: String::new(),
                    description: String::new(),
                    pointer: String::new(),
                    encrypted: true,
                    ciphertext_hash_hex: String::new(),
                    listed: false,
                    price: None,
                    created_at_nano_second: 0,
                }
            }
        }
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}
