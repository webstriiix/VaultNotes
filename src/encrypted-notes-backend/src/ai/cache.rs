// Cache Layer for AI Service Performance Optimization
// src/encrypted-notes-backend/src/ai/cache.rs

use std::collections::HashMap;
use std::cell::RefCell;
use ic_cdk::api::time;

/// Cache entry with expiration
#[derive(Clone, Debug)]
struct CacheEntry<T> {
    value: T,
    created_at: u64,
    access_count: u32,
}

/// LRU Cache with TTL for summarization results
pub struct SummaryCache {
    cache: RefCell<HashMap<String, CacheEntry<String>>>,
    max_size: usize,
    ttl_seconds: u64,
}

impl SummaryCache {
    /// Create a new cache with specified size and TTL
    pub fn new(max_size: usize, ttl_seconds: u64) -> Self {
        SummaryCache {
            cache: RefCell::new(HashMap::new()),
            max_size,
            ttl_seconds,
        }
    }

    /// Generate cache key from text using simple hash
    fn generate_key(text: &str, content_type: &str) -> String {
        // Simple hash-like key generation
        let text_snippet = if text.len() > 100 {
            &text[..100]
        } else {
            text
        };
        format!("{}:{}:{}", content_type, text.len(), text_snippet)
    }

    /// Get cached summary if available and not expired
    pub fn get(&self, text: &str, content_type: &str) -> Option<String> {
        let key = Self::generate_key(text, content_type);
        let mut cache = self.cache.borrow_mut();

        if let Some(entry) = cache.get_mut(&key) {
            let current_time = time();
            let age_seconds = (current_time - entry.created_at) / 1_000_000_000;

            // Check if entry is still valid
            if age_seconds < self.ttl_seconds {
                entry.access_count += 1;
                return Some(entry.value.clone());
            } else {
                // Entry expired, remove it
                cache.remove(&key);
            }
        }

        None
    }

    /// Store summary in cache
    pub fn set(&self, text: &str, content_type: &str, summary: String) {
        let key = Self::generate_key(text, content_type);
        let mut cache = self.cache.borrow_mut();

        // If cache is full, remove least recently used item
        if cache.len() >= self.max_size {
            self.evict_lru(&mut cache);
        }

        let entry = CacheEntry {
            value: summary,
            created_at: time(),
            access_count: 0,
        };

        cache.insert(key, entry);
    }

    /// Evict least recently used entry
    fn evict_lru(&self, cache: &mut HashMap<String, CacheEntry<String>>) {
        if let Some(lru_key) = cache
            .iter()
            .min_by_key(|(_, entry)| entry.access_count)
            .map(|(key, _)| key.clone())
        {
            cache.remove(&lru_key);
        }
    }

    /// Clear all expired entries
    pub fn clear_expired(&self) {
        let mut cache = self.cache.borrow_mut();
        let current_time = time();

        cache.retain(|_, entry| {
            let age_seconds = (current_time - entry.created_at) / 1_000_000_000;
            age_seconds < self.ttl_seconds
        });
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> CacheStats {
        let cache = self.cache.borrow();
        let current_time = time();

        let mut total_age = 0u64;
        let mut total_access = 0u32;

        for entry in cache.values() {
            let age = (current_time - entry.created_at) / 1_000_000_000;
            total_age += age;
            total_access += entry.access_count;
        }

        let size = cache.len();
        let avg_age = if size > 0 { total_age / size as u64 } else { 0 };
        let avg_access = if size > 0 { total_access / size as u32 } else { 0 };

        CacheStats {
            size,
            max_size: self.max_size,
            avg_age_seconds: avg_age,
            avg_access_count: avg_access,
            hit_rate: 0.0, // Would need to track hits/misses
        }
    }

    /// Clear the entire cache
    pub fn clear(&self) {
        self.cache.borrow_mut().clear();
    }
}

/// Cache statistics
#[derive(Clone, Debug)]
pub struct CacheStats {
    pub size: usize,
    pub max_size: usize,
    pub avg_age_seconds: u64,
    pub avg_access_count: u32,
    pub hit_rate: f64,
}

impl CacheStats {
    pub fn to_string(&self) -> String {
        format!(
            "Cache Statistics:\n\
             Size: {}/{}\n\
             Avg Age: {} seconds\n\
             Avg Access Count: {}\n\
             Hit Rate: {:.2}%",
            self.size,
            self.max_size,
            self.avg_age_seconds,
            self.avg_access_count,
            self.hit_rate * 100.0
        )
    }
}

/// Global cache instance (thread-local for IC canisters)
thread_local! {
    static SUMMARY_CACHE: SummaryCache = SummaryCache::new(100, 3600); // 100 entries, 1 hour TTL
}

/// Public API to get cached summary
pub fn get_cached_summary(text: &str, content_type: &str) -> Option<String> {
    SUMMARY_CACHE.with(|cache| cache.get(text, content_type))
}

/// Public API to cache summary
pub fn cache_summary(text: &str, content_type: &str, summary: String) {
    SUMMARY_CACHE.with(|cache| cache.set(text, content_type, summary))
}

/// Public API to get cache stats
pub fn get_cache_stats() -> CacheStats {
    SUMMARY_CACHE.with(|cache| cache.get_stats())
}

/// Public API to clear expired entries
pub fn clear_expired_cache() {
    SUMMARY_CACHE.with(|cache| cache.clear_expired())
}

/// Public API to clear entire cache
pub fn clear_cache() {
    SUMMARY_CACHE.with(|cache| cache.clear())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_cache_basic_operations() {
        let cache = SummaryCache::new(10, 3600);
        
        let text = "This is a test text for caching";
        let summary = "Test summary";
        
        // Should be None initially
        assert!(cache.get(text, "general").is_none());
        
        // Set and get
        cache.set(text, "general", summary.to_string());
        assert_eq!(cache.get(text, "general"), Some(summary.to_string()));
    }

    #[test]
    fn test_cache_eviction() {
        let cache = SummaryCache::new(2, 3600);
        
        cache.set("text1", "general", "summary1".to_string());
        cache.set("text2", "general", "summary2".to_string());
        cache.set("text3", "general", "summary3".to_string());
        
        // Cache size should not exceed max_size
        let stats = cache.get_stats();
        assert!(stats.size <= 2);
    }
}
