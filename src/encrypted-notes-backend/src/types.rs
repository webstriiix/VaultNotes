use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::Storable;
use std::borrow::Cow;

pub type NoteId = u128;

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
                ic_cdk::print(format!("Failed to encode Note: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match candid::Decode!(bytes.as_ref(), Self) {
            Ok(note) => note,
            Err(e) => {
                ic_cdk::print(format!("Failed to decode Note: {}", e));
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
                ic_cdk::print(format!("Failed to encode UserProfile: {}", e));
                Cow::Owned(Vec::new())
            }
        }
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        match Decode!(bytes.as_ref(), Self) {
            Ok(profile) => profile,
            Err(e) => {
                ic_cdk::print(format!("Failed to decode UserProfile: {}", e));
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
