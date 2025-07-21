use candid::Principal;

use crate::storage::NEXT_ID;
use crate::types::NoteId;

pub fn get_next_id() -> NoteId {
    NEXT_ID.with_borrow_mut(|id| {
        let next = *id.get();
        id.set(next + 1).unwrap();
        next
    })
}

pub fn assert_not_anonymous(principal: &Principal) {
    if *principal == Principal::anonymous() {
        ic_cdk::trap("Anonymous principal not allowed");
    }
}
