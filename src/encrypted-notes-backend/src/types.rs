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
        Cow::Owned(candid::Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}
