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

/// Run performance benchmark
/// Executes comprehensive benchmark suite and returns detailed report
#[query]
pub fn run_benchmark_endpoint() -> String {
    use crate::ai::SummarizerBenchmark;
    let mut benchmark = SummarizerBenchmark::new();
    benchmark.run_comprehensive_suite();
    benchmark.generate_report()
}

/// Quick performance test
/// Tests summarizer with provided text and returns performance metrics
#[update]
pub fn quick_performance_test_endpoint(text: String) -> String {
    use crate::ai::quick_performance_test;
    quick_performance_test(&text)
}

/// Get cache statistics
/// Returns current cache performance statistics
#[query]
pub fn get_cache_stats_endpoint() -> String {
    use crate::ai::get_cache_stats;
    let stats = get_cache_stats();
    stats.to_string()
}

/// Clear cache
/// Clears all cached summaries
#[update]
pub fn clear_cache_endpoint() -> String {
    use crate::ai::clear_cache;
    clear_cache();
    "Cache cleared successfully".to_string()
}

/// Clear expired cache entries
/// Removes only expired cache entries
#[update]
pub fn clear_expired_cache_endpoint() -> String {
    use crate::ai::clear_expired_cache;
    clear_expired_cache();
    "Expired cache entries cleared successfully".to_string()
}

