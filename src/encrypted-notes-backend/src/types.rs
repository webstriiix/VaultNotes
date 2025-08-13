use candid::{CandidType, Decode, Deserialize, Encode, Principal};
use ic_stable_structures::Storable;
use std::borrow::Cow;

pub type NoteId = u128;

#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct Note {
    pub id: NoteId,
    pub owner: Principal,
    pub encrypted: String,
    pub shared_with: Vec<Principal>,
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
                    shared_with: Vec::new(),
                }
            }
        }
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}
