// AI Module Entry Point
// src/encrypted-notes-backend/src/ai/mod.rs

pub mod types;
pub mod analyzer;
pub mod personalization;
pub mod core;
pub mod metrics;
pub mod benchmark;
pub mod cache;

// Re-export the main types and functions for easy access
pub use types::*;
pub use core::{
    summarize_text, 
    analyze_content, 
    semantic_search, 
    generate_abstract_summary, 
    personalized_search
};
pub use personalization::{
    learn_from_user_feedback,
    get_user_insights,
};
pub use metrics::{SummaryMetrics, PerformanceMetrics};
pub use benchmark::{SummarizerBenchmark, BenchmarkResult, quick_performance_test};
pub use cache::{get_cached_summary, cache_summary, get_cache_stats, clear_cache, clear_expired_cache};
