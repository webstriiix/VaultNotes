import { useState, useCallback, useRef } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';

const useSemanticSearch = () => {
  const { identity } = useInternetIdentity();
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [indexStatus, setIndexStatus] = useState('not_indexed');
  
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  
  const searchCache = useRef(new Map());
  const debounceTimer = useRef(null);

  const initializeAI = useCallback(() => {
    if (identity && !identity.getPrincipal().isAnonymous()) {
      setAiEnabled(true);
    }
  }, [identity]);

  const performSearch = useCallback(async (query, options = {}) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return [];
    }

    if (!identity || identity.getPrincipal().isAnonymous()) {
      setSearchError('User not authenticated');
      return [];
    }

    try {
      setIsSearching(true);
      setSearchError(null);
      const results = [];
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed: ' + error.message);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [identity]);

  const debouncedSearch = useCallback((query, options = {}, delay = 300) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    debounceTimer.current = setTimeout(() => {
      performSearch(query, options);
    }, delay);
  }, [performSearch]);

  const initializeIndex = useCallback(async () => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setSearchError('User not authenticated');
      return false;
    }
    try {
      setIndexStatus('indexing');
      setIndexStatus('indexed');
      return true;
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      setSearchError('Failed to initialize search index');
      setIndexStatus('error');
      return false;
    }
  }, [identity]);

  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    searchCache.current.clear();
  }, []);

  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    isSearching,
    searchResults,
    searchError,
    searchHistory,
    indexStatus,
    aiEnabled,
    aiResults,
    contentAnalysis,
    isAiAnalyzing,
    performSearch,
    debouncedSearch,
    initializeIndex,
    initializeAI,
    clearSearch,
    clearSearchHistory
  };
};

export default useSemanticSearch;
