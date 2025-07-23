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
        Cow::Owned(candid::Encode!(self).unwrap())
    }

    fn from_bytes(bytes: Cow<[u8]>) -> Self {
        candid::Decode!(bytes.as_ref(), Self).unwrap()
    }

    const BOUND: ic_stable_structures::storable::Bound =
        ic_stable_structures::storable::Bound::Unbounded;
}
