// Advanced Text Analyzer Module
// src/encrypted-notes-backend/src/ai/analyzer.rs

use std::collections::{HashMap, HashSet};
use super::types::{KeywordWithWeight, Entity};

/// Advanced text analyzer for content analysis and NLP tasks
pub struct TextAnalyzer {
    stop_words: HashMap<String, HashSet<String>>,
    content_type_patterns: HashMap<String, Vec<String>>,
    language_patterns: HashMap<String, Vec<String>>,
    sentiment_keywords: HashMap<String, Vec<(String, f64)>>,
}

impl TextAnalyzer {
    /// Create a new TextAnalyzer with predefined patterns and vocabularies
    pub fn new() -> Self {
        let mut analyzer = TextAnalyzer {
            stop_words: HashMap::new(),
            content_type_patterns: HashMap::new(),
            language_patterns: HashMap::new(),
            sentiment_keywords: HashMap::new(),
        };

        analyzer.initialize_vocabularies();
        analyzer
    }

    /// Initialize stop words, patterns, and sentiment vocabularies
    fn initialize_vocabularies(&mut self) {
        // English stop words
        let english_stop_words: HashSet<String> = vec![
            "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with",
            "by", "from", "up", "about", "into", "through", "during", "before", "after", "above",
            "below", "between", "among", "this", "that", "these", "those", "i", "me", "my",
            "myself", "we", "our", "ours", "you", "your", "yours", "he", "him", "his", "she",
            "her", "hers", "it", "its", "they", "them", "their", "theirs", "what", "which", "who",
            "whom", "whose", "where", "when", "why", "how", "all", "any", "both", "each", "few",
            "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
            "so", "than", "too", "very", "can", "will", "just", "should", "now",
        ]
        .into_iter()
        .map(String::from)
        .collect();

        // Indonesian stop words
        let indonesian_stop_words: HashSet<String> = vec![
            "yang", "dan", "di", "ke", "dari", "untuk", "dengan", "pada", "dalam", "oleh", "akan",
            "telah", "sudah", "adalah", "ini", "itu", "saya", "anda", "kita", "mereka", "dia",
            "nya", "juga", "atau", "tidak", "bukan", "dapat", "bisa", "harus", "mau", "ingin",
            "perlu", "ada", "seperti", "karena", "jika", "kalau", "ketika", "saat", "sebagai",
            "antara", "sebelum", "sesudah", "selama", "sampai", "hingga", "bahwa",
        ]
        .into_iter()
        .map(String::from)
        .collect();

        self.stop_words.insert("en".to_string(), english_stop_words);
        self.stop_words.insert("id".to_string(), indonesian_stop_words);

        // Content type patterns
        self.content_type_patterns.insert(
            "meeting".to_string(),
            vec![
                "agenda", "minutes", "action items", "attendees", 
                "discussion", "decisions", "meeting", "standup"
            ].into_iter().map(String::from).collect(),
        );
        
        self.content_type_patterns.insert(
            "technical".to_string(),
            vec![
                "implementation", "algorithm", "architecture", "code", 
                "function", "class", "method", "system", "api"
            ].into_iter().map(String::from).collect(),
        );
        
        self.content_type_patterns.insert(
            "research".to_string(),
            vec![
                "hypothesis", "methodology", "results", "conclusion", 
                "analysis", "study", "experiment", "data"
            ].into_iter().map(String::from).collect(),
        );

        // Language detection patterns
        self.language_patterns.insert(
            "en".to_string(),
            vec!["the", "and", "that", "have", "for", "not", "with", "you"]
                .into_iter().map(String::from).collect(),
        );
        
        self.language_patterns.insert(
            "id".to_string(),
            vec!["yang", "dan", "untuk", "dengan", "dalam", "pada", "adalah", "ini"]
                .into_iter().map(String::from).collect(),
        );

        // Sentiment keywords
        let sentiment_en = vec![
            ("excellent".to_string(), 0.9),
            ("good".to_string(), 0.6),
            ("great".to_string(), 0.8),
            ("bad".to_string(), -0.6),
            ("terrible".to_string(), -0.9),
            ("awful".to_string(), -0.8),
            ("amazing".to_string(), 0.9),
            ("wonderful".to_string(), 0.8),
            ("horrible".to_string(), -0.8),
            ("fantastic".to_string(), 0.9),
            ("disappointing".to_string(), -0.6),
            ("satisfactory".to_string(), 0.3),
        ];

        self.sentiment_keywords.insert("en".to_string(), sentiment_en);
    }

    /// Detect content type with confidence score
    pub fn detect_content_type(&self, text: &str) -> (String, f64) {
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

    /// Detect language with confidence scoring
    pub fn detect_language(&self, text: &str) -> (String, f64) {
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

        language_scores
            .iter()
            .max_by(|a, b| a.1.partial_cmp(b.1).unwrap())
            .map(|(lang, score)| (lang.clone(), *score))
            .unwrap_or(("en".to_string(), 0.5))
    }

    /// Extract entities using simple NER techniques
    pub fn extract_entities(&self, text: &str) -> Vec<Entity> {
        let mut entities = Vec::new();
        let words: Vec<&str> = text.split_whitespace().collect();

        for (i, word) in words.iter().enumerate() {
            // Simple capitalization-based entity detection
            if word.chars().next().unwrap_or('a').is_uppercase() && word.len() > 2 {
                let entity_type = if i > 0
                    && (words[i - 1] == "Mr." || words[i - 1] == "Mrs." || words[i - 1] == "Dr.")
                {
                    "PERSON"
                } else if word.ends_with("Inc.")
                    || word.ends_with("Corp.")
                    || word.ends_with("Ltd.")
                {
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

    /// Analyze sentiment of text
    pub fn analyze_sentiment(&self, text: &str, language: &str) -> (String, f64) {
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

    /// Extract keywords with weights
    pub fn extract_keywords_with_weights(&self, text: &str, language: &str) -> Vec<KeywordWithWeight> {
        let text_lower = text.to_lowercase();
        let words: Vec<&str> = text_lower
            .split_whitespace()
            .filter(|word| word.len() > 3)
            .collect();

        let mut word_freq = HashMap::new();
        let empty_set = HashSet::new();
        let stop_words = self.stop_words.get(language).unwrap_or(&empty_set);

        for word in &words {
            let clean_word = word.trim_matches(|c: char| !c.is_alphabetic());
            if !stop_words.contains(clean_word) && clean_word.len() > 2 {
                *word_freq.entry(clean_word.to_string()).or_insert(0) += 1;
            }
        }

        let max_freq = *word_freq.values().max().unwrap_or(&1);
        let mut keywords: Vec<KeywordWithWeight> = word_freq
            .into_iter()
            .map(|(word, freq)| KeywordWithWeight {
                keyword: word.clone(),
                weight: freq as f64 / max_freq as f64,
                category: if word.len() > 8 {
                    "complex".to_string()
                } else {
                    "simple".to_string()
                },
            })
            .collect();

        keywords.sort_by(|a, b| b.weight.partial_cmp(&a.weight).unwrap());
        keywords.truncate(20);

        keywords
    }

    /// Calculate text complexity score
    pub fn calculate_complexity(&self, text: &str) -> f64 {
        let sentences: Vec<&str> = text.split(&['.', '!', '?'][..]).collect();
        let words: Vec<&str> = text.split_whitespace().collect();

        if sentences.is_empty() || words.is_empty() {
            return 0.0;
        }

        let avg_sentence_length = words.len() as f64 / sentences.len() as f64;
        let avg_word_length =
            words.iter().map(|w| w.len()).sum::<usize>() as f64 / words.len() as f64;

        // Normalize to 0-1 scale
        let complexity = (avg_sentence_length / 20.0 + avg_word_length / 10.0) / 2.0;
        complexity.min(1.0)
    }

    /// Split text into sentences
    pub fn split_into_sentences(&self, text: &str) -> Vec<String> {
        text.split(&['.', '!', '?'][..])
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .collect()
    }

    /// Score a sentence for summarization
    pub fn score_sentence(&self, sentence: &str, _content_type: &str) -> f64 {
        let words: Vec<&str> = sentence.split_whitespace().collect();
        let mut score = 0.0;

        // Basic scoring: longer sentences get higher scores
        score += words.len() as f64 * 0.1;

        // Bonus for sentences with numbers or specific keywords
        if sentence.chars().any(|c| c.is_numeric()) {
            score += 1.0;
        }

        // Bonus for sentences with important indicators
        let importance_indicators = ["important", "crucial", "significant", "key", "major"];
        for indicator in &importance_indicators {
            if sentence.to_lowercase().contains(indicator) {
                score += 0.5;
            }
        }

        score
    }

    /// Select top sentences for summary
    pub fn select_top_sentences(
        &self,
        scored_sentences: Vec<(String, f64)>,
        target_count: usize,
    ) -> Vec<String> {
        let mut sorted_sentences = scored_sentences;
        sorted_sentences.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());

        sorted_sentences
            .into_iter()
            .take(target_count)
            .map(|(sentence, _)| sentence)
            .collect()
    }

    /// Generate summary text from selected sentences
    pub fn generate_summary_text(&self, sentences: Vec<String>) -> String {
        if sentences.is_empty() {
            return "No content available for summarization.".to_string();
        }
        sentences.join(". ") + "."
    }
}

impl Default for TextAnalyzer {
    fn default() -> Self {
        Self::new()
    }
}

