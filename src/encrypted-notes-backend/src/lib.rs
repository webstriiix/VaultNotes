mod helpers;
mod storage;
mod types;

use candid::Principal;
use ic_cdk::api::msg_caller;
use ic_cdk::update;

use crate::helpers::{assert_not_anonymous, get_next_id};
use crate::storage::NOTES;
use crate::types::{Note, NoteId};

const MAX_NOTE_SIZE: usize = 1024;

#[update]
fn create_note(encrypted: String) -> NoteId {
    let caller = msg_caller();
    assert_not_anonymous(&caller);
    assert!(encrypted.len() <= MAX_NOTE_SIZE, "Too large");

    let note_id = get_next_id();
    let note = Note {
        id: note_id,
        owner: caller,
        encrypted,
        shared_with: vec![],
    };

    NOTES.with_borrow_mut(|store| {
        store.insert(note_id, note);
    });

    note_id
}

#[update]
fn read_notes() -> Vec<Note> {
    let caller = msg_caller();
    assert_not_anonymous(&caller);

    NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.owner == caller || note.shared_with.contains(&caller))
            .map(|(_, note)| note.clone())
            .collect()
    })
}

#[update]
fn update_note(note_id: NoteId, new_encrypted: String) {
    let caller = msg_caller();
    assert!(new_encrypted.len() <= MAX_NOTE_SIZE);

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller && !note.shared_with.contains(&caller) {
                ic_cdk::trap("Unauthorized");
            }
            note.encrypted = new_encrypted;
            store.insert(note_id, note);
        } else {
            ic_cdk::trap("Note not found");
        }
    });
}

#[update]
fn delete_note(note_id: NoteId) {
    let caller = msg_caller();
    NOTES.with_borrow_mut(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can delete");
            }
            store.remove(&note_id);
        }
    });
}

#[update]
fn share_note(note_id: NoteId, user: Principal) {
    let caller = msg_caller();
    assert_not_anonymous(&user);

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can share");
            }
            if !note.shared_with.contains(&user) {
                note.shared_with.push(user);
                store.insert(note_id, note);
            }
        }
    });
}

#[update]
fn unshare_note(note_id: NoteId, user: Principal) {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                ic_cdk::trap("Only owner can unshare");
            }
            note.shared_with.retain(|p| p != &user);
            store.insert(note_id, note);
        }
    });
}
