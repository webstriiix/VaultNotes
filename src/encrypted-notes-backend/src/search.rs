// Search Index Management Module
// src/encrypted-notes-backend/src/search.rs

use ic_cdk::api::msg_caller;
use ic_cdk::{query, update};

use crate::helpers::assert_not_anonymous;
use crate::storage::SEARCH_INDICES;
use crate::types::SearchIndex;

/// Store an encrypted search index for the caller
/// The search index contains encrypted metadata about the user's notes for quick searching
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

/// Retrieve the caller's encrypted search index
/// Returns the encrypted blob containing search metadata
#[query]
pub fn get_search_index() -> Option<String> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        indices
            .borrow()
            .get(&caller)
            .map(|index| index.encrypted_blob.clone())
    })
}

/// Get information about the caller's search index
/// Returns the timestamp when the index was last updated
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

/// Delete the caller's search index
/// Returns true if an index was deleted, false if no index existed
#[update]
pub fn delete_search_index() -> bool {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| indices.borrow_mut().remove(&caller).is_some())
}

/// Check if the caller has a search index
/// Useful for frontend to determine if search functionality is available
#[query]
pub fn has_search_index() -> bool {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        indices.borrow().contains_key(&caller)
    })
}

/// Get search index statistics for the caller
/// Returns a tuple of (index_exists, blob_size, last_updated)
#[query]
pub fn get_search_index_stats() -> (bool, usize, Option<u64>) {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        if let Some(index) = indices.borrow().get(&caller) {
            (true, index.encrypted_blob.len(), Some(index.last_updated))
        } else {
            (false, 0, None)
        }
    })
}

/// Update only the timestamp of an existing search index
/// Useful when notes are modified but the search index structure doesn't change
#[update]
pub fn update_search_index_timestamp() -> bool {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    SEARCH_INDICES.with(|indices| {
        let mut indices_map = indices.borrow_mut();
        if let Some(mut search_index) = indices_map.get(&caller) {
            search_index.last_updated = ic_cdk::api::time();
            indices_map.insert(caller, search_index);
            true
        } else {
            false
        }
    })
}