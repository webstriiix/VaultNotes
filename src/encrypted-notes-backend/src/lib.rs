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
fn create_note(encrypted: String) -> Result<NoteId, String> {
    let caller = msg_caller();
    assert_not_anonymous(&caller)?;
    if encrypted.len() > MAX_NOTE_SIZE {
        return Err("Too large".to_string());
    }

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

    Ok(note_id)
}

#[update]
fn read_notes() -> Result<Vec<Note>, String> {
    let caller = msg_caller();
    assert_not_anonymous(&caller)?;

    Ok(NOTES.with_borrow(|store| {
        store
            .iter()
            .filter(|(_, note)| note.owner == caller || note.shared_with.contains(&caller))
            .map(|(_, note)| note.clone())
            .collect()
    }))
}

#[update]
fn update_note(note_id: NoteId, new_encrypted: String) -> Result<(), String> {
    let caller = msg_caller();
    if new_encrypted.len() > MAX_NOTE_SIZE {
        return Err("Too large".to_string());
    }

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller && !note.shared_with.contains(&caller) {
                return Err("Unauthorized".to_string());
            }
            note.encrypted = new_encrypted;
            store.insert(note_id, note);
            Ok(())
        } else {
            Err("Note not found".to_string())
        }
    })
}

#[update]
fn delete_note(note_id: NoteId) -> Result<(), String> {
    let caller = msg_caller();
    NOTES.with_borrow_mut(|store| {
        if let Some(note) = store.get(&note_id) {
            if note.owner != caller {
                return Err("Only owner can delete".to_string());
            }
            store.remove(&note_id);
            Ok(())
        } else {
            Err("Note not found".to_string())
        }
    })
}

#[update]
fn share_note(note_id: NoteId, user: Principal) -> Result<(), String> {
    let caller = msg_caller();
    assert_not_anonymous(&user)?;

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                return Err("Only owner can share".to_string());
            }
            if !note.shared_with.contains(&user) {
                note.shared_with.push(user);
                store.insert(note_id, note);
            }
            Ok(())
        } else {
            Err("Note not found".to_string())
        }
    })
}

#[update]
fn unshare_note(note_id: NoteId, user: Principal) -> Result<(), String> {
    let caller = msg_caller();

    NOTES.with_borrow_mut(|store| {
        if let Some(mut note) = store.get(&note_id) {
            if note.owner != caller {
                return Err("Only owner can unshare".to_string());
            }
            note.shared_with.retain(|p| p != &user);
            store.insert(note_id, note);
            Ok(())
        } else {
            Err("Note not found".to_string())
        }
    })
}