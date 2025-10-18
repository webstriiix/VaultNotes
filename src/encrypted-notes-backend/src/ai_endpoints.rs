// AI Integration Endpoints Module
// src/encrypted-notes-backend/src/ai_endpoints.rs

use ic_cdk::{query, update};

use crate::{ai::{analyze_content, generate_abstract_summary, get_user_insights, learn_from_user_feedback, personalized_search, semantic_search, summarize_text, AbstractSummaryRequest, AbstractSummaryResponse, ContentAnalysisRequest, ContentAnalysisResponse, PersonalizedSearchRequest, PersonalizedSearchResponse, SemanticSearchRequest, SemanticSearchResponse, SummaryRequest, SummaryResponse, UserFeedback, UserPreferences}, ai_service_new::ai_health_check};

/// AI text summarization endpoint
/// Processes text and returns an intelligent summary based on content type
#[update]
pub fn ai_summarize(request: SummaryRequest) -> SummaryResponse {
    summarize_text(request)
}

/// Content analysis endpoint
/// Analyzes text for language, sentiment, complexity, and extracts entities/keywords
#[update]
pub fn analyze_content_endpoint(request: ContentAnalysisRequest) -> ContentAnalysisResponse {
    analyze_content(request)
}

/// Semantic search endpoint  
/// Performs AI-powered search with contextual understanding
#[update]
pub fn semantic_search_endpoint(request: SemanticSearchRequest) -> SemanticSearchResponse {
    semantic_search(request)
}

/// Abstract summary generation endpoint
/// Creates summaries using extractive, abstractive, or hybrid approaches
#[update]
pub fn generate_abstract_summary_endpoint(
    request: AbstractSummaryRequest,
) -> AbstractSummaryResponse {
    generate_abstract_summary(request)
}

/// User preference learning endpoint
/// Learns from user feedback to improve personalization
#[update]
pub fn learn_from_feedback_endpoint(user_id: String, feedback: UserFeedback) -> UserPreferences {
    learn_from_user_feedback(user_id, feedback)
}

/// Personalized search endpoint
/// Provides search results tailored to user preferences and context
#[update]
pub fn personalized_search_endpoint(
    request: PersonalizedSearchRequest,
) -> PersonalizedSearchResponse {
    personalized_search(request)
}

/// Get user insights endpoint
/// Retrieves learned user preferences and patterns
#[query]
pub fn get_user_insights_endpoint(user_id: String) -> UserPreferences {
    get_user_insights(user_id)
}

/// AI health check endpoint
/// Returns the operational status of the AI service
#[query]
pub fn ai_health_check_endpoint() -> String {
    ai_health_check()
}

