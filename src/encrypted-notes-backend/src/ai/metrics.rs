// AI Metrics and Performance Measurement Module
// src/encrypted-notes-backend/src/ai/metrics.rs

use std::collections::HashSet;

/// Structure to hold summary quality metrics
#[derive(Clone, Debug)]
pub struct SummaryMetrics {
    pub rouge_1: f64,         // Unigram overlap
    pub rouge_2: f64,         // Bigram overlap
    pub rouge_l: f64,         // Longest common subsequence
    pub bleu_score: f64,      // BLEU score for quality
    pub compression_ratio: f64, // Length ratio
    pub informativeness: f64,  // Information density
    pub coherence_score: f64,  // Text coherence
    pub readability_score: f64, // Readability (Flesch-Kincaid)
    pub redundancy_score: f64, // Redundancy detection
    pub coverage_score: f64,   // Topic coverage
}

impl SummaryMetrics {
    /// Create a new metrics instance with default values
    pub fn new() -> Self {
        SummaryMetrics {
            rouge_1: 0.0,
            rouge_2: 0.0,
            rouge_l: 0.0,
            bleu_score: 0.0,
            compression_ratio: 0.0,
            informativeness: 0.0,
            coherence_score: 0.0,
            readability_score: 0.0,
            redundancy_score: 0.0,
            coverage_score: 0.0,
        }
    }

    /// Calculate comprehensive metrics for a summary
    pub fn calculate_all_metrics(
        original_text: &str,
        summary: &str,
        reference_summary: Option<&str>,
    ) -> Self {
        let mut metrics = SummaryMetrics::new();

        // Basic metrics
        metrics.compression_ratio = summary.len() as f64 / original_text.len() as f64;
        metrics.informativeness = Self::calculate_informativeness(original_text, summary);
        metrics.coherence_score = Self::calculate_coherence(summary);
        metrics.readability_score = Self::calculate_readability(summary);
        metrics.redundancy_score = Self::calculate_redundancy(summary);
        metrics.coverage_score = Self::calculate_coverage(original_text, summary);

        // If reference summary provided, calculate ROUGE and BLEU
        if let Some(reference) = reference_summary {
            metrics.rouge_1 = Self::calculate_rouge_n(summary, reference, 1);
            metrics.rouge_2 = Self::calculate_rouge_n(summary, reference, 2);
            metrics.rouge_l = Self::calculate_rouge_l(summary, reference);
            metrics.bleu_score = Self::calculate_bleu(summary, reference);
        } else {
            // Use original text as pseudo-reference for automated evaluation
            metrics.rouge_1 = Self::calculate_rouge_n(summary, original_text, 1);
            metrics.rouge_2 = Self::calculate_rouge_n(summary, original_text, 2);
            metrics.rouge_l = Self::calculate_rouge_l(summary, original_text);
        }

        metrics
    }

    /// Calculate ROUGE-N score (precision, recall, F1)
    fn calculate_rouge_n(candidate: &str, reference: &str, n: usize) -> f64 {
        let candidate_ngrams = Self::extract_ngrams(candidate, n);
        let reference_ngrams = Self::extract_ngrams(reference, n);

        if reference_ngrams.is_empty() {
            return 0.0;
        }

        let mut matches = 0;
        for ngram in &candidate_ngrams {
            if reference_ngrams.contains(ngram) {
                matches += 1;
            }
        }

        let precision = if candidate_ngrams.is_empty() {
            0.0
        } else {
            matches as f64 / candidate_ngrams.len() as f64
        };

        let recall = matches as f64 / reference_ngrams.len() as f64;

        // F1 score
        if precision + recall == 0.0 {
            0.0
        } else {
            2.0 * (precision * recall) / (precision + recall)
        }
    }

    /// Extract n-grams from text
    fn extract_ngrams(text: &str, n: usize) -> Vec<String> {
        let text_lower = text.to_lowercase();
        let words: Vec<&str> = text_lower
            .split_whitespace()
            .collect();

        if words.len() < n {
            return vec![];
        }

        words
            .windows(n)
            .map(|window| window.join(" "))
            .collect()
    }

    /// Calculate ROUGE-L (Longest Common Subsequence)
    fn calculate_rouge_l(candidate: &str, reference: &str) -> f64 {
        let candidate_words: Vec<&str> = candidate.split_whitespace().collect();
        let reference_words: Vec<&str> = reference.split_whitespace().collect();

        if candidate_words.is_empty() || reference_words.is_empty() {
            return 0.0;
        }

        let lcs_length = Self::lcs_length(&candidate_words, &reference_words);

        let precision = lcs_length as f64 / candidate_words.len() as f64;
        let recall = lcs_length as f64 / reference_words.len() as f64;

        if precision + recall == 0.0 {
            0.0
        } else {
            2.0 * (precision * recall) / (precision + recall)
        }
    }

    /// Calculate Longest Common Subsequence length
    fn lcs_length(seq1: &[&str], seq2: &[&str]) -> usize {
        let m = seq1.len();
        let n = seq2.len();
        let mut dp = vec![vec![0; n + 1]; m + 1];

        for i in 1..=m {
            for j in 1..=n {
                if seq1[i - 1] == seq2[j - 1] {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = dp[i - 1][j].max(dp[i][j - 1]);
                }
            }
        }

        dp[m][n]
    }

    /// Calculate BLEU score (simplified implementation)
    fn calculate_bleu(candidate: &str, reference: &str) -> f64 {
        // Calculate precision for 1-grams to 4-grams
        let mut precisions = Vec::new();

        for n in 1..=4 {
            let candidate_ngrams = Self::extract_ngrams(candidate, n);
            let reference_ngrams = Self::extract_ngrams(reference, n);

            if candidate_ngrams.is_empty() {
                precisions.push(0.0);
                continue;
            }

            let mut matches = 0;
            for ngram in &candidate_ngrams {
                if reference_ngrams.contains(ngram) {
                    matches += 1;
                }
            }

            let precision = matches as f64 / candidate_ngrams.len() as f64;
            precisions.push(precision);
        }

        // Geometric mean of precisions
        if precisions.iter().any(|&p| p == 0.0) {
            return 0.0;
        }

        let geometric_mean = precisions.iter().product::<f64>().powf(1.0 / precisions.len() as f64);

        // Brevity penalty
        let candidate_len = candidate.split_whitespace().count();
        let reference_len = reference.split_whitespace().count();
        let brevity_penalty = if candidate_len > reference_len {
            1.0
        } else {
            (1.0 - (reference_len as f64 / candidate_len as f64)).exp()
        };

        brevity_penalty * geometric_mean
    }

    /// Calculate informativeness (information density)
    fn calculate_informativeness(original: &str, summary: &str) -> f64 {
        let original_words: HashSet<String> = original
            .to_lowercase()
            .split_whitespace()
            .map(|s| s.trim_matches(|c: char| !c.is_alphabetic()).to_string())
            .filter(|s| s.len() > 3)
            .collect();

        let summary_words: HashSet<String> = summary
            .to_lowercase()
            .split_whitespace()
            .map(|s| s.trim_matches(|c: char| !c.is_alphabetic()).to_string())
            .filter(|s| s.len() > 3)
            .collect();

        if summary_words.is_empty() {
            return 0.0;
        }

        // Calculate unique important words preserved
        let preserved_words = summary_words.intersection(&original_words).count();
        let informativeness = preserved_words as f64 / summary_words.len() as f64;

        informativeness
    }

    /// Calculate coherence score (sentence connectivity)
    fn calculate_coherence(text: &str) -> f64 {
        let sentences: Vec<&str> = text
            .split(&['.', '!', '?'][..])
            .filter(|s| !s.trim().is_empty())
            .collect();

        if sentences.len() < 2 {
            return 1.0;
        }

        let mut coherence_scores = Vec::new();

        for i in 0..sentences.len() - 1 {
            let current_words: HashSet<String> = sentences[i]
                .to_lowercase()
                .split_whitespace()
                .map(String::from)
                .collect();

            let next_words: HashSet<String> = sentences[i + 1]
                .to_lowercase()
                .split_whitespace()
                .map(String::from)
                .collect();

            let overlap = current_words.intersection(&next_words).count();
            let total = current_words.len() + next_words.len();

            if total > 0 {
                coherence_scores.push(overlap as f64 / total as f64);
            }
        }

        if coherence_scores.is_empty() {
            0.5
        } else {
            coherence_scores.iter().sum::<f64>() / coherence_scores.len() as f64
        }
    }

    /// Calculate readability score (Flesch-Kincaid)
    fn calculate_readability(text: &str) -> f64 {
        let sentences: Vec<&str> = text
            .split(&['.', '!', '?'][..])
            .filter(|s| !s.trim().is_empty())
            .collect();

        let words: Vec<&str> = text.split_whitespace().collect();

        if sentences.is_empty() || words.is_empty() {
            return 0.5;
        }

        let total_syllables: usize = words
            .iter()
            .map(|word| Self::count_syllables(word))
            .sum();

        let avg_sentence_length = words.len() as f64 / sentences.len() as f64;
        let avg_syllables_per_word = total_syllables as f64 / words.len() as f64;

        // Flesch Reading Ease
        let flesch_score =
            206.835 - 1.015 * avg_sentence_length - 84.6 * avg_syllables_per_word;

        // Normalize to 0-1 range (higher is better)
        (flesch_score.max(0.0).min(100.0)) / 100.0
    }

    /// Count syllables in a word (simplified)
    fn count_syllables(word: &str) -> usize {
        let vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        let word_lower = word.to_lowercase();
        let chars: Vec<char> = word_lower.chars().collect();

        if chars.is_empty() {
            return 0;
        }

        let mut syllable_count = 0;
        let mut prev_was_vowel = false;

        for ch in chars {
            if vowels.contains(&ch) {
                if !prev_was_vowel {
                    syllable_count += 1;
                }
                prev_was_vowel = true;
            } else {
                prev_was_vowel = false;
            }
        }

        // Adjust for silent 'e'
        if word_lower.ends_with('e') && syllable_count > 1 {
            syllable_count -= 1;
        }

        syllable_count.max(1)
    }

    /// Calculate redundancy score (lower is better)
    fn calculate_redundancy(text: &str) -> f64 {
        let sentences: Vec<&str> = text
            .split(&['.', '!', '?'][..])
            .filter(|s| !s.trim().is_empty())
            .collect();

        if sentences.len() < 2 {
            return 0.0;
        }

        let mut redundancy_scores = Vec::new();

        for i in 0..sentences.len() {
            for j in i + 1..sentences.len() {
                let similarity = Self::sentence_similarity(sentences[i], sentences[j]);
                redundancy_scores.push(similarity);
            }
        }

        if redundancy_scores.is_empty() {
            0.0
        } else {
            redundancy_scores.iter().sum::<f64>() / redundancy_scores.len() as f64
        }
    }

    /// Calculate similarity between two sentences
    fn sentence_similarity(sent1: &str, sent2: &str) -> f64 {
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

        if words1.is_empty() || words2.is_empty() {
            return 0.0;
        }

        let intersection = words1.intersection(&words2).count();
        let union = words1.union(&words2).count();

        intersection as f64 / union as f64
    }

    /// Calculate topic coverage
    fn calculate_coverage(original: &str, summary: &str) -> f64 {
        let original_sentences: Vec<&str> = original
            .split(&['.', '!', '?'][..])
            .filter(|s| !s.trim().is_empty())
            .collect();

        if original_sentences.is_empty() {
            return 1.0;
        }

        let summary_lower = summary.to_lowercase();
        let mut covered_sentences = 0;
        let total_sentences = original_sentences.len();

        for sentence in &original_sentences {
            let sentence_words: Vec<&str> = sentence.split_whitespace().collect();
            let mut word_matches = 0;

            for word in &sentence_words {
                if summary_lower.contains(&word.to_lowercase()) {
                    word_matches += 1;
                }
            }

            // Consider sentence covered if >50% of words appear in summary
            if word_matches as f64 / sentence.split_whitespace().count() as f64 > 0.5 {
                covered_sentences += 1;
            }
        }

        covered_sentences as f64 / total_sentences as f64
    }

    /// Get an overall quality score (weighted average)
    pub fn overall_quality_score(&self) -> f64 {
        // Weight different metrics based on importance
        let weights = [
            (self.rouge_1, 0.15),
            (self.rouge_2, 0.15),
            (self.rouge_l, 0.15),
            (self.informativeness, 0.20),
            (self.coherence_score, 0.15),
            (self.readability_score, 0.10),
            (1.0 - self.redundancy_score, 0.05), // Invert redundancy
            (self.coverage_score, 0.05),
        ];

        weights.iter().map(|(score, weight)| score * weight).sum()
    }

    /// Generate a human-readable report
    pub fn generate_report(&self) -> String {
        format!(
            "Summary Quality Metrics:\n\
             ========================\n\
             ROUGE-1 (Unigram Overlap): {:.3}\n\
             ROUGE-2 (Bigram Overlap): {:.3}\n\
             ROUGE-L (LCS): {:.3}\n\
             BLEU Score: {:.3}\n\
             Compression Ratio: {:.3}\n\
             Informativeness: {:.3}\n\
             Coherence: {:.3}\n\
             Readability: {:.3}\n\
             Redundancy: {:.3}\n\
             Coverage: {:.3}\n\
             Overall Quality: {:.3}\n",
            self.rouge_1,
            self.rouge_2,
            self.rouge_l,
            self.bleu_score,
            self.compression_ratio,
            self.informativeness,
            self.coherence_score,
            self.readability_score,
            self.redundancy_score,
            self.coverage_score,
            self.overall_quality_score()
        )
    }
}

/// Performance metrics for tracking speed and efficiency
#[derive(Clone, Debug)]
pub struct PerformanceMetrics {
    pub processing_time_ms: f64,
    pub characters_per_second: f64,
    pub words_per_second: f64,
    pub memory_estimate_kb: f64,
}

impl PerformanceMetrics {
    pub fn calculate(text_length: usize, word_count: usize, processing_time_seconds: f64) -> Self {
        let processing_time_ms = processing_time_seconds * 1000.0;
        let characters_per_second = if processing_time_seconds > 0.0 {
            text_length as f64 / processing_time_seconds
        } else {
            0.0
        };
        let words_per_second = if processing_time_seconds > 0.0 {
            word_count as f64 / processing_time_seconds
        } else {
            0.0
        };

        // Rough memory estimate based on text size
        let memory_estimate_kb = (text_length * 2) as f64 / 1024.0; // Assuming 2 bytes per char

        PerformanceMetrics {
            processing_time_ms,
            characters_per_second,
            words_per_second,
            memory_estimate_kb,
        }
    }

    pub fn generate_report(&self) -> String {
        format!(
            "Performance Metrics:\n\
             ===================\n\
             Processing Time: {:.2} ms\n\
             Characters/Second: {:.0}\n\
             Words/Second: {:.0}\n\
             Memory Estimate: {:.2} KB\n",
            self.processing_time_ms,
            self.characters_per_second,
            self.words_per_second,
            self.memory_estimate_kb
        )
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rouge_calculation() {
        let candidate = "the cat sat on the mat";
        let reference = "the cat is on the mat";
        
        let rouge_1 = SummaryMetrics::calculate_rouge_n(candidate, reference, 1);
        assert!(rouge_1 > 0.5);
    }

    #[test]
    fn test_coherence_calculation() {
        let text = "The cat sat. The cat played. The dog ran.";
        let coherence = SummaryMetrics::calculate_coherence(text);
        assert!(coherence > 0.0);
    }

    #[test]
    fn test_readability_calculation() {
        let text = "This is a simple text. It has short words.";
        let readability = SummaryMetrics::calculate_readability(text);
        assert!(readability >= 0.0 && readability <= 1.0);
    }
}
