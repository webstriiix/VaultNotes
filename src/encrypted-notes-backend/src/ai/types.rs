// AI Service Types and Data Structures
// src/encrypted-notes-backend/src/ai/types.rs

use candid::{CandidType, Deserialize};

// Core AI Request/Response Types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SummaryRequest {
    pub text: String,
    pub content_type: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SummaryResponse {
    pub summary: String,
    pub success: bool,
    pub processing_time: f64,
    pub compression_ratio: f64,
    pub method: String,
    pub error: Option<String>,
    // Quality metrics
    pub quality_metrics: Option<QualityMetrics>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct QualityMetrics {
    pub rouge_1: f64,
    pub rouge_2: f64,
    pub rouge_l: f64,
    pub informativeness: f64,
    pub coherence_score: f64,
    pub readability_score: f64,
    pub redundancy_score: f64,
    pub coverage_score: f64,
    pub overall_quality: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContentAnalysisRequest {
    pub text: String,
    pub context: Option<String>,
    pub user_preferences: Option<UserPreferences>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContentAnalysisResponse {
    pub content_type: String,
    pub language: String,
    pub confidence: f64,
    pub topics: Vec<String>,
    pub sentiment: String,
    pub complexity_score: f64,
    pub keywords: Vec<KeywordWithWeight>,
    pub entities: Vec<Entity>,
    pub success: bool,
    pub processing_time: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SemanticSearchRequest {
    pub text_query: String,
    pub content_pool: Vec<String>,
    pub search_type: String, // "semantic", "hybrid", "contextual"
    pub language: Option<String>,
    pub user_feedback: Option<Vec<SearchFeedback>>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SemanticSearchResponse {
    pub results: Vec<SearchResult>,
    pub query_analysis: QueryAnalysis,
    pub suggestions: Vec<String>,
    pub success: bool,
    pub processing_time: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct AbstractSummaryRequest {
    pub text: String,
    pub summary_type: String, // "extractive", "abstractive", "hybrid"
    pub target_length: Option<u32>,
    pub language: Option<String>,
    pub style: Option<String>, // "formal", "casual", "technical"
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct AbstractSummaryResponse {
    pub summary: String,
    pub original_sentences: Vec<String>,
    pub generated_sentences: Vec<String>,
    pub key_concepts: Vec<String>,
    pub abstraction_level: f64,
    pub coherence_score: f64,
    pub success: bool,
    pub processing_time: f64,
}

// Supporting Data Structures
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct KeywordWithWeight {
    pub keyword: String,
    pub weight: f64,
    pub category: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct Entity {
    pub text: String,
    pub entity_type: String, // "PERSON", "LOCATION", "ORGANIZATION", etc.
    pub confidence: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SearchResult {
    pub content_id: String,
    pub relevance_score: f64,
    pub semantic_similarity: f64,
    pub keyword_match_score: f64,
    pub context_relevance: f64,
    pub snippet: String,
    pub highlights: Vec<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct QueryAnalysis {
    pub intent: String,     // "search", "question", "command"
    pub query_type: String, // "factual", "conceptual", "procedural"
    pub entities: Vec<Entity>,
    pub keywords: Vec<String>,
    pub language: String,
    pub complexity: f64,
}

// User Preference and Personalization Types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserPreferences {
    pub preferred_languages: Vec<String>,
    pub summary_style: String,
    pub complexity_preference: String, // "simple", "moderate", "complex"
    pub content_types: Vec<String>,
    pub feedback_history: Vec<UserFeedback>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct UserFeedback {
    pub action: String, // "like", "dislike", "bookmark", "share"
    pub content_id: String,
    pub feedback_type: String,
    pub timestamp: u64,
    pub context: Option<String>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SearchFeedback {
    pub search_query: String,
    pub result_id: String,
    pub relevance_score: f64,
    pub clicked: bool,
    pub time_spent: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SearchPreferences {
    pub preferred_search_mode: String, // "semantic", "keyword", "hybrid"
    pub language_preference: Vec<String>,
    pub topic_interests: Vec<TopicWeight>,
    pub complexity_preference: f64, // 0.0 (simple) to 1.0 (complex)
    pub result_count_preference: u32,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContentPreferences {
    pub preferred_content_types: Vec<String>,
    pub summary_length_preference: String, // "short", "medium", "long"
    pub summary_style_preference: String,  // "bullet", "paragraph", "technical"
    pub sentiment_filter: Option<String>,  // Filter by sentiment
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct TopicWeight {
    pub topic: String,
    pub weight: f64,    // Interest level 0.0 to 1.0
    pub frequency: u32, // How often searched
}

// Advanced Personalization Types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PersonalizedSearchRequest {
    pub user_id: String,
    pub search_query: String,
    pub content_pool: Vec<String>,
    pub use_personalization: bool,
    pub context: Option<SearchContext>,
    pub override_preferences: Option<SearchPreferences>,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PersonalizedSearchResponse {
    pub results: Vec<PersonalizedSearchResult>,
    pub personalization_applied: bool,
    pub confidence_score: f64,
    pub learning_insights: Vec<String>,
    pub suggestions: Vec<String>,
    pub success: bool,
    pub processing_time: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PersonalizedSearchResult {
    pub content_id: String,
    pub base_relevance_score: f64,
    pub personalized_score: f64,
    pub personalization_factors: Vec<PersonalizationFactor>,
    pub semantic_similarity: f64,
    pub keyword_match_score: f64,
    pub context_relevance: f64,
    pub snippet: String,
    pub highlights: Vec<String>,
    pub confidence: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct PersonalizationFactor {
    pub factor_type: String, // "topic_interest", "complexity_match", "content_type", "historical_preference"
    pub weight: f64,
    pub contribution: f64,
    pub explanation: String,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SearchContext {
    pub timestamp: u64,
    pub session_id: String,
    pub previous_queries: Vec<String>,
    pub user_location: Option<String>, // General location for context
    pub device_type: String,
    pub search_intent: String,
}

// Learning and Analytics Types
#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct LearningProfile {
    pub search_patterns: Vec<SearchPattern>,
    pub content_engagement: Vec<ContentEngagement>,
    pub adaptation_score: f64, // How well we understand user preferences
    pub confidence_level: f64, // Confidence in our predictions
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct SearchPattern {
    pub pattern_type: String, // "time_based", "topic_based", "complexity_based"
    pub pattern_data: String, // JSON encoded pattern specifics
    pub frequency: f64,
    pub effectiveness: f64,
}

#[derive(Clone, Debug, CandidType, Deserialize)]
pub struct ContentEngagement {
    pub content_type: String,
    pub engagement_score: f64,
    pub interaction_count: u32,
    pub average_dwell_time: f64,
}

