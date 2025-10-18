// Core AI Service Functions
// src/encrypted-notes-backend/src/ai/core.rs

use ic_cdk::api::time;

use super::analyzer::TextAnalyzer;
use super::personalization::{personalize_search_results, generate_personalized_suggestions};
use super::types::*;

/// Helper function to calculate elapsed time in seconds
fn elapsed_seconds(start_ns: u64) -> f64 {
    let end_ns = time();
    let elapsed_ns = end_ns.saturating_sub(start_ns);
    elapsed_ns as f64 / 1_000_000_000.0 // Convert nanoseconds to seconds
}

/// Enhanced summarization function with improved algorithms
pub fn summarize_text(request: SummaryRequest) -> SummaryResponse {
    let start_time = time(); // IC time in nanoseconds

    let text = request.text;
    let content_type = request.content_type.unwrap_or_else(|| "general".to_string());

    // Handle very short texts
    if text.len() < 100 {
        return SummaryResponse {
            summary: text.clone(),
            success: true,
            processing_time: elapsed_seconds(start_time),
            compression_ratio: 1.0,
            method: "passthrough".to_string(),
            error: None,
        };
    }

    let analyzer = TextAnalyzer::new();
    let sentences = analyzer.split_into_sentences(&text);

    if sentences.is_empty() {
        return SummaryResponse {
            summary: "No meaningful content found for summarization.".to_string(),
            success: false,
            processing_time: elapsed_seconds(start_time),
            compression_ratio: 0.0,
            method: "failed".to_string(),
            error: Some("Could not parse sentences from text".to_string()),
        };
    }

    // Score all sentences
    let scored_sentences: Vec<(String, f64)> = sentences
        .iter()
        .map(|sentence| {
            (
                sentence.clone(),
                analyzer.score_sentence(sentence, &content_type),
            )
        })
        .collect();

    // Select top sentences for summary
    let target_sentence_count = ((sentences.len() as f64 * 0.3).ceil() as usize)
        .min(5)
        .max(1);
    let selected = analyzer.select_top_sentences(scored_sentences, target_sentence_count);

    // Generate the final summary
    let summary = analyzer.generate_summary_text(selected);

    let compression_ratio = summary.len() as f64 / text.len() as f64;

    SummaryResponse {
        summary,
        success: true,
        processing_time: elapsed_seconds(start_time),
        compression_ratio,
        method: "advanced_extractive".to_string(),
        error: None,
    }
}

/// Content Analysis Function
pub fn analyze_content(request: ContentAnalysisRequest) -> ContentAnalysisResponse {
    let start_time = time();
    let analyzer = TextAnalyzer::new();

    // Detect content type
    let (content_type, content_confidence) = analyzer.detect_content_type(&request.text);

    // Detect language
    let (language, lang_confidence) = analyzer.detect_language(&request.text);

    // Extract entities
    let entities = analyzer.extract_entities(&request.text);

    // Analyze sentiment
    let (sentiment, _sentiment_score) = analyzer.analyze_sentiment(&request.text, &language);

    // Calculate complexity
    let complexity_score = analyzer.calculate_complexity(&request.text);

    // Extract keywords with weights
    let keywords = analyzer.extract_keywords_with_weights(&request.text, &language);

    // Extract topics (simplified - use top keywords as topics)
    let topics: Vec<String> = keywords
        .iter()
        .take(5)
        .map(|kw| kw.keyword.clone())
        .collect();

    // Overall confidence is average of content and language confidence
    let overall_confidence = (content_confidence + lang_confidence) / 2.0;

    ContentAnalysisResponse {
        content_type,
        language,
        confidence: overall_confidence,
        topics,
        sentiment,
        complexity_score,
        keywords,
        entities,
        success: true,
        processing_time: elapsed_seconds(start_time),
    }
}

/// Semantic Search Function
pub fn semantic_search(request: SemanticSearchRequest) -> SemanticSearchResponse {
    let start_time = time();
    let analyzer = TextAnalyzer::new();

    // Analyze the query
    let query_language = request
        .language
        .unwrap_or_else(|| analyzer.detect_language(&request.text_query).0);

    let query_entities = analyzer.extract_entities(&request.text_query);
    let query_keywords =
        analyzer.extract_keywords_with_weights(&request.text_query, &query_language);

    let query_analysis = QueryAnalysis {
        intent: classify_query_intent(&request.text_query),
        query_type: classify_query_type(&request.text_query),
        entities: query_entities,
        keywords: query_keywords.iter().map(|kw| kw.keyword.clone()).collect(),
        language: query_language.clone(),
        complexity: analyzer.calculate_complexity(&request.text_query),
    };

    // Perform semantic search
    let mut results = Vec::new();

    for (idx, content) in request.content_pool.iter().enumerate() {
        let content_keywords = analyzer.extract_keywords_with_weights(content, &query_language);

        // Calculate different similarity scores
        let keyword_similarity = calculate_keyword_similarity(&query_keywords, &content_keywords);
        let semantic_similarity =
            calculate_semantic_similarity(&request.text_query, content, &analyzer);
        let context_relevance = if request.search_type == "contextual" {
            calculate_context_relevance(&request.text_query, content, &analyzer)
        } else {
            0.5
        };

        // Combine scores based on search type
        let relevance_score = match request.search_type.as_str() {
            "semantic" => semantic_similarity * 0.7 + keyword_similarity * 0.3,
            "hybrid" => {
                semantic_similarity * 0.4 + keyword_similarity * 0.4 + context_relevance * 0.2
            }
            "contextual" => context_relevance * 0.6 + semantic_similarity * 0.4,
            _ => keyword_similarity * 0.6 + semantic_similarity * 0.4,
        };

        if relevance_score > 0.1 {
            // Only include relevant results
            let snippet = generate_snippet(content, &request.text_query, 150);
            let highlights = extract_highlights(content, &query_keywords);

            results.push(SearchResult {
                content_id: idx.to_string(),
                relevance_score,
                semantic_similarity,
                keyword_match_score: keyword_similarity,
                context_relevance,
                snippet,
                highlights,
            });
        }
    }

    // Sort by relevance score
    results.sort_by(|a, b| b.relevance_score.partial_cmp(&a.relevance_score).unwrap());

    // Generate search suggestions
    let suggestions = generate_search_suggestions(&request.text_query, &analyzer);

    SemanticSearchResponse {
        results,
        query_analysis,
        suggestions,
        success: true,
        processing_time: elapsed_seconds(start_time),
    }
}

/// Abstract Summarization Function
pub fn generate_abstract_summary(request: AbstractSummaryRequest) -> AbstractSummaryResponse {
    let start_time = time();
    let analyzer = TextAnalyzer::new();

    let language = request
        .language
        .unwrap_or_else(|| analyzer.detect_language(&request.text).0);

    // Split into sentences
    let sentences: Vec<String> = request
        .text
        .split(&['.', '!', '?'][..])
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s.len() > 10)
        .collect();

    if sentences.is_empty() {
        return AbstractSummaryResponse {
            summary: "No content to summarize.".to_string(),
            original_sentences: vec![],
            generated_sentences: vec![],
            key_concepts: vec![],
            abstraction_level: 0.0,
            coherence_score: 0.0,
            success: false,
            processing_time: elapsed_seconds(start_time),
        };
    }

    // Extract key concepts
    let keywords = analyzer.extract_keywords_with_weights(&request.text, &language);
    let key_concepts: Vec<String> = keywords
        .iter()
        .take(8)
        .map(|kw| kw.keyword.clone())
        .collect();

    let target_length = request.target_length.unwrap_or(3) as usize;
    let summary_style = request.style.unwrap_or_else(|| "formal".to_string());

    let (summary, original_sentences, generated_sentences, abstraction_level) = match request
        .summary_type
        .as_str()
    {
        "abstractive" => {
            generate_abstractive_summary(&sentences, &key_concepts, target_length, &summary_style)
        }
        "hybrid" => generate_hybrid_summary(
            &sentences,
            &key_concepts,
            target_length,
            &summary_style,
            &analyzer,
        ),
        _ => generate_extractive_summary(&sentences, target_length, &analyzer),
    };

    // Calculate coherence score
    let coherence_score = calculate_coherence_score(&summary, &analyzer);

    AbstractSummaryResponse {
        summary,
        original_sentences,
        generated_sentences,
        key_concepts,
        abstraction_level,
        coherence_score,
        success: true,
        processing_time: elapsed_seconds(start_time),
    }
}

/// Personalized search with user preference integration
pub fn personalized_search(request: PersonalizedSearchRequest) -> PersonalizedSearchResponse {
    let start_time = time();

    // For demo purposes, create default preferences if not overridden
    let user_prefs = request.override_preferences.unwrap_or_else(|| SearchPreferences {
        preferred_search_mode: "hybrid".to_string(),
        language_preference: vec!["en".to_string()],
        topic_interests: vec![],
        complexity_preference: 0.5,
        result_count_preference: 10,
    });

    // Convert SearchPreferences to UserPreferences for compatibility
    let user_preferences = UserPreferences {
        preferred_languages: user_prefs.language_preference,
        summary_style: "concise".to_string(),
        complexity_preference: "moderate".to_string(),
        content_types: vec!["general".to_string()],
        feedback_history: vec![],
    };

    // First, perform traditional semantic search
    let semantic_request = SemanticSearchRequest {
        text_query: request.search_query.clone(),
        content_pool: request.content_pool.clone(),
        search_type: user_prefs.preferred_search_mode,
        language: Some("en".to_string()),
        user_feedback: None,
    };

    let semantic_response = semantic_search(semantic_request);

    if !semantic_response.success {
        return PersonalizedSearchResponse {
            results: vec![],
            personalization_applied: false,
            confidence_score: 0.0,
            learning_insights: vec!["Search failed - could not analyze content".to_string()],
            suggestions: vec![],
            success: false,
            processing_time: elapsed_seconds(start_time),
        };
    }

    // Apply personalization if enabled
    let personalized_results = if request.use_personalization {
        personalize_search_results(
            semantic_response.results,
            &user_preferences,
            request.context.as_ref(),
        )
    } else {
        // Convert to personalized format without personalization
        semantic_response
            .results
            .into_iter()
            .map(|result| PersonalizedSearchResult {
                content_id: result.content_id,
                base_relevance_score: result.relevance_score,
                personalized_score: result.relevance_score,
                personalization_factors: vec![],
                semantic_similarity: result.semantic_similarity,
                keyword_match_score: result.keyword_match_score,
                context_relevance: result.context_relevance,
                snippet: result.snippet,
                highlights: result.highlights,
                confidence: 0.5,
            })
            .collect()
    };

    // Generate learning insights
    let learning_insights = vec!["Search completed successfully".to_string()];

    // Generate personalized suggestions
    let suggestions = generate_personalized_suggestions(&request.search_query, &user_preferences);

    PersonalizedSearchResponse {
        results: personalized_results,
        personalization_applied: request.use_personalization,
        confidence_score: 0.8, // Default confidence
        learning_insights,
        suggestions,
        success: true,
        processing_time: elapsed_seconds(start_time),
    }
}

// Helper Functions

/// Classify query intent
fn classify_query_intent(query: &str) -> String {
    let query_lower = query.to_lowercase();

    if query_lower.contains('?')
        || query_lower.starts_with("what")
        || query_lower.starts_with("how")
        || query_lower.starts_with("why")
        || query_lower.starts_with("when")
        || query_lower.starts_with("where")
    {
        "question".to_string()
    } else if query_lower.contains("find")
        || query_lower.contains("search")
        || query_lower.contains("show")
        || query_lower.contains("list")
    {
        "search".to_string()
    } else {
        "command".to_string()
    }
}

/// Classify query type
fn classify_query_type(query: &str) -> String {
    let query_lower = query.to_lowercase();

    if query_lower.contains("how to")
        || query_lower.contains("steps")
        || query_lower.contains("process")
        || query_lower.contains("procedure")
    {
        "procedural".to_string()
    } else if query_lower.contains("concept")
        || query_lower.contains("idea")
        || query_lower.contains("theory")
        || query_lower.contains("principle")
    {
        "conceptual".to_string()
    } else {
        "factual".to_string()
    }
}

/// Calculate keyword similarity between query and content
fn calculate_keyword_similarity(
    query_keywords: &[KeywordWithWeight],
    content_keywords: &[KeywordWithWeight],
) -> f64 {
    if query_keywords.is_empty() || content_keywords.is_empty() {
        return 0.0;
    }

    let mut similarity = 0.0;
    let mut total_weight = 0.0;

    for q_kw in query_keywords {
        total_weight += q_kw.weight;
        for c_kw in content_keywords {
            if q_kw.keyword == c_kw.keyword {
                similarity += q_kw.weight * c_kw.weight;
            } else if q_kw.keyword.contains(&c_kw.keyword) || c_kw.keyword.contains(&q_kw.keyword) {
                similarity += q_kw.weight * c_kw.weight * 0.5;
            }
        }
    }

    if total_weight > 0.0 {
        similarity / total_weight
    } else {
        0.0
    }
}

/// Calculate semantic similarity between query and content
fn calculate_semantic_similarity(
    query: &str,
    content: &str,
    analyzer: &TextAnalyzer,
) -> f64 {
    // Simplified semantic similarity using word overlap and context
    let query_lowercase = query.to_lowercase();
    let content_lowercase = content.to_lowercase();
    let query_words: Vec<&str> = query_lowercase.split_whitespace().collect();
    let content_words: Vec<&str> = content_lowercase.split_whitespace().collect();

    let mut overlap = 0;
    for q_word in &query_words {
        if content_words.contains(q_word) {
            overlap += 1;
        }
    }

    let base_similarity = overlap as f64 / query_words.len().max(1) as f64;

    // Boost similarity if content type matches query intent
    let content_complexity = analyzer.calculate_complexity(content);
    let query_complexity = analyzer.calculate_complexity(query);
    let complexity_similarity = 1.0 - (content_complexity - query_complexity).abs();

    (base_similarity * 0.7 + complexity_similarity * 0.3).min(1.0)
}

/// Calculate context relevance
fn calculate_context_relevance(query: &str, content: &str, analyzer: &TextAnalyzer) -> f64 {
    let query_entities = analyzer.extract_entities(query);
    let content_entities = analyzer.extract_entities(content);

    let mut entity_overlap = 0;
    for q_entity in &query_entities {
        for c_entity in &content_entities {
            if q_entity.text.to_lowercase() == c_entity.text.to_lowercase() {
                entity_overlap += 1;
            }
        }
    }

    let entity_similarity = if !query_entities.is_empty() {
        entity_overlap as f64 / query_entities.len() as f64
    } else {
        0.5
    };

    // Consider content type relevance
    let (query_type, _) = analyzer.detect_content_type(query);
    let (content_type, _) = analyzer.detect_content_type(content);

    let type_similarity = if query_type == content_type { 1.0 } else { 0.3 };

    (entity_similarity * 0.6 + type_similarity * 0.4).min(1.0)
}

/// Generate snippet from content
fn generate_snippet(content: &str, query: &str, max_length: usize) -> String {
    let query_words: Vec<String> = query
        .to_lowercase()
        .split_whitespace()
        .map(String::from)
        .collect();

    let sentences: Vec<&str> = content.split(&['.', '!', '?'][..]).collect();
    let mut best_sentence = "";
    let mut best_score = 0;

    for sentence in &sentences {
        let sentence_lower = sentence.to_lowercase();
        let mut score = 0;

        for word in &query_words {
            if sentence_lower.contains(word) {
                score += 1;
            }
        }

        if score > best_score {
            best_score = score;
            best_sentence = sentence;
        }
    }

    if best_sentence.is_empty() {
        best_sentence = sentences.first().unwrap_or(&"");
    }

    if best_sentence.len() > max_length {
        format!(
            "{}...",
            &best_sentence[..max_length.min(best_sentence.len())]
        )
    } else {
        best_sentence.to_string()
    }
}

/// Extract highlights from content
fn extract_highlights(content: &str, keywords: &[KeywordWithWeight]) -> Vec<String> {
    let content_lower = content.to_lowercase();
    let mut highlights = Vec::new();

    for keyword in keywords.iter().take(5) {
        if content_lower.contains(&keyword.keyword) {
            highlights.push(keyword.keyword.clone());
        }
    }

    highlights
}

/// Generate search suggestions
fn generate_search_suggestions(query: &str, analyzer: &TextAnalyzer) -> Vec<String> {
    let keywords = analyzer.extract_keywords_with_weights(query, "en");
    let mut suggestions = Vec::new();

    // Generate suggestions based on keywords
    for keyword in keywords.iter().take(3) {
        suggestions.push(format!("Search for more about {}", keyword.keyword));
        suggestions.push(format!("Find related content to {}", keyword.keyword));
    }

    // Add generic suggestions
    suggestions.push("Try using different keywords".to_string());
    suggestions.push("Search by content type".to_string());

    suggestions.truncate(5);
    suggestions
}

// Summary generation helper functions

/// Generate extractive summary
fn generate_extractive_summary(
    sentences: &[String],
    target_length: usize,
    analyzer: &TextAnalyzer,
) -> (String, Vec<String>, Vec<String>, f64) {
    // Score sentences based on position, length, and keyword density
    let mut sentence_scores: Vec<(usize, f64)> = Vec::new();

    for (idx, sentence) in sentences.iter().enumerate() {
        let mut score = 0.0;

        // Position score (first and last sentences are important)
        if idx == 0 || idx == sentences.len() - 1 {
            score += 2.0;
        }

        // Length score (not too short, not too long)
        let length = sentence.split_whitespace().count();
        if (5..=25).contains(&length) {
            score += 1.0;
        }

        // Keyword density
        let keywords = analyzer.extract_keywords_with_weights(sentence, "en");
        score += keywords.len() as f64 * 0.1;

        sentence_scores.push((idx, score));
    }

    // Sort by score and select top sentences
    sentence_scores.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

    let selected_indices: Vec<usize> = sentence_scores
        .iter()
        .take(target_length)
        .map(|(idx, _)| *idx)
        .collect();

    let mut selected_sentences = Vec::new();
    for &idx in &selected_indices {
        selected_sentences.push(sentences[idx].clone());
    }

    let summary = selected_sentences.join(". ");

    (summary, selected_sentences, vec![], 0.2) // Low abstraction level for extractive
}

/// Generate abstractive summary
fn generate_abstractive_summary(
    sentences: &[String],
    key_concepts: &[String],
    target_length: usize,
    style: &str,
) -> (String, Vec<String>, Vec<String>, f64) {
    // Generate new sentences based on key concepts
    let mut generated_sentences = Vec::new();

    // Simple template-based generation
    if !key_concepts.is_empty() {
        let intro = match style {
            "casual" => format!("This content mainly talks about {}.", key_concepts[0]),
            "technical" => format!("The primary focus involves {}.", key_concepts[0]),
            _ => format!("The main topic discusses {}.", key_concepts[0]),
        };
        generated_sentences.push(intro);

        if key_concepts.len() > 1 && target_length > 1 {
            let middle = format!(
                "Key aspects include {} and {}.",
                key_concepts
                    .get(1)
                    .unwrap_or(&"related concepts".to_string()),
                key_concepts
                    .get(2)
                    .unwrap_or(&"associated topics".to_string())
            );
            generated_sentences.push(middle);
        }

        if target_length > 2 {
            let conclusion = match style {
                "casual" => "Overall, it covers the main points effectively.",
                "technical" => "The analysis demonstrates comprehensive coverage of the subject matter.",
                _ => "In conclusion, the content addresses the essential elements.",
            };
            generated_sentences.push(conclusion.to_string());
        }
    }

    let summary = generated_sentences.join(" ");

    (summary, vec![], generated_sentences, 0.8) // High abstraction level for abstractive
}

/// Generate hybrid summary
fn generate_hybrid_summary(
    sentences: &[String],
    key_concepts: &[String],
    target_length: usize,
    style: &str,
    analyzer: &TextAnalyzer,
) -> (String, Vec<String>, Vec<String>, f64) {
    // Combine extractive and abstractive approaches
    let extract_count = target_length / 2;
    let generate_count = target_length - extract_count;

    // Get extractive summary
    let (extractive_part, original_sentences, _, _) =
        generate_extractive_summary(sentences, extract_count, analyzer);

    // Get abstractive summary
    let (abstractive_part, _, generated_sentences, _) =
        generate_abstractive_summary(sentences, key_concepts, generate_count, style);

    // Combine both
    let combined_summary = if !extractive_part.is_empty() && !abstractive_part.is_empty() {
        format!("{}. {}", abstractive_part, extractive_part)
    } else if !extractive_part.is_empty() {
        extractive_part
    } else {
        abstractive_part
    };

    (
        combined_summary,
        original_sentences,
        generated_sentences,
        0.5,
    ) // Medium abstraction level
}

/// Calculate coherence score
fn calculate_coherence_score(summary: &str, analyzer: &TextAnalyzer) -> f64 {
    let sentences: Vec<&str> = summary.split(&['.', '!', '?'][..]).collect();

    if sentences.len() < 2 {
        return 1.0;
    }

    let mut coherence_sum = 0.0;
    let mut comparisons = 0;

    for i in 0..sentences.len() - 1 {
        let similarity = calculate_sentence_similarity(sentences[i], sentences[i + 1]);
        coherence_sum += similarity;
        comparisons += 1;
    }

    if comparisons > 0 {
        coherence_sum / comparisons as f64
    } else {
        1.0
    }
}

/// Calculate sentence similarity for coherence
fn calculate_sentence_similarity(sent1: &str, sent2: &str) -> f64 {
    use std::collections::HashSet;
    
    let words1: HashSet<String> = sent1
        .to_lowercase()
        .split_whitespace()
        .map(String::from)
        .collect();

    let words2: HashSet<String> = sent2
        .to_lowercase()
        .split_whitespace()
        .map(String::from)
        .collect();

    let intersection: HashSet<_> = words1.intersection(&words2).collect();
    let union: HashSet<_> = words1.union(&words2).collect();

    if union.is_empty() {
        0.0
    } else {
        intersection.len() as f64 / union.len() as f64
    }
}
