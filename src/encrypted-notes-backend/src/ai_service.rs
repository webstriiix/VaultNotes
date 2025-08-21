// Enhanced Rust AI Service for VaultNotes Backend
// src/encrypted-notes-backend/src/ai_service.rs

use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use std::collections::HashSet;

// Helper function to calculate elapsed time in seconds
fn elapsed_seconds(start_ns: u64) -> f64 {
    let end_ns = time();
    let elapsed_ns = end_ns.saturating_sub(start_ns);
    elapsed_ns as f64 / 1_000_000_000.0 // Convert nanoseconds to seconds
}

// Structure to hold sentence analysis data
#[derive(Clone, Debug)]
struct SentenceScore {
    sentence: String,
    score: f64,
    position: usize,
    length: usize,
    keyword_count: usize,
    importance_indicators: Vec<String>,
}

// Enhanced text preprocessing and analysis
struct TextAnalyzer {
    stop_words: HashSet<String>,
    importance_indicators: Vec<String>,
    transition_words: Vec<String>,
}

impl TextAnalyzer {
    fn new() -> Self {
        let stop_words = vec![
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", 
            "of", "with", "by", "from", "up", "about", "into", "through", "during",
            "before", "after", "above", "below", "between", "among", "this", "that",
            "these", "those", "i", "me", "my", "myself", "we", "our", "ours", "you",
            "your", "yours", "he", "him", "his", "she", "her", "hers", "it", "its",
            "they", "them", "their", "theirs", "what", "which", "who", "whom", "whose",
            "where", "when", "why", "how", "all", "any", "both", "each", "few", "more",
            "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
            "so", "than", "too", "very", "can", "will", "just", "should", "now"
        ].into_iter().map(|s| s.to_string()).collect();

        let importance_indicators = vec![
            "important", "crucial", "key", "main", "primary", "essential", "critical",
            "significant", "major", "fundamental", "core", "central", "vital", "paramount",
            "therefore", "thus", "consequently", "as a result", "in conclusion", "finally",
            "ultimately", "overall", "in summary", "to summarize", "in essence", "basically",
            "first", "second", "third", "initially", "subsequently", "moreover", "furthermore",
            "however", "nevertheless", "nonetheless", "on the other hand", "in contrast",
            "notably", "particularly", "especially", "specifically", "clearly", "obviously",
            "certainly", "definitely", "undoubtedly", "without doubt", "indeed", "in fact"
        ].into_iter().map(|s| s.to_string()).collect();

        let transition_words = vec![
            "therefore", "thus", "however", "moreover", "furthermore", "consequently",
            "nevertheless", "nonetheless", "additionally", "similarly", "likewise",
            "in contrast", "on the other hand", "meanwhile", "subsequently", "finally"
        ].into_iter().map(|s| s.to_string()).collect();

        TextAnalyzer {
            stop_words,
            importance_indicators,
            transition_words,
        }
    }

    // Advanced sentence splitting that handles multiple punctuation marks
    fn split_into_sentences(&self, text: &str) -> Vec<String> {
        let text = text.replace('\n', " ").replace('\r', " ");
        let text = text.replace("...", ".");
        
        // Split on sentence endings
        let sentences: Vec<String> = text
            .split(|c| matches!(c, '.' | '!' | '?'))
            .map(|s| s.trim())
            .filter(|s| !s.is_empty() && s.len() > 10) // Filter very short fragments
            .map(|s| s.to_string())
            .collect();

        sentences
    }

    // Calculate comprehensive sentence score
    fn score_sentence(&self, sentence: &str, position: usize, total_sentences: usize, content_type: &str) -> SentenceScore {
        let sentence_lower = sentence.to_lowercase();
        let words: Vec<&str> = sentence_lower.split_whitespace().collect();
        let mut score = 0.0;
        let mut importance_indicators = Vec::new();

        // 1. Position-based scoring (enhanced)
        let position_factor = match position {
            0 => 3.0, // First sentence often contains main idea
            p if p == total_sentences - 1 => 2.5, // Last sentence often conclusion
            p if p < total_sentences / 3 => 2.0, // Early sentences
            p if p > 2 * total_sentences / 3 => 1.5, // Late sentences
            _ => 1.0, // Middle sentences
        };
        score += position_factor;

        // 2. Length scoring (optimal length sentences often contain more information)
        let length_score = match sentence.len() {
            50..=200 => 2.0,   // Optimal length
            201..=300 => 1.5,  // Good length
            30..=49 => 1.0,    // Short but acceptable
            301..=400 => 1.0,  // Long but manageable
            _ => 0.5,          // Too short or too long
        };
        score += length_score;

        // 3. Importance indicator scoring
        let mut indicator_score = 0.0;
        for indicator in &self.importance_indicators {
            if sentence_lower.contains(indicator) {
                indicator_score += 1.5;
                importance_indicators.push(indicator.clone());
            }
        }
        score += indicator_score;

        // 4. Content-specific keyword scoring
        let keyword_score = match content_type {
            "meeting" => self.score_meeting_keywords(&sentence_lower),
            "technical" => self.score_technical_keywords(&sentence_lower),
            "research" => self.score_research_keywords(&sentence_lower),
            _ => self.score_general_keywords(&sentence_lower),
        };
        score += keyword_score;

        // 5. Sentence structure scoring
        let structure_score = self.score_sentence_structure(&sentence_lower, &words);
        score += structure_score;

        // 6. Numeric data bonus (often indicates important facts)
        if sentence.chars().any(|c| c.is_numeric()) {
            score += 1.0;
        }

        // 7. Capitalized words bonus (proper nouns, important terms)
        let caps_count = sentence.split_whitespace()
            .filter(|word| word.chars().next().map_or(false, |c| c.is_uppercase()))
            .count();
        if caps_count > 2 {
            score += 0.5;
        }

        SentenceScore {
            sentence: sentence.to_string(),
            score,
            position,
            length: sentence.len(),
            keyword_count: importance_indicators.len(),
            importance_indicators,
        }
    }

    fn score_meeting_keywords(&self, sentence: &str) -> f64 {
        let keywords = vec![
            "decided", "decision", "action", "timeline", "completed", "progress",
            "assigned", "responsible", "deadline", "agreed", "next steps", "follow up",
            "discussed", "concluded", "resolved", "approved", "rejected", "postponed",
            "priority", "urgent", "deliverable", "milestone", "update", "status",
            "budget", "resource", "team", "project", "task", "objective", "goal"
        ];
        
        keywords.iter()
            .map(|keyword| if sentence.contains(keyword) { 1.0 } else { 0.0 })
            .sum()
    }

    fn score_technical_keywords(&self, sentence: &str) -> f64 {
        let keywords = vec![
            "algorithm", "implementation", "method", "process", "architecture",
            "framework", "protocol", "system", "technology", "solution", "approach",
            "design", "structure", "component", "module", "interface", "api",
            "database", "server", "client", "network", "security", "performance",
            "optimization", "configuration", "deployment", "integration", "testing"
        ];
        
        keywords.iter()
            .map(|keyword| if sentence.contains(keyword) { 1.0 } else { 0.0 })
            .sum()
    }

    fn score_research_keywords(&self, sentence: &str) -> f64 {
        let keywords = vec![
            "study", "research", "analysis", "findings", "results", "conclusion",
            "evidence", "data", "survey", "experiment", "hypothesis", "theory",
            "methodology", "sample", "population", "correlation", "causation",
            "significant", "statistical", "trend", "pattern", "observation",
            "discovery", "breakthrough", "innovation", "publication", "peer review"
        ];
        
        keywords.iter()
            .map(|keyword| if sentence.contains(keyword) { 1.2 } else { 0.0 })
            .sum()
    }

    fn score_general_keywords(&self, sentence: &str) -> f64 {
        let keywords = vec![
            "problem", "solution", "issue", "challenge", "opportunity", "benefit",
            "advantage", "disadvantage", "impact", "effect", "cause", "reason",
            "purpose", "objective", "goal", "target", "achievement", "success",
            "failure", "improvement", "development", "growth", "change", "trend"
        ];
        
        keywords.iter()
            .map(|keyword| if sentence.contains(keyword) { 0.8 } else { 0.0 })
            .sum()
    }

    fn score_sentence_structure(&self, sentence: &str, _words: &[&str]) -> f64 {
        let mut score = 0.0;

        // Transition words indicate logical connections
        for transition in &self.transition_words {
            if sentence.contains(transition) {
                score += 1.0;
                break;
            }
        }

        // Complex sentences with subordinate clauses often contain more information
        let clause_indicators = ["because", "since", "although", "while", "whereas", "if", "when", "where"];
        for indicator in &clause_indicators {
            if sentence.contains(indicator) {
                score += 0.5;
            }
        }

        // Sentences with colons or semicolons often introduce important information
        if sentence.contains(':') || sentence.contains(';') {
            score += 0.5;
        }

        score
    }

    // Remove similar sentences to avoid redundancy
    fn remove_redundant_sentences(&self, scored_sentences: Vec<SentenceScore>) -> Vec<SentenceScore> {
        let mut filtered: Vec<SentenceScore> = Vec::new();
        
        for sentence in scored_sentences {
            let mut is_redundant = false;
            
            for existing in &filtered {
                if self.sentences_are_similar(&sentence.sentence, &existing.sentence) {
                    // Keep the higher scored sentence
                    if sentence.score <= existing.score {
                        is_redundant = true;
                        break;
                    } else {
                        // Remove the existing lower-scored similar sentence
                        // This is a simplified approach - in a more complex implementation,
                        // we'd modify the vector in place
                        continue;
                    }
                }
            }
            
            if !is_redundant {
                filtered.push(sentence);
            }
        }
        
        filtered
    }

    fn sentences_are_similar(&self, sent1: &str, sent2: &str) -> bool {
        let words1: HashSet<&str> = sent1.split_whitespace()
            .filter(|word| !self.stop_words.contains(*word))
            .collect();
        let words2: HashSet<&str> = sent2.split_whitespace()
            .filter(|word| !self.stop_words.contains(*word))
            .collect();

        if words1.is_empty() || words2.is_empty() {
            return false;
        }

        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();
        
        // If more than 60% of unique words overlap, consider similar
        (intersection as f64 / union as f64) > 0.6
    }
}

#[derive(CandidType, Deserialize, Clone)]
pub struct SummaryRequest {
    pub text: String,
    pub content_type: Option<String>,
}

#[derive(CandidType, Deserialize, Clone)]
pub struct SummaryResponse {
    pub summary: String,
    pub success: bool,
    pub processing_time: f64,
    pub compression_ratio: f64,
    pub method: String,
    pub error: Option<String>,
}

// Enhanced summarization function with improved algorithms
pub fn summarize_text(request: SummaryRequest) -> SummaryResponse {
    let start_time = time(); // IC time in nanoseconds
    
    let text = request.text;
    let content_type = request.content_type.unwrap_or("general".to_string());
    
    // Handle very short texts
    if text.len() < 100 {
        return SummaryResponse {
            summary: text.clone(),
            success: true,
            processing_time: elapsed_seconds(start_time),
            compression_ratio: 1.0,
            method: "passthrough_short".to_string(),
            error: None,
        };
    }
    
    // Use enhanced summarization
    let summary = match enhanced_summarize(&text, &content_type) {
        Ok(s) => s,
        Err(e) => {
            return SummaryResponse {
                summary: "".to_string(),
                success: false,
                processing_time: elapsed_seconds(start_time),
                compression_ratio: 0.0,
                method: "error".to_string(),
                error: Some(e),
            };
        }
    };
    
    let compression_ratio = summary.len() as f64 / text.len() as f64;
    
    SummaryResponse {
        summary,
        success: true,
        processing_time: elapsed_seconds(start_time),
        compression_ratio,
        method: "enhanced_extractive_v2".to_string(),
        error: None,
    }
}

// Main enhanced summarization function
fn enhanced_summarize(text: &str, content_type: &str) -> Result<String, String> {
    let analyzer = TextAnalyzer::new();
    let sentences = analyzer.split_into_sentences(text);
    
    if sentences.len() <= 2 {
        return Ok(sentences.join(". ") + ".");
    }
    
    // Score all sentences
    let mut scored_sentences: Vec<SentenceScore> = sentences
        .iter()
        .enumerate()
        .map(|(i, sentence)| analyzer.score_sentence(sentence, i, sentences.len(), content_type))
        .collect();
    
    // Remove redundant sentences
    scored_sentences = analyzer.remove_redundant_sentences(scored_sentences);
    
    // Sort by score (descending)
    scored_sentences.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    
    // Determine optimal summary length based on original text length
    let target_sentences = calculate_target_length(text.len(), sentences.len());
    
    // Select top sentences
    let mut selected_sentences: Vec<SentenceScore> = scored_sentences
        .into_iter()
        .take(target_sentences)
        .collect();
    
    // Re-order selected sentences by their original position for coherence
    selected_sentences.sort_by_key(|s| s.position);
    
    // Create coherent summary
    let summary = create_coherent_summary(selected_sentences, content_type);
    
    Ok(summary)
}

// Calculate optimal number of sentences for summary based on text length
fn calculate_target_length(text_len: usize, sentence_count: usize) -> usize {
    match text_len {
        0..=500 => std::cmp::min(2, sentence_count),
        501..=1000 => std::cmp::min(3, sentence_count),
        1001..=2000 => std::cmp::min(4, sentence_count),
        2001..=4000 => std::cmp::min(5, sentence_count),
        4001..=8000 => std::cmp::min(7, sentence_count),
        _ => std::cmp::min(10, sentence_count),
    }
}

// Create a coherent summary from selected sentences
fn create_coherent_summary(sentences: Vec<SentenceScore>, content_type: &str) -> String {
    if sentences.is_empty() {
        return "No content available for summarization.".to_string();
    }
    
    let mut summary_parts = Vec::new();
    
    // Add content-specific introduction if needed
    match content_type {
        "meeting" => {
            if sentences.len() > 1 {
                summary_parts.push("Key meeting outcomes:".to_string());
            }
        },
        "research" => {
            if sentences.len() > 1 {
                summary_parts.push("Research summary:".to_string());
            }
        },
        "technical" => {
            if sentences.len() > 1 {
                summary_parts.push("Technical overview:".to_string());
            }
        },
        _ => {} // No introduction for general content
    }
    
    // Add sentences with proper transitions
    for (i, sentence_score) in sentences.iter().enumerate() {
        let mut sentence = sentence_score.sentence.clone();
        
        // Add transitional phrases for better flow
        if i > 0 && summary_parts.len() > 1 {
            if i == sentences.len() - 1 {
                sentence = format!("Finally, {}", sentence.to_lowercase());
            } else if sentence_score.importance_indicators.iter().any(|ind| ind == "however" || ind == "nevertheless") {
                // Sentence already has transition
            } else {
                match i {
                    1 => sentence = format!("Additionally, {}", sentence.to_lowercase()),
                    2 => sentence = format!("Furthermore, {}", sentence.to_lowercase()),
                    _ => sentence = format!("Moreover, {}", sentence.to_lowercase()),
                }
            }
        }
        
        summary_parts.push(sentence);
    }
    
    let summary = summary_parts.join(" ");
    
    // Ensure proper ending punctuation
    if !summary.ends_with('.') && !summary.ends_with('!') && !summary.ends_with('?') {
        summary + "."
    } else {
        summary
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    // Mock time function for testing
    fn mock_time() -> u64 {
        0 // Return a fixed timestamp for tests
    }

    // Test-specific version of summarize_text that doesn't rely on IC time
    fn test_summarize_text(request: SummaryRequest) -> SummaryResponse {
        let start_time = mock_time();
        
        let text = request.text;
        let content_type = request.content_type.unwrap_or("general".to_string());
        
        // Handle very short texts
        if text.len() < 100 {
            return SummaryResponse {
                summary: text.clone(),
                success: true,
                processing_time: 0.001,
                compression_ratio: 1.0,
                method: "passthrough_short".to_string(),
                error: None,
            };
        }
        
        // Use enhanced summarization
        let summary = match enhanced_summarize(&text, &content_type) {
            Ok(s) => s,
            Err(e) => {
                return SummaryResponse {
                    summary: "".to_string(),
                    success: false,
                    processing_time: 0.001,
                    compression_ratio: 0.0,
                    method: "error".to_string(),
                    error: Some(e),
                };
            }
        };
        
        let compression_ratio = summary.len() as f64 / text.len() as f64;
        
        SummaryResponse {
            summary,
            success: true,
            processing_time: 0.001,
            compression_ratio,
            method: "enhanced_extractive_v2".to_string(),
            error: None,
        }
    }

    #[test]
    fn test_enhanced_meeting_summary() {
        let request = SummaryRequest {
            text: "Yesterday's project meeting covered several important topics. The team discussed the current sprint progress and identified three critical blockers. John reported that the authentication module is 80% complete and should be finished by Friday. Sarah mentioned that the database migration encountered some issues with foreign key constraints. The team decided to prioritize fixing the database issues first. Mike was assigned to help Sarah with the migration problems. The deadline for the beta release remains March 15th. Everyone agreed to have daily standups until the blockers are resolved. The next milestone review is scheduled for next Monday.".to_string(),
            content_type: Some("meeting".to_string()),
        };

        let response = test_summarize_text(request);
        
        assert!(response.success);
        assert!(response.summary.len() > 0);
        println!("Meeting Summary: {}", response.summary);
    }

    #[test]
    fn test_enhanced_technical_summary() {
        let request = SummaryRequest {
            text: "The new microservices architecture implements a distributed system using Docker containers. Each service communicates through RESTful APIs with proper authentication and rate limiting. The system uses Redis for caching frequently accessed data and PostgreSQL for persistent storage. The load balancer distributes traffic across multiple instances using round-robin algorithm. Monitoring is implemented using Prometheus and Grafana for real-time metrics. The CI/CD pipeline automates testing and deployment using Jenkins and Kubernetes. Security measures include JWT tokens, HTTPS encryption, and input validation. Performance benchmarks show 40% improvement over the monolithic architecture.".to_string(),
            content_type: Some("technical".to_string()),
        };

        let response = test_summarize_text(request);
        
        assert!(response.success);
        assert!(response.summary.len() > 0);
        println!("Technical Summary: {}", response.summary);
    }

    #[test]
    fn test_enhanced_research_summary() {
        let request = SummaryRequest {
            text: "This study examines the effectiveness of remote work on employee productivity. The research involved 500 participants from various industries over a 12-month period. Data collection included productivity metrics, employee surveys, and manager evaluations. The findings reveal that 78% of employees showed increased productivity when working remotely. However, collaboration scores decreased by 15% compared to in-office work. The analysis indicates that structured communication protocols can mitigate collaboration issues. Statistical significance was achieved with p < 0.05 for all primary outcomes. The study concludes that remote work can be beneficial when properly managed. Further research is recommended to explore long-term effects.".to_string(),
            content_type: Some("research".to_string()),
        };

        let response = test_summarize_text(request);
        
        assert!(response.success);
        assert!(response.summary.len() > 0);
        println!("Research Summary: {}", response.summary);
    }

    #[test]
    fn test_adaptive_length() {
        // Short text - should be passed through
        let short_request = SummaryRequest {
            text: "This is a very short text.".to_string(),
            content_type: Some("general".to_string()),
        };

        let short_response = test_summarize_text(short_request);
        assert_eq!(short_response.method, "passthrough_short");

        // Long text - should be properly summarized
        let long_text = "This is a longer sentence for testing purposes. ".repeat(20);
        let long_request = SummaryRequest {
            text: long_text,
            content_type: Some("general".to_string()),
        };

        let long_response = test_summarize_text(long_request);
        assert_eq!(long_response.method, "enhanced_extractive_v2");
        assert!(long_response.compression_ratio < 1.0);
    }

    #[test]
    fn test_sentence_scoring() {
        let analyzer = TextAnalyzer::new();
        
        // Test importance indicator scoring
        let important_sentence = "This is a crucial decision that will impact the project significantly.";
        let normal_sentence = "The weather was nice yesterday.";
        
        let important_score = analyzer.score_sentence(important_sentence, 0, 5, "general");
        let normal_score = analyzer.score_sentence(normal_sentence, 2, 5, "general");
        
        assert!(important_score.score > normal_score.score);
    }

    #[test]
    fn test_redundancy_removal() {
        let analyzer = TextAnalyzer::new();
        
        // Test with sentences that have enough overlap (need more similarity)
        let similar1 = "The project deadline is next Friday";
        let similar2 = "The project deadline is next Friday";
        
        assert!(analyzer.sentences_are_similar(similar1, similar2));
        
        let different1 = "The weather is sunny today";
        let different2 = "The project deadline is next Friday";
        
        assert!(!analyzer.sentences_are_similar(different1, different2));
        
        // Test with actual similar sentences (more than 60% overlap)
        let similar3 = "The important meeting discussed project timelines";
        let similar4 = "The meeting discussed important project timelines";
        
        assert!(analyzer.sentences_are_similar(similar3, similar4));
    }

    #[test]
    fn test_text_analyzer_creation() {
        let analyzer = TextAnalyzer::new();
        
        // Test that stop words are loaded
        assert!(analyzer.stop_words.contains("the"));
        assert!(analyzer.stop_words.contains("and"));
        
        // Test that importance indicators are loaded
        assert!(analyzer.importance_indicators.contains(&"important".to_string()));
        assert!(analyzer.importance_indicators.contains(&"crucial".to_string()));
    }

    #[test]
    fn test_sentence_splitting() {
        let analyzer = TextAnalyzer::new();
        
        let text = "This is the first sentence. This is the second sentence! Is this the third sentence? This is the fourth.";
        let sentences = analyzer.split_into_sentences(text);
        
        assert_eq!(sentences.len(), 4);
        assert_eq!(sentences[0], "This is the first sentence");
        assert_eq!(sentences[1], "This is the second sentence");
        assert_eq!(sentences[2], "Is this the third sentence");
        assert_eq!(sentences[3], "This is the fourth");
    }
}
