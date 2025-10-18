// User Management Module
// src/encrypted-notes-backend/src/user.rs

use candid::Principal;
use ic_cdk::api::msg_caller;
use ic_cdk::{query, update};

use crate::helpers::assert_not_anonymous;
use crate::storage::USER_PROFILES;
use crate::types::UserProfile;

/// Register a new user with username and email
/// Creates a user profile associated with the caller's principal
#[update]
pub fn register_user(username: String, email: String) {
    let user = msg_caller();
    let _ = assert_not_anonymous(&user);

    let profile = UserProfile {
        id: user,
        username,
        email,
    };

    USER_PROFILES.with(|users| {
        users.borrow_mut().insert(user, profile);
    });
}

/// Get user profile by principal ID
/// Returns the complete user profile if it exists
#[query]
pub fn get_profile(principal: Principal) -> Option<UserProfile> {
    USER_PROFILES.with(|map| map.borrow().get(&principal))
}

/// Get all registered users
/// Returns a list of all user profiles in the system
#[query]
pub fn get_registered_users() -> Vec<UserProfile> {
    USER_PROFILES.with(|map| map.borrow().iter().map(|(_, v)| v).collect())
}

/// Get all users except the specified caller
/// Useful for finding other users to share content with
#[query]
pub fn get_other_users(caller: Principal) -> Vec<UserProfile> {
    USER_PROFILES.with(|map| {
        map.borrow()
            .iter()
            .filter(|(id, _)| *id != caller)
            .map(|(_, v)| v)
            .collect()
    })
}

/// Check if a user is registered
/// Returns true if the principal has a user profile
#[query]
pub fn is_user_registered(principal: Principal) -> bool {
    USER_PROFILES.with(|map| map.borrow().contains_key(&principal))
}

/// Update user profile information
/// Allows users to update their own profile data
#[update]
pub fn update_profile(username: String, email: String) {
    let user = msg_caller();
    let _ = assert_not_anonymous(&user);

    // Check if user exists
    let profile_exists = USER_PROFILES.with(|map| map.borrow().contains_key(&user));
    
    if !profile_exists {
        ic_cdk::trap("User not registered. Please register first.");
    }

    let updated_profile = UserProfile {
        id: user,
        username,
        email,
    };

    USER_PROFILES.with(|users| {
        users.borrow_mut().insert(user, updated_profile);
    });
}

/// Get user profile for the caller
/// Convenience function to get the current user's profile
#[query]
pub fn get_my_profile() -> Option<UserProfile> {
    let user = msg_caller();
    let _ = assert_not_anonymous(&user);
    
    USER_PROFILES.with(|map| map.borrow().get(&user))
}

/// Get user count statistics
/// Returns the total number of registered users
#[query]
pub fn get_user_count() -> u64 {
    USER_PROFILES.with(|map| map.borrow().len() as u64)
}

/// Search users by username (partial match)
/// Returns users whose usernames contain the search term (case-insensitive)
#[query]
pub fn search_users_by_username(search_term: String) -> Vec<UserProfile> {
    if search_term.is_empty() {
        return vec![];
    }

    let search_lower = search_term.to_lowercase();
    
    USER_PROFILES.with(|map| {
        map.borrow()
            .iter()
            .filter(|(_, profile)| {
                profile.username.to_lowercase().contains(&search_lower)
            })
            .map(|(_, profile)| profile)
            .collect()
    })
}