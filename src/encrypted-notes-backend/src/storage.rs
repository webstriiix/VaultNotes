use candid::Principal;
use ic_cdk::api;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::cell::RefCell;

use crate::types::{Nft, NftId, Note, NoteId, SearchIndex, UserProfile};

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

fn is_local_development() -> bool {
    std::env::var("DFX_NETWORK").unwrap_or_default() == "local"
}

thread_local! {
    pub static MEM_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static NEXT_ID: RefCell<StableCell<NoteId, Memory>> = RefCell::new(
        StableCell::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(0))),
            1
        ).unwrap()
    );

    // Dynamic note size configuration (default: 2KB, can be adjusted)
    pub static MAX_NOTE_SIZE: RefCell<StableCell<u64, Memory>> = RefCell::new(
        StableCell::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(4))),
            2048  // Default 2KB
        ).unwrap()
    );

    pub static NOTES: RefCell<StableBTreeMap<NoteId, Note, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(1)))
        )
    );

    pub static USER_PROFILES: RefCell<StableBTreeMap<Principal, UserProfile, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(2)))
    ));

    pub static SEARCH_INDICES: RefCell<StableBTreeMap<Principal, SearchIndex, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(3)))
    ));
    pub static NFTS: RefCell<StableBTreeMap<NftId, Nft, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(5)))
    ));

    static LEDGER_ID: RefCell<Option<Principal>> = RefCell::new(None);

}

#[ic_cdk::update]
fn set_ledger_id(id: Principal) {
    assert!(
        ic_cdk::api::is_controller(&ic_cdk::caller()),
        "Only controller can set ledger ID"
    );
    LEDGER_ID.with(|cell| *cell.borrow_mut() = Some(id));
}

pub fn get_ledger_ids() -> Principal {
    LEDGER_ID.with(|cell| {
        cell.borrow().unwrap_or_else(|| {
            ic_cdk::trap("Ledger ID not set. Please call set_ledger_id() as controller.")
        })
    })
}
