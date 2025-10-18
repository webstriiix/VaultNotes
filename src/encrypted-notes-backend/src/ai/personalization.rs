// AI Personalization Module
// src/encrypted-notes-backend/src/ai/personalization.rs

use super::types::{
    UserPreferences, PersonalizationFactor, PersonalizedSearchResult, SearchResult, SearchContext,
    UserFeedback,
};


/// Apply personalization to search results
pub fn personalize_search_results(
    results: Vec<SearchResult>,
    preferences: &UserPreferences,
    context: Option<&SearchContext>,
) -> Vec<PersonalizedSearchResult> {
    results
        .into_iter()
        .map(|result| {
            let content_id = result.content_id.clone();
            let base_relevance_score = result.relevance_score;
            let semantic_similarity = result.semantic_similarity;
            let keyword_match_score = result.keyword_match_score;
            let context_relevance = result.context_relevance;
            let snippet = result.snippet.clone();
            let highlights = result.highlights.clone();

            let personalization_factors =
                calculate_personalization_factors(&result, preferences, context);
            let personalized_score = apply_personalization(&result, &personalization_factors);
            let confidence = calculate_result_confidence(&result, preferences);

            PersonalizedSearchResult {
                content_id,
                base_relevance_score,
                personalized_score,
                personalization_factors,
                semantic_similarity,
                keyword_match_score,
                context_relevance,
                snippet,
                highlights,
                confidence,
            }
        })
        .collect()
}

/// Calculate personalization factors for a search result
fn calculate_personalization_factors(
    result: &SearchResult,
    preferences: &UserPreferences,
    context: Option<&SearchContext>,
) -> Vec<PersonalizationFactor> {
    let mut factors = Vec::new();

    // Complexity preference factor
    let content_complexity = calculate_simple_complexity(&result.snippet);
    let user_complexity_pref = match preferences.complexity_preference.as_str() {
        "simple" => 0.3,
        "moderate" => 0.6,
        "complex" => 0.9,
        _ => 0.5,
    };
    let complexity_match = 1.0 - (content_complexity - user_complexity_pref).abs();

    factors.push(PersonalizationFactor {
        factor_type: "complexity_match".to_string(),
        weight: 0.2,
        contribution: complexity_match * 0.2,
        explanation: format!(
            "Content complexity ({:.1}) matches user preference ({})",
            content_complexity, preferences.complexity_preference
        ),
    });

    // Historical preference factor
    let historical_score = calculate_historical_preference_score(result, preferences);
    if historical_score > 0.0 {
        factors.push(PersonalizationFactor {
            factor_type: "historical_preference".to_string(),
            weight: 0.25,
            contribution: historical_score * 0.25,
            explanation: "Based on similar past search interactions".to_string(),
        });
    }

    // Context relevance factor
    if let Some(ctx) = context {
        let context_score = calculate_context_relevance_score(result, ctx);
        factors.push(PersonalizationFactor {
            factor_type: "context_relevance".to_string(),
            weight: 0.15,
            contribution: context_score * 0.15,
            explanation: "Relevant to current search context".to_string(),
        });
    }

    factors
}

/// Apply personalization boost to base relevance score
fn apply_personalization(result: &SearchResult, factors: &[PersonalizationFactor]) -> f64 {
    let base_score = result.relevance_score;
    let personalization_boost: f64 = factors.iter().map(|f| f.contribution).sum();

    // Apply personalization boost, but cap at 1.0
    (base_score + personalization_boost).min(1.0)
}

/// Calculate confidence in the result for the user
fn calculate_result_confidence(_result: &SearchResult, _preferences: &UserPreferences) -> f64 {
    // Default confidence level - could be enhanced with more sophisticated logic
    0.7
}

/// Calculate historical preference score based on past interactions
fn calculate_historical_preference_score(
    _result: &SearchResult,
    _preferences: &UserPreferences,
) -> f64 {
    // Simplified implementation - return base score
    // In a full implementation, this would analyze feedback history
    0.5
}

/// Calculate context relevance score
fn calculate_context_relevance_score(result: &SearchResult, context: &SearchContext) -> f64 {
    let mut relevance = 0.0;

    // Check relevance to previous queries in session
    for prev_query in &context.previous_queries {
        let similarity = calculate_query_similarity(prev_query, &result.snippet);
        relevance += similarity * 0.3;
    }

    // Intent-based relevance
    if context.search_intent == "exploration" {
        relevance += 0.2; // Boost for exploration intent
    }

    relevance.min(1.0)
}

/// Calculate similarity between two queries
fn calculate_query_similarity(query1: &str, query2: &str) -> f64 {
    use std::collections::HashSet;
    
    let words1: HashSet<&str> = query1.split_whitespace().collect();
    let words2: HashSet<&str> = query2.split_whitespace().collect();

    if words1.is_empty() || words2.is_empty() {
        return 0.0;
    }

    let intersection = words1.intersection(&words2).count();
    let union = words1.union(&words2).count();

    intersection as f64 / union as f64
}

/// Learn from user feedback and update preferences
pub fn learn_from_user_feedback(_user_id: String, user_feedback: UserFeedback) -> UserPreferences {
    // Create simplified user preferences based on actual struct
    let mut user_prefs = UserPreferences {
        preferred_languages: vec!["en".to_string()],
        summary_style: "concise".to_string(),
        complexity_preference: "moderate".to_string(),
        content_types: vec!["general".to_string()],
        feedback_history: vec![],
    };

    // Add new feedback to history
    user_prefs.feedback_history.push(user_feedback);

    // Simple learning: adjust preferences based on feedback type
    if user_prefs.feedback_history.len() > 5 {
        let likes = user_prefs
            .feedback_history
            .iter()
            .filter(|f| f.action == "like")
            .count();

        if likes > user_prefs.feedback_history.len() / 2 {
            user_prefs.summary_style = "detailed".to_string();
        }
    }

    user_prefs
}

/// Generate personalized search suggestions
pub fn generate_personalized_suggestions(query: &str, user_prefs: &UserPreferences) -> Vec<String> {
    let mut suggestions = Vec::new();

    // Simple suggestions based on content types
    for content_type in &user_prefs.content_types {
        if !query.to_lowercase().contains(&content_type.to_lowercase()) {
            suggestions.push(format!("{} {}", query, content_type));
        }
    }

    // Language-based suggestions
    for lang in &user_prefs.preferred_languages {
        if lang != "en" && !query.contains(lang) {
            suggestions.push(format!("{} in {}", query, lang));
        }
    }

    suggestions.truncate(5); // Limit to 5 suggestions
    suggestions
}

/// Get user insights for a given user ID
pub fn get_user_insights(_user_id: String) -> UserPreferences {
    // For demo purposes, return mock insights
    // In production, this would retrieve from storage
    UserPreferences {
        preferred_languages: vec!["en".to_string(), "id".to_string()],
        summary_style: "technical".to_string(),
        complexity_preference: "moderate".to_string(),
        content_types: vec!["document".to_string(), "tutorial".to_string()],
        feedback_history: vec![],
    }
}

// Helper functions

/// Calculate simple complexity score for text
fn calculate_simple_complexity(text: &str) -> f64 {
    let words = text.split_whitespace().count();
    let sentences = text.split('.').count();
    let avg_word_length: f64 =
        text.split_whitespace().map(|w| w.len()).sum::<usize>() as f64 / words.max(1) as f64;

    // Simple complexity based on word count, sentence structure, and average word length
    ((words as f64 * 0.1) + (sentences as f64 * 0.2) + (avg_word_length * 0.3)) / 100.0
}
