// Enhanced Rust AI Service for VaultNotes Backend with ML Features
// src/encrypted-notes-backend/src/ai_service.rs

use candid::{CandidType, Deserialize};
use ic_cdk::api::time;
use std::collections::{HashSet, HashMap};

// Advanced AI Request/Response Types
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
    pub query: String,
    pub result_id: String,
    pub relevance_score: f64,
    pub clicked: bool,
    pub time_spent: f64,
}

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
    pub intent: String, // "search", "question", "command"
    pub query_type: String, // "factual", "conceptual", "procedural"
    pub entities: Vec<Entity>,
    pub keywords: Vec<String>,
    pub language: String,
    pub complexity: f64,
}

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

// Enhanced text preprocessing and analysis with ML capabilities
struct AdvancedTextAnalyzer {
    stop_words: HashMap<String, HashSet<String>>, // language -> stop words
    importance_indicators: HashMap<String, Vec<String>>,
    transition_words: HashMap<String, Vec<String>>,
    content_type_patterns: HashMap<String, Vec<String>>,
    language_patterns: HashMap<String, Vec<String>>,
    sentiment_keywords: HashMap<String, Vec<(String, f64)>>, // word -> sentiment score
}

impl AdvancedTextAnalyzer {
    fn new() -> Self {
        let mut analyzer = AdvancedTextAnalyzer {
            stop_words: HashMap::new(),
            importance_indicators: HashMap::new(),
            transition_words: HashMap::new(),
            content_type_patterns: HashMap::new(),
            language_patterns: HashMap::new(),
            sentiment_keywords: HashMap::new(),
        };

        // English stop words
        let english_stop_words = vec![
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

        // Indonesian stop words
        let indonesian_stop_words = vec![
            "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "dalam", "oleh",
            "akan", "telah", "sudah", "adalah", "ini", "itu", "saya", "anda", "kita", "mereka",
            "dia", "nya", "juga", "atau", "tidak", "bukan", "dapat", "bisa", "harus", "mau",
            "ingin", "perlu", "ada", "seperti", "karena", "jika", "kalau", "ketika", "saat",
            "sebagai", "antara", "sebelum", "sesudah", "selama", "sampai", "hingga", "bahwa"
        ].into_iter().map(|s| s.to_string()).collect();

        analyzer.stop_words.insert("en".to_string(), english_stop_words);
        analyzer.stop_words.insert("id".to_string(), indonesian_stop_words);

        // Content type patterns
        let mut content_patterns = HashMap::new();
        content_patterns.insert("meeting".to_string(), vec![
            "agenda".to_string(), "minutes".to_string(), "action items".to_string(),
            "attendees".to_string(), "discussion".to_string(), "decisions".to_string()
        ]);
        content_patterns.insert("technical".to_string(), vec![
            "implementation".to_string(), "algorithm".to_string(), "architecture".to_string(),
            "code".to_string(), "function".to_string(), "class".to_string(), "method".to_string()
        ]);
        content_patterns.insert("personal".to_string(), vec![
            "diary".to_string(), "journal".to_string(), "thoughts".to_string(),
            "feelings".to_string(), "today".to_string(), "yesterday".to_string()
        ]);
        content_patterns.insert("research".to_string(), vec![
            "hypothesis".to_string(), "methodology".to_string(), "results".to_string(),
            "conclusion".to_string(), "analysis".to_string(), "study".to_string()
        ]);

        analyzer.content_type_patterns = content_patterns;

        // Language detection patterns
        let mut lang_patterns = HashMap::new();
        lang_patterns.insert("en".to_string(), vec![
            "the".to_string(), "and".to_string(), "that".to_string(), "have".to_string(),
            "for".to_string(), "not".to_string(), "with".to_string(), "you".to_string()
        ]);
        lang_patterns.insert("id".to_string(), vec![
            "yang".to_string(), "dan".to_string(), "untuk".to_string(), "dengan".to_string(),
            "dalam".to_string(), "pada".to_string(), "adalah".to_string(), "ini".to_string()
        ]);

        analyzer.language_patterns = lang_patterns;

        // Sentiment keywords (simplified)
        let mut sentiment_en = vec![
            ("excellent".to_string(), 0.9), ("good".to_string(), 0.6), ("great".to_string(), 0.8),
            ("bad".to_string(), -0.6), ("terrible".to_string(), -0.9), ("awful".to_string(), -0.8),
            ("amazing".to_string(), 0.9), ("wonderful".to_string(), 0.8), ("horrible".to_string(), -0.8),
            ("fantastic".to_string(), 0.9), ("disappointing".to_string(), -0.6), ("satisfactory".to_string(), 0.3)
        ];

        analyzer.sentiment_keywords.insert("en".to_string(), sentiment_en);

        analyzer
    }

    // Advanced content type detection
    fn detect_content_type(&self, text: &str) -> (String, f64) {
        let text_lower = text.to_lowercase();
        let mut best_type = "general".to_string();
        let mut best_score = 0.0;

        for (content_type, patterns) in &self.content_type_patterns {
            let mut score = 0.0;
            let mut pattern_matches = 0;

            for pattern in patterns {
                if text_lower.contains(pattern) {
                    pattern_matches += 1;
                    score += 1.0;
                }
            }

            if pattern_matches > 0 {
                score = score / patterns.len() as f64;
                if score > best_score {
                    best_score = score;
                    best_type = content_type.clone();
                }
            }
        }

        (best_type, best_score.max(0.1))
    }

    // Language detection with confidence scoring
    fn detect_language(&self, text: &str) -> (String, f64) {
        let text_lower = text.to_lowercase();
        let words: Vec<&str> = text_lower.split_whitespace().collect();
        
        if words.is_empty() {
            return ("en".to_string(), 0.5);
        }

        let mut language_scores = HashMap::new();

        for (lang, patterns) in &self.language_patterns {
            let mut matches = 0;
            for word in &words {
                if patterns.contains(&word.to_string()) {
                    matches += 1;
                }
            }
            let score = matches as f64 / words.len() as f64;
            language_scores.insert(lang.clone(), score);
        }

        let best_lang = language_scores
            .iter()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
            .map(|(lang, score)| (lang.clone(), *score))
            .unwrap_or(("en".to_string(), 0.5));

        best_lang
    }

    // Extract entities (simplified NER)
    fn extract_entities(&self, text: &str) -> Vec<Entity> {
        let mut entities = Vec::new();
        let words: Vec<&str> = text.split_whitespace().collect();

        for (i, word) in words.iter().enumerate() {
            // Simple capitalization-based entity detection
            if word.chars().next().unwrap_or('a').is_uppercase() && word.len() > 2 {
                let entity_type = if i > 0 && (words[i-1] == "Mr." || words[i-1] == "Mrs." || words[i-1] == "Dr.") {
                    "PERSON"
                } else if word.ends_with("Inc.") || word.ends_with("Corp.") || word.ends_with("Ltd.") {
                    "ORGANIZATION"
                } else if word.chars().all(|c| c.is_alphabetic() || c == '.') {
                    "PERSON"
                } else {
                    "ENTITY"
                };

                entities.push(Entity {
                    text: word.to_string(),
                    entity_type: entity_type.to_string(),
                    confidence: 0.7,
                });
            }
        }

        entities
    }

    // Sentiment analysis
    fn analyze_sentiment(&self, text: &str, language: &str) -> (String, f64) {
        let text_lower = text.to_lowercase();
        let words: Vec<&str> = text_lower.split_whitespace().collect();
        
        if let Some(sentiment_words) = self.sentiment_keywords.get(language) {
            let mut total_sentiment = 0.0;
            let mut sentiment_count = 0;

            for word in words {
                for (sentiment_word, score) in sentiment_words {
                    if word.contains(sentiment_word) {
                        total_sentiment += score;
                        sentiment_count += 1;
                    }
                }
            }

            if sentiment_count > 0 {
                let avg_sentiment = total_sentiment / sentiment_count as f64;
                let sentiment_label = if avg_sentiment > 0.3 {
                    "positive"
                } else if avg_sentiment < -0.3 {
                    "negative"
                } else {
                    "neutral"
                };
                return (sentiment_label.to_string(), avg_sentiment.abs());
            }
        }

        ("neutral".to_string(), 0.5)
    }

    // Extract keywords with weights
    fn extract_keywords_with_weights(&self, text: &str, language: &str) -> Vec<KeywordWithWeight> {
        let text_lower = text.to_lowercase();
        let words: Vec<&str> = text_lower.split_whitespace()
            .filter(|word| word.len() > 3)
            .collect();

        let mut word_freq = HashMap::new();
        let stop_words = self.stop_words.get(language)
            .unwrap_or(&HashSet::new());

        for word in &words {
            let clean_word = word.trim_matches(|c: char| !c.is_alphabetic());
            if !stop_words.contains(clean_word) && clean_word.len() > 2 {
                *word_freq.entry(clean_word.to_string()).or_insert(0) += 1;
            }
        }

        let max_freq = word_freq.values().max().unwrap_or(&1);
        let mut keywords: Vec<KeywordWithWeight> = word_freq
            .into_iter()
            .map(|(word, freq)| KeywordWithWeight {
                keyword: word.clone(),
                weight: freq as f64 / *max_freq as f64,
                category: if word.len() > 8 { "complex".to_string() } else { "simple".to_string() },
            })
            .collect();

        keywords.sort_by(|a, b| b.weight.partial_cmp(&a.weight).unwrap());
        keywords.truncate(20);

        keywords
    }

    // Calculate text complexity
    fn calculate_complexity(&self, text: &str) -> f64 {
        let sentences: Vec<&str> = text.split(&['.', '!', '?'][..]).collect();
        let words: Vec<&str> = text.split_whitespace().collect();
        
        if sentences.is_empty() || words.is_empty() {
            return 0.0;
        }

        let avg_sentence_length = words.len() as f64 / sentences.len() as f64;
        let avg_word_length = words.iter()
            .map(|w| w.len())
            .sum::<usize>() as f64 / words.len() as f64;

        // Normalize to 0-1 scale
        let complexity = (avg_sentence_length / 20.0 + avg_word_length / 10.0) / 2.0;
        complexity.min(1.0)
    }
}
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

// Advanced AI Functions for Enhanced Search and Analysis

// Content Analysis Function
pub fn analyze_content(request: ContentAnalysisRequest) -> ContentAnalysisResponse {
    let start_time = ic_cdk::api::time();
    let analyzer = AdvancedTextAnalyzer::new();
    
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
    let topics: Vec<String> = keywords.iter()
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

// Semantic Search Function
pub fn semantic_search(request: SemanticSearchRequest) -> SemanticSearchResponse {
    let start_time = ic_cdk::api::time();
    let analyzer = AdvancedTextAnalyzer::new();
    
    // Analyze the query
    let query_language = request.language.unwrap_or_else(|| {
        analyzer.detect_language(&request.text_query).0
    });
    
    let query_entities = analyzer.extract_entities(&request.text_query);
    let query_keywords = analyzer.extract_keywords_with_weights(&request.text_query, &query_language);
    
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
        let keyword_similarity = calculate_keyword_similarity(
            &query_keywords,
            &content_keywords
        );
        
        let semantic_similarity = calculate_semantic_similarity(
            &request.text_query,
            content,
            &analyzer
        );
        
        let context_relevance = if request.search_type == "contextual" {
            calculate_context_relevance(&request.text_query, content, &analyzer)
        } else {
            0.5
        };
        
        // Combine scores based on search type
        let relevance_score = match request.search_type.as_str() {
            "semantic" => semantic_similarity * 0.7 + keyword_similarity * 0.3,
            "hybrid" => semantic_similarity * 0.4 + keyword_similarity * 0.4 + context_relevance * 0.2,
            "contextual" => context_relevance * 0.6 + semantic_similarity * 0.4,
            _ => keyword_similarity * 0.6 + semantic_similarity * 0.4,
        };
        
        if relevance_score > 0.1 { // Only include relevant results
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

// Abstract Summarization Function
pub fn generate_abstract_summary(request: AbstractSummaryRequest) -> AbstractSummaryResponse {
    let start_time = ic_cdk::api::time();
    let analyzer = AdvancedTextAnalyzer::new();
    
    let language = request.language.unwrap_or_else(|| {
        analyzer.detect_language(&request.text).0
    });
    
    // Split into sentences
    let sentences: Vec<String> = request.text
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
    let key_concepts: Vec<String> = keywords.iter()
        .take(8)
        .map(|kw| kw.keyword.clone())
        .collect();
    
    let target_length = request.target_length.unwrap_or(3) as usize;
    let summary_style = request.style.unwrap_or_else(|| "formal".to_string());
    
    let (summary, original_sentences, generated_sentences, abstraction_level) = 
        match request.summary_type.as_str() {
            "abstractive" => generate_abstractive_summary(
                &sentences, 
                &key_concepts, 
                target_length, 
                &summary_style
            ),
            "hybrid" => generate_hybrid_summary(
                &sentences, 
                &key_concepts, 
                target_length, 
                &summary_style,
                &analyzer
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

// Helper Functions

fn classify_query_intent(query: &str) -> String {
    let query_lower = query.to_lowercase();
    
    if query_lower.contains("?") || query_lower.starts_with("what") || 
       query_lower.starts_with("how") || query_lower.starts_with("why") ||
       query_lower.starts_with("when") || query_lower.starts_with("where") {
        "question".to_string()
    } else if query_lower.contains("find") || query_lower.contains("search") ||
              query_lower.contains("show") || query_lower.contains("list") {
        "search".to_string()
    } else {
        "command".to_string()
    }
}

fn classify_query_type(query: &str) -> String {
    let query_lower = query.to_lowercase();
    
    if query_lower.contains("how to") || query_lower.contains("steps") ||
       query_lower.contains("process") || query_lower.contains("procedure") {
        "procedural".to_string()
    } else if query_lower.contains("concept") || query_lower.contains("idea") ||
              query_lower.contains("theory") || query_lower.contains("principle") {
        "conceptual".to_string()
    } else {
        "factual".to_string()
    }
}

fn calculate_keyword_similarity(query_keywords: &[KeywordWithWeight], content_keywords: &[KeywordWithWeight]) -> f64 {
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

fn calculate_semantic_similarity(query: &str, content: &str, analyzer: &AdvancedTextAnalyzer) -> f64 {
    // Simplified semantic similarity using word overlap and context
    let query_words: Vec<&str> = query.to_lowercase().split_whitespace().collect();
    let content_words: Vec<&str> = content.to_lowercase().split_whitespace().collect();
    
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

fn calculate_context_relevance(query: &str, content: &str, analyzer: &AdvancedTextAnalyzer) -> f64 {
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

fn generate_snippet(content: &str, query: &str, max_length: usize) -> String {
    let query_words: Vec<String> = query.to_lowercase()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    
    let sentences: Vec<&str> = content.split(&['.', '!', '?'][..]).collect();
    let mut best_sentence = "";
    let mut best_score = 0;
    
    for sentence in sentences {
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
        format!("{}...", &best_sentence[..max_length.min(best_sentence.len())])
    } else {
        best_sentence.to_string()
    }
}

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

fn generate_search_suggestions(query: &str, analyzer: &AdvancedTextAnalyzer) -> Vec<String> {
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

fn generate_extractive_summary(sentences: &[String], target_length: usize, analyzer: &AdvancedTextAnalyzer) -> (String, Vec<String>, Vec<String>, f64) {
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
        if length >= 5 && length <= 25 {
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

fn generate_abstractive_summary(
    sentences: &[String], 
    key_concepts: &[String], 
    target_length: usize, 
    style: &str
) -> (String, Vec<String>, Vec<String>, f64) {
    // Generate new sentences based on key concepts
    let mut generated_sentences = Vec::new();
    
    // Simple template-based generation (in a real implementation, this would use a language model)
    if !key_concepts.is_empty() {
        let intro = match style {
            "casual" => format!("This content mainly talks about {}.", key_concepts[0]),
            "technical" => format!("The primary focus involves {}.", key_concepts[0]),
            _ => format!("The main topic discusses {}.", key_concepts[0]),
        };
        generated_sentences.push(intro);
        
        if key_concepts.len() > 1 && target_length > 1 {
            let middle = format!("Key aspects include {} and {}.", 
                key_concepts.get(1).unwrap_or(&"related concepts".to_string()),
                key_concepts.get(2).unwrap_or(&"associated topics".to_string())
            );
            generated_sentences.push(middle);
        }
        
        if target_length > 2 {
            let conclusion = match style {
                "casual" => "Overall, it covers the main points effectively.".to_string(),
                "technical" => "The analysis demonstrates comprehensive coverage of the subject matter.".to_string(),
                _ => "In conclusion, the content addresses the essential elements.".to_string(),
            };
            generated_sentences.push(conclusion);
        }
    }
    
    let summary = generated_sentences.join(" ");
    
    (summary, vec![], generated_sentences, 0.8) // High abstraction level for abstractive
}

fn generate_hybrid_summary(
    sentences: &[String], 
    key_concepts: &[String], 
    target_length: usize, 
    style: &str,
    analyzer: &AdvancedTextAnalyzer
) -> (String, Vec<String>, Vec<String>, f64) {
    // Combine extractive and abstractive approaches
    let extract_count = target_length / 2;
    let generate_count = target_length - extract_count;
    
    // Get extractive summary
    let (extractive_part, original_sentences, _, _) = generate_extractive_summary(
        sentences, extract_count, analyzer
    );
    
    // Get abstractive summary
    let (abstractive_part, _, generated_sentences, _) = generate_abstractive_summary(
        sentences, key_concepts, generate_count, style
    );
    
    // Combine both
    let combined_summary = if !extractive_part.is_empty() && !abstractive_part.is_empty() {
        format!("{}. {}", abstractive_part, extractive_part)
    } else if !extractive_part.is_empty() {
        extractive_part
    } else {
        abstractive_part
    };
    
    (combined_summary, original_sentences, generated_sentences, 0.5) // Medium abstraction level
}

fn calculate_coherence_score(summary: &str, analyzer: &AdvancedTextAnalyzer) -> f64 {
    let sentences: Vec<&str> = summary.split(&['.', '!', '?'][..]).collect();
    
    if sentences.len() < 2 {
        return 1.0;
    }
    
    let mut coherence_sum = 0.0;
    let mut comparisons = 0;
    
    for i in 0..sentences.len()-1 {
        let similarity = calculate_sentence_similarity(sentences[i], sentences[i+1], analyzer);
        coherence_sum += similarity;
        comparisons += 1;
    }
    
    if comparisons > 0 {
        coherence_sum / comparisons as f64
    } else {
        1.0
    }
}

fn calculate_sentence_similarity(sent1: &str, sent2: &str, analyzer: &AdvancedTextAnalyzer) -> f64 {
    let words1: HashSet<String> = sent1.to_lowercase()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    
    let words2: HashSet<String> = sent2.to_lowercase()
        .split_whitespace()
        .map(|s| s.to_string())
        .collect();
    
    let intersection: HashSet<_> = words1.intersection(&words2).collect();
    let union: HashSet<_> = words1.union(&words2).collect();
    
    if union.is_empty() {
        0.0
    } else {
        intersection.len() as f64 / union.len() as f64
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
