// Rust AI Service for VaultNotes Backend
// src/encrypted-notes-backend/src/ai_service.rs

use candid::{CandidType, Deserialize};
use ic_cdk::api::time;

// Helper function to calculate elapsed time in seconds
fn elapsed_seconds(start_ns: u64) -> f64 {
    let end_ns = time();
    let elapsed_ns = end_ns.saturating_sub(start_ns);
    elapsed_ns as f64 / 1_000_000_000.0 // Convert nanoseconds to seconds
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

pub fn summarize_text(request: SummaryRequest) -> SummaryResponse {
    let start_time = time(); // IC time in nanoseconds
    
    let text = request.text;
    let content_type = request.content_type.unwrap_or("general".to_string());
    
    if text.len() < 50 {
        return SummaryResponse {
            summary: text.clone(),
            success: true,
            processing_time: elapsed_seconds(start_time),
            compression_ratio: 1.0,
            method: "passthrough".to_string(),
            error: None,
        };
    }
    
    let summary = match simple_summarize(&text, &content_type) {
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
        method: "rust_extractive".to_string(),
        error: None,
    }
}

fn simple_summarize(text: &str, content_type: &str) -> Result<String, String> {
    let sentences: Vec<&str> = text
        .split('.')
        .map(|s| s.trim())
        .filter(|s| !s.is_empty())
        .collect();
    
    if sentences.len() <= 2 {
        return Ok(sentences.join(". ") + ".");
    }
    
    match content_type {
        "meeting" => extract_meeting_summary(&sentences),
        "technical" => extract_technical_summary(&sentences),
        "research" => extract_research_summary(&sentences),
        _ => extract_general_summary(&sentences),
    }
}

fn extract_meeting_summary(sentences: &[&str]) -> Result<String, String> {
    let keywords = vec![
        "decided", "action", "timeline", "completed", "progress",
        "assigned", "responsible", "deadline", "agreed", "next steps"
    ];
    
    let mut scored_sentences = Vec::new();
    
    for (i, sentence) in sentences.iter().enumerate() {
        let sentence_lower = sentence.to_lowercase();
        let mut score = 0;
        
        // Position bonus
        if i == 0 { score += 2; }
        if i == sentences.len() - 1 { score += 1; }
        
        // Keyword scoring
        for keyword in &keywords {
            if sentence_lower.contains(keyword) {
                score += 2;
            }
        }
        
        if score > 0 {
            scored_sentences.push((score, sentence));
        }
    }
    
    if scored_sentences.is_empty() {
        return Ok(sentences.iter().take(2).map(|s| *s).collect::<Vec<_>>().join(". ") + ".");
    }
    
    // Sort by score and take top 3
    scored_sentences.sort_by(|a, b| b.0.cmp(&a.0));
    let selected: Vec<String> = scored_sentences
        .iter()
        .take(3)
        .map(|(_, sentence)| sentence.to_string())
        .collect();
    
    Ok(selected.join(". ") + ".")
}

fn extract_technical_summary(sentences: &[&str]) -> Result<String, String> {
    let keywords = vec![
        "technology", "system", "algorithm", "implementation", "method",
        "process", "architecture", "framework", "protocol", "uses", "enables"
    ];
    
    let mut scored_sentences = Vec::new();
    
    for (i, sentence) in sentences.iter().enumerate() {
        let sentence_lower = sentence.to_lowercase();
        let mut score = 0;
        
        // Position bonus
        if i == 0 { score += 2; }
        
        // Technical keyword scoring
        for keyword in &keywords {
            if sentence_lower.contains(keyword) {
                score += 1;
            }
        }
        
        scored_sentences.push((score, sentence));
    }
    
    // Sort by score and take top 2
    scored_sentences.sort_by(|a, b| b.0.cmp(&a.0));
    let selected: Vec<String> = scored_sentences
        .iter()
        .take(2)
        .map(|(_, sentence)| sentence.to_string())
        .collect();
    
    Ok(selected.join(". ") + ".")
}

fn extract_research_summary(sentences: &[&str]) -> Result<String, String> {
    let keywords = vec![
        "study", "research", "analysis", "findings", "results", "conclusion",
        "evidence", "data", "survey", "shows", "indicates", "reveals"
    ];
    
    let mut scored_sentences = Vec::new();
    
    for (i, sentence) in sentences.iter().enumerate() {
        let sentence_lower = sentence.to_lowercase();
        let mut score = 0;
        
        // Position bonus
        if i == 0 { score += 1; }
        if i == sentences.len() - 1 { score += 1; }
        
        // Research keyword scoring
        for keyword in &keywords {
            if sentence_lower.contains(keyword) {
                score += 1;
            }
        }
        
        // Numbers/statistics bonus
        if sentence.chars().any(|c| c.is_numeric()) {
            score += 1;
        }
        
        if score > 0 {
            scored_sentences.push((score, sentence));
        }
    }
    
    if scored_sentences.is_empty() {
        return Ok(sentences.iter().take(2).map(|s| *s).collect::<Vec<_>>().join(". ") + ".");
    }
    
    // Sort by score and take top 2
    scored_sentences.sort_by(|a, b| b.0.cmp(&a.0));
    let selected: Vec<String> = scored_sentences
        .iter()
        .take(2)
        .map(|(_, sentence)| sentence.to_string())
        .collect();
    
    Ok(selected.join(". ") + ".")
}

fn extract_general_summary(sentences: &[&str]) -> Result<String, String> {
    if sentences.len() <= 2 {
        return Ok(sentences.join(". ") + ".");
    }
    
    let first = sentences[0];
    let last = sentences[sentences.len() - 1];
    
    // If combined length is reasonable, use both
    if (first.len() + last.len()) <= 200 {
        Ok(format!("{}. {}.", first, last))
    } else {
        Ok(first.to_string() + ".")
    }
}
