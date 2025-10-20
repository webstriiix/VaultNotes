// Note Management Module
// src/encrypted-notes-backend/src/note.rs

use candid::Principal;
use ic_cdk::api::msg_caller;
use ic_cdk::management_canister::{
    VetKDCurve, VetKDDeriveKeyArgs, VetKDDeriveKeyResult, VetKDKeyId, VetKDPublicKeyArgs,
    VetKDPublicKeyResult,
};
use ic_cdk::{query, update};
use ic_stable_structures::Storable;

use crate::helpers::{assert_not_anonymous, get_next_id, get_max_note_size};
use crate::storage::{NOTES, NFTS};
use crate::types::{Note, NoteId};

/// Create a new encrypted note
/// Returns the ID of the newly created note
#[update]
pub fn create_note(encrypted: String) -> NoteId {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);
    let max_size = get_max_note_size();
    assert!(
        encrypted.len() <= max_size, 
        "Note too large: {} bytes exceeds limit of {} bytes", 
        encrypted.len(), 
        max_size
    );

    let note_id = get_next_id();
    let note = Note {
        id: note_id,
        owner: caller,
        encrypted,
        shared_read: vec![],
        shared_edit: vec![],
    };

    NOTES.with_borrow_mut(|store| {
        store.insert(note_id, note);
    });

    note_id
}

/// Read all notes accessible to the caller
/// Includes owned notes and notes shared with read permissions
#[update]
pub fn read_notes() -> Vec<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.owner == caller || note.shared_read.contains(&caller))
            .map(|(_, note)| note.clone())
            .collect()
    })
}

/// Get a specific note by ID
/// Returns the note if caller has read permissions
#[query]
pub fn get_note(note_id: NoteId) -> Option<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.can_read(&caller) {
                Some(note.clone())
            } else {
                None
            }
        } else {
            None
        }
    })
}

/// Update an existing note's content
/// Requires edit permissions on the note
#[update]
pub fn update_note(note_id: NoteId, new_encrypted: String) {
    let caller = msg_caller();
    let max_size = get_max_note_size();
    assert!(
        new_encrypted.len() <= max_size, 
        "Note too large: {} bytes exceeds limit of {} bytes", 
        new_encrypted.len(), 
        max_size
    );

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if !note.can_edit(&caller) {
                ic_cdk::trap("Not authorized to update this note");
            }

            note.encrypted = new_encrypted;
            store.insert(note_id, note);
        } else {
            ic_cdk::trap("Note not found");
        }
    });
}

/// Delete a note
/// Only the owner can delete their notes
#[update]
pub fn delete_note(note_id: NoteId) {
    let caller = msg_caller();

    let has_minted_nft = NFTS.with_borrow(|store| {
        store.iter().any(|(_, nft)| nft.note_id == note_id)
    });
    if has_minted_nft {
        ic_cdk::trap("Cannot delete note that has been minted to an NFT");
    }

    NOTES.with_borrow_mut(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can delete");
            }
            store.remove(&note_id);
        }
    });
}

/// Share a note with read-only permissions
/// Only the owner can share their notes
#[update]
pub fn share_note_read(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can share");
            }

            if !note.shared_read.contains(&user) {
                note.shared_read.push(user);
                store.insert(note_id, note);
            }
        }
    });
}

/// Share a note with edit permissions
/// Only the owner can share their notes
#[update]
pub fn share_note_edit(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can share");
            }

            if !note.shared_edit.contains(&user) {
                note.shared_edit.push(user);
                store.insert(note_id, note);
            }
        }
    });
}

/// Remove read permissions for a user
/// Only the owner can manage sharing permissions
#[update]
pub fn unshare_note_read(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can unshare");
            }
            note.shared_read.retain(|p| p != &user);
            store.insert(note_id, note);
        }
    });
}

/// Remove edit permissions for a user
/// Only the owner can manage sharing permissions
#[update]
pub fn unshare_note_edit(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can unshare");
            }
            note.shared_edit.retain(|p| p != &user);
            store.insert(note_id, note);
        }
    });
}

/// Get public key for symmetric key verification for notes
/// Used in the vetKD protocol for encryption
#[update]
pub async fn symmetric_key_verification_key_for_note() -> String {
    let request = VetKDPublicKeyArgs {
        canister_id: None,
        context: b"note_symmetric_key".to_vec(),
        key_id: crate::helpers::bls12_381_g2_test_key_1(),
    };

    let response: VetKDPublicKeyResult = ic_cdk::management_canister::vetkd_public_key(&request)
        .await
        .expect("call to vetkd_public_key failed");

    hex::encode(response.public_key)
}

/// Get encrypted symmetric key for a specific note
/// Used in the vetKD protocol for note decryption
#[update]
pub async fn encrypted_symmetric_key_for_note(
    note_id: NoteId,
    transport_public_key: Vec<u8>,
) -> String {
    let caller = msg_caller();

    let request = NOTES.with_borrow(|notes| {
        if let Some(note) = notes.get(&note_id) {
            if !note.can_read(&caller) {
                ic_cdk::trap(format!(
                    "unauthorized key request by user {}",
                    caller.to_text()
                ));
            }

            VetKDDeriveKeyArgs {
                input: {
                    let mut buf = vec![];
                    buf.extend_from_slice(&note_id.to_be_bytes());
                    buf.extend_from_slice(&note.owner.to_bytes());
                    buf
                },
                context: b"note_symmetric_key".to_vec(),
                key_id: crate::helpers::bls12_381_g2_test_key_1(),
                transport_public_key,
            }
        } else {
            ic_cdk::trap(format!("note with ID {note_id} does not exist"));
        }
    });

    let response: VetKDDeriveKeyResult = ic_cdk::management_canister::vetkd_derive_key(&request)
        .await
        .expect("call to vetkd_derive_key failed");

    hex::encode(response.encrypted_key)
}

/// Get notes owned by the caller
/// Returns only notes where the caller is the owner
#[query]
pub fn get_my_notes() -> Vec<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.owner == caller)
            .map(|(_, note)| note.clone())
            .collect()
    })
}

/// Get notes shared with the caller
/// Returns notes where the caller has been granted read or edit permissions
#[query]
pub fn get_shared_notes() -> Vec<Note> {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| {
                note.owner != caller && 
                (note.shared_read.contains(&caller) || note.shared_edit.contains(&caller))
            })
            .map(|(_, note)| note.clone())
            .collect()
    })
}

/// Get total note count for the caller
/// Returns count of owned and shared notes
#[query]
pub fn get_note_count() -> u64 {
    let caller = msg_caller();
    let _ = assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.can_read(&caller))
            .count() as u64
    })
}
