mod ai;
mod ai_endpoints;
mod ai_service_new;
mod helpers;
mod nft;
mod note;
mod search;
mod storage;
mod types;
mod user;

use candid::Principal;
use ic_cdk::{api::msg_caller, query};
use ic_cdk::export_candid;
use types::{Nft, NftId, Note, NoteId, UserProfile};

// AI types for export_candid
use crate::ai::{
    AbstractSummaryRequest, AbstractSummaryResponse, ContentAnalysisRequest,
    ContentAnalysisResponse, PersonalizedSearchRequest, PersonalizedSearchResponse,
    SemanticSearchRequest, SemanticSearchResponse, SummaryRequest, SummaryResponse, UserFeedback,
    UserPreferences,
};

// Helper Functions - Re-exported from helpers module
pub use crate::helpers::{
    get_ledger_id, balance_of, transfer_ckbtc, 
    SATS_PER_BTC, get_max_note_size, get_safe_max_note_size, 
    get_memory_stats
};

// Dynamic Note Size Management
#[ic_cdk::update]
pub fn set_max_note_size(new_size: usize) -> Result<(), String> {
    let caller = msg_caller();
    
    // Only controllers can change note size limits
    if !ic_cdk::api::is_controller(&caller) {
        return Err("Only controllers can set note size limits".to_string());
    }
    
    crate::helpers::set_max_note_size(new_size)
}

#[query]
fn whoami() -> Principal {
    msg_caller()
}

// User Management Endpoints - Re-exported from user module
pub use user::{
    get_my_profile, get_other_users, get_profile, get_registered_users, get_user_count,
    is_user_registered, register_user, search_users_by_username, update_profile,
};

// Note Management Endpoints - Re-exported from note module
pub use note::{
    create_note, delete_note, encrypted_symmetric_key_for_note, get_my_notes, get_note,
    get_note_count, get_shared_notes, read_notes, share_note_edit, share_note_read,
    symmetric_key_verification_key_for_note, unshare_note_edit, unshare_note_read, update_note,
};

// Search Index Management Endpoints - Re-exported from search module
pub use search::{
    delete_search_index, get_search_index, get_search_index_info, get_search_index_stats,
    has_search_index, store_search_index, update_search_index_timestamp,
};

// AI Integration Endpoints - Re-exported from ai_endpoints module
pub use ai_endpoints::{
    ai_health_check_endpoint as ai_health_check, ai_summarize,
    analyze_content_endpoint as analyze_content,
    generate_abstract_summary_endpoint as generate_abstract_summary,
    get_user_insights_endpoint as get_user_insights,
    learn_from_feedback_endpoint as learn_from_feedback,
    personalized_search_endpoint as personalized_search,
    semantic_search_endpoint as semantic_search,
};

// NFT Management Endpoints - Re-exported from nft module
pub use nft::{
    buy_nft, get_nft, list_my_nfts, list_nfts_for_sale, mint_note_to_nft, owner_of, tokens_of,
    transfer_nft, update_listing,
};

export_candid!();
