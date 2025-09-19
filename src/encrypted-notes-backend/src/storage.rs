use candid::Principal;
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager, VirtualMemory};
use ic_stable_structures::{DefaultMemoryImpl, StableBTreeMap, StableCell};
use std::cell::RefCell;

use crate::types::{Note, NoteId, UserProfile, SearchIndex};

pub type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    pub static MEM_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    pub static NEXT_ID: RefCell<StableCell<NoteId, Memory>> = RefCell::new(
        StableCell::init(
            MEM_MANAGER.with_borrow(|m| m.get(MemoryId::new(0))),
            1
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
}
