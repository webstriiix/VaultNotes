import { useState, useCallback, useRef } from 'react';
import { useInternetIdentity } from 'ic-use-internet-identity';
import { Actor } from '@dfinity/agent';
import { encrypted_notes_backend } from '../../../declarations/encrypted-notes-backend';
import { CryptoService } from '../utils/encryption';
import AIService from '../services/AIService';

/**
 * Custo  /**
   * Initialize AI Service
   */
  const initializeAI = useCallback(() => {
    if (identity && !identity.getPrincipal().isAnonymous()) {
      const actor = encrypted_notes_backend;
      Actor.agentOf(actor).replaceIdentity(identity);
      aiService.current = new AIService(actor, identity);
      setAiEnabled(true);
    }
  }, [identity]);

  /**
   * Perform AI-enhanced search
   */
  const performAISearch = useCallback(async (query, options = {}) => {
    if (!aiService.current) {
      initializeAI();
      if (!aiService.current) {
        return await performSearch(query, options);
      }
    }

    const {
      useContentAnalysis = true,
      useSemanticSearch = true,
      language = 'auto',
      searchType = 'hybrid',
      maxResults = 10
    } = options;

    setIsAiAnalyzing(true);
    
    try {
      // Get content pool for AI analysis
      const actor = encrypted_notes_backend;
      const rawNotes = await actor.read_notes();
      const cryptoService = new CryptoService(actor, identity);
      
      const contentPool = await Promise.all(
        rawNotes.slice(0, 20).map(async (note) => { // Limit for performance
          try {
            const decryptedContent = await cryptoService.decryptWithNoteKey(
              note.id,
              note.owner,
              note.encrypted
            );
            return `${decryptedContent.title || ''} ${decryptedContent.content || ''}`.trim();
          } catch (error) {
            return '';
          }
        })
      );

      const validContentPool = contentPool.filter(content => content.length > 0);

      // Parallel AI operations
      const [traditionalResults, aiSearchResults, analysisResults] = await Promise.all([
        performSearch(query, { ...options, maxResults: maxResults * 2 }), // Get more traditional results
        useSemanticSearch ? aiService.current.semanticSearch(query, validContentPool, searchType, language) : null,
        useContentAnalysis ? aiService.current.analyzeContent(query, validContentPool.join(' ').slice(0, 1000)) : null
      ]);

      // Enhance traditional results with AI insights
      let enhancedResults = traditionalResults;

      if (aiSearchResults && aiSearchResults.success) {
        // Merge AI search results with traditional results
        const aiResultsMap = new Map();
        aiSearchResults.results.forEach((result, index) => {
          if (index < rawNotes.length) {
            const noteId = rawNotes[index]?.id;
            if (noteId) {
              aiResultsMap.set(noteId, {
                ai_relevance: result.relevance_score,
                semantic_similarity: result.semantic_similarity,
                ai_highlights: result.highlights,
                ai_snippet: result.snippet
              });
            }
          }
        });

        // Enhance traditional results with AI data
        enhancedResults = traditionalResults.map(result => ({
          ...result,
          ...aiResultsMap.get(result.noteId),
          ai_enhanced: aiResultsMap.has(result.noteId)
        }));

        setAiResults(aiSearchResults);
      }

      if (analysisResults && analysisResults.success) {
        setContentAnalysis(analysisResults);
      }

      // Re-sort by AI-enhanced relevance if available
      if (aiSearchResults && aiSearchResults.success) {
        enhancedResults.sort((a, b) => {
          const aScore = (a.ai_relevance || 0) * 0.6 + (a.relevanceScore || 0) * 0.4;
          const bScore = (b.ai_relevance || 0) * 0.6 + (b.relevanceScore || 0) * 0.4;
          return bScore - aScore;
        });
      }

      const finalResults = enhancedResults.slice(0, maxResults);
      setSearchResults(finalResults);
      
      return finalResults;

    } catch (error) {
      console.error('AI search failed:', error);
      // Fallback to traditional search
      return await performSearch(query, options);
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [identity, performSearch, initializeAI]);

  /**
   * Analyze content with AI
   */
  const analyzeContent = useCallback(async (text, features = {}) => {
    if (!aiService.current) {
      initializeAI();
      if (!aiService.current) return null;
    }

    setIsAiAnalyzing(true);
    
    try {
      const analysis = await aiService.current.enhancedAnalysis(text, features);
      setContentAnalysis(analysis.contentAnalysis || analysis);
      return analysis;
    } catch (error) {
      console.error('Content analysis failed:', error);
      return null;
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [initializeAI]);

  /**
   * Generate summary with AI
   */
  const generateSummary = useCallback(async (text, options = {}) => {
    if (!aiService.current) {
      initializeAI();
      if (!aiService.current) return null;
    }

    const {
      summaryType = 'abstract',
      targetLength = 100,
      language = 'auto',
      style = 'concise'
    } = options;

    setIsAiAnalyzing(true);
    
    try {
      const summary = await aiService.current.generateAbstractSummary(
        text, 
        summaryType, 
        targetLength, 
        language === 'auto' ? null : language, 
        style
      );
      return summary;
    } catch (error) {
      console.error('Summary generation failed:', error);
      return null;
    } finally {
      setIsAiAnalyzing(false);
    }
  }, [initializeAI]);

  /**
   * Clear AI results and analysis
   */
  const clearAIResults = useCallback(() => {
    setAiResults(null);
    setContentAnalysis(null);
  }, []);

  // Initialize AI when identity is available
  useCallback(() => {
    if (identity && !identity.getPrincipal().isAnonymous() && !aiService.current) {
      initializeAI();
    }
  }, [identity, initializeAI]);

  /**
   * Check if word is a stop word
   */
  const [searchError, setSearchError] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [indexStatus, setIndexStatus] = useState('not_indexed'); // 'not_indexed', 'indexing', 'indexed', 'error'
  
  // AI-related state
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [contentAnalysis, setContentAnalysis] = useState(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  
  // Cache for search results to improve performance
  const searchCache = useRef(new Map());
  const debounceTimer = useRef(null);
  const aiService = useRef(null);

  /**
   * Initialize or update the search index
   */
  const initializeIndex = useCallback(async () => {
    if (!identity || identity.getPrincipal().isAnonymous()) {
      setSearchError('User not authenticated');
      return false;
    }

    try {
      setIndexStatus('indexing');
      const actor = encrypted_notes_backend;
      Actor.agentOf(actor).replaceIdentity(identity);
      
      // Get all user notes for indexing
      const rawNotes = await actor.read_notes();
      const cryptoService = new CryptoService(actor, identity);
      
      // Decrypt notes for indexing
      const decryptedNotes = await Promise.all(
        rawNotes.map(async (note) => {
          try {
            const decryptedContent = await cryptoService.decryptWithNoteKey(
              note.id,
              note.owner,
              note.encrypted
            );
            
            return {
              id: note.id,
              title: decryptedContent.title || '',
              content: decryptedContent.content || '',
              tags: decryptedContent.tags || [],
              timestamp: note.timestamp,
              owner: note.owner
            };
          } catch (error) {
            console.warn(`Failed to decrypt note ${note.id}:`, error);
            return null;
          }
        })
      );

      // Filter out failed decryptions
      const validNotes = decryptedNotes.filter(note => note !== null);
      
      // Create search index blob
      const searchIndex = await createSearchIndex(validNotes);
      
      // Store encrypted index in backend
      const encryptedIndex = await cryptoService.encryptData(JSON.stringify(searchIndex));
      await actor.store_search_index(encryptedIndex);
      
      setIndexStatus('indexed');
      return true;
    } catch (error) {
      console.error('Failed to initialize search index:', error);
      setSearchError('Failed to initialize search index');
      setIndexStatus('error');
      return false;
    }
  }, [identity]);

  /**
   * Create search index from notes
   */
  const createSearchIndex = async (notes) => {
    const index = {
      version: '1.0',
      timestamp: Date.now(),
      entries: []
    };

    notes.forEach(note => {
      // Create searchable text by combining title, content, and tags
      const searchableText = [
        note.title,
        note.content,
        ...(note.tags || [])
      ].join(' ').toLowerCase();

      // Extract keywords and create term frequency
      const words = searchableText
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 2)
        .filter(word => !isStopWord(word));

      const termFreq = {};
      words.forEach(word => {
        termFreq[word] = (termFreq[word] || 0) + 1;
      });

      index.entries.push({
        noteId: note.id,
        title: note.title,
        tags: note.tags || [],
        timestamp: note.timestamp,
        termFreq,
        wordCount: words.length
      });
    });

    return index;
  };

  /**
   * Perform semantic search
   */
  const performSearch = useCallback(async (query, options = {}) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return [];
    }

    const {
      maxResults = 10,
      includeContent = false,
      searchTags = true,
      searchTitle = true,
      searchContent = true,
      dateRange = null, // { start: Date, end: Date }
      sortBy = 'relevance' // 'relevance', 'date', 'title'
    } = options;

    // Check cache first
    const cacheKey = JSON.stringify({ query, options });
    if (searchCache.current.has(cacheKey)) {
      const cachedResults = searchCache.current.get(cacheKey);
      setSearchResults(cachedResults);
      return cachedResults;
    }

    if (!identity || identity.getPrincipal().isAnonymous()) {
      setSearchError('User not authenticated');
      return [];
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      const actor = encrypted_notes_backend;
      Actor.agentOf(actor).replaceIdentity(identity);
      
      // Get search index
      const encryptedIndex = await actor.get_search_index();
      if (!encryptedIndex) {
        // Index doesn't exist, initialize it
        const indexCreated = await initializeIndex();
        if (!indexCreated) {
          throw new Error('Failed to create search index');
        }
        return await performSearch(query, options);
      }

      // Decrypt and parse index
      const cryptoService = new CryptoService(actor, identity);
      const indexData = JSON.parse(await cryptoService.decryptData(encryptedIndex));
      
      // Perform search on index
      const searchTerms = query.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(term => term.length > 1)
        .filter(term => !isStopWord(term));

      const results = [];

      indexData.entries.forEach(entry => {
        let score = 0;
        let matchedTerms = 0;

        searchTerms.forEach(term => {
          // Title matching (higher weight)
          if (searchTitle && entry.title.toLowerCase().includes(term)) {
            score += 10;
            matchedTerms++;
          }

          // Tag matching (high weight)
          if (searchTags && entry.tags.some(tag => tag.toLowerCase().includes(term))) {
            score += 8;
            matchedTerms++;
          }

          // Term frequency matching
          if (searchContent && entry.termFreq[term]) {
            score += entry.termFreq[term] * 2;
            matchedTerms++;
          }

          // Partial word matching
          Object.keys(entry.termFreq).forEach(indexTerm => {
            if (indexTerm.includes(term) || term.includes(indexTerm)) {
              score += 1;
            }
          });
        });

        // Only include results with at least one matched term
        if (matchedTerms > 0) {
          // Apply date range filter
          if (dateRange) {
            const noteDate = new Date(Number(entry.timestamp) / 1000000); // Convert from nanoseconds
            if (noteDate < dateRange.start || noteDate > dateRange.end) {
              return;
            }
          }

          // Calculate relevance score
          const relevanceScore = score / Math.max(searchTerms.length, 1);
          
          results.push({
            noteId: entry.noteId,
            title: entry.title,
            tags: entry.tags,
            timestamp: entry.timestamp,
            relevanceScore,
            matchedTerms: matchedTerms
          });
        }
      });

      // Sort results
      results.sort((a, b) => {
        switch (sortBy) {
          case 'date':
            return Number(b.timestamp) - Number(a.timestamp);
          case 'title':
            return a.title.localeCompare(b.title);
          case 'relevance':
          default:
            return b.relevanceScore - a.relevanceScore;
        }
      });

      // Limit results
      const limitedResults = results.slice(0, maxResults);

      // If includeContent is true, fetch and decrypt full note content
      if (includeContent && limitedResults.length > 0) {
        const notesWithContent = await Promise.all(
          limitedResults.map(async (result) => {
            try {
              const note = await actor.read_note(result.noteId);
              if (note && note.length > 0) {
                const decryptedContent = await cryptoService.decryptWithNoteKey(
                  note[0].id,
                  note[0].owner,
                  note[0].encrypted
                );
                return {
                  ...result,
                  content: decryptedContent.content,
                  fullNote: decryptedContent
                };
              }
              return result;
            } catch (error) {
              console.warn(`Failed to fetch content for note ${result.noteId}:`, error);
              return result;
            }
          })
        );
        
        // Cache results
        searchCache.current.set(cacheKey, notesWithContent);
        setSearchResults(notesWithContent);
        
        // Add to search history
        addToSearchHistory(query, notesWithContent.length);
        
        return notesWithContent;
      }

      // Cache results
      searchCache.current.set(cacheKey, limitedResults);
      setSearchResults(limitedResults);
      
      // Add to search history
      addToSearchHistory(query, limitedResults.length);
      
      return limitedResults;

    } catch (error) {
      console.error('Search failed:', error);
      setSearchError('Search failed: ' + error.message);
      return [];
    } finally {
      setIsSearching(false);
    }
  }, [identity, initializeIndex]);

  /**
   * Debounced search for live search functionality
   */
  const debouncedSearch = useCallback((query, options = {}, delay = 300) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(query, options);
    }, delay);
  }, [performSearch]);

  /**
   * Add query to search history
   */
  const addToSearchHistory = useCallback((query, resultCount) => {
    const historyEntry = {
      query,
      timestamp: Date.now(),
      resultCount
    };

    setSearchHistory(prev => {
      const filtered = prev.filter(entry => entry.query !== query);
      return [historyEntry, ...filtered].slice(0, 10); // Keep last 10 searches
    });
  }, []);

  /**
   * Clear search results and cache
   */
  const clearSearch = useCallback(() => {
    setSearchResults([]);
    setSearchError(null);
    searchCache.current.clear();
  }, []);

  /**
   * Clear search history
   */
  const clearSearchHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  /**
   * Check if a word is a stop word
   */
  const isStopWord = (word) => {
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that',
      'these', 'those', 'i', 'me', 'my', 'we', 'our', 'you', 'your', 'he',
      'him', 'his', 'she', 'her', 'it', 'its', 'they', 'them', 'their', 'what',
      'which', 'who', 'where', 'when', 'why', 'how', 'is', 'are', 'was', 'were',
      'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'
    ]);
    return stopWords.has(word.toLowerCase());
  };

  return {
    // State
    isSearching,
    searchResults,
    searchError,
    searchHistory,
    indexStatus,
    
    // Actions
    performSearch,
    debouncedSearch,
    initializeIndex,
    clearSearch,
    clearSearchHistory
  };
};

export default useSemanticSearch;
