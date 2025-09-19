import { Actor } from '@dfinity/agent';

/**
 * AI Service Helper for Enhanced Search
 * Provides integration with backend AI endpoints
 */
class AIService {
  constructor(actor, identity) {
    this.actor = actor;
    this.identity = identity;
  }

  /**
   * Analyze content using AI
   */
  async analyzeContent(text, context = null) {
    try {
      if (this.actor.analyze_content) {
        const request = {
          text: text,
          context: context ? [context] : []
        };
        return await this.actor.analyze_content(request);
      }
      
      // Fallback to mock analysis
      return this.mockContentAnalysis(text);
    } catch (error) {
      console.warn('AI content analysis failed, using fallback:', error);
      return this.mockContentAnalysis(text);
    }
  }

  /**
   * Perform AI-powered semantic search
   */
  async semanticSearch(query, contentPool, searchType = 'semantic', language = null) {
    try {
      if (this.actor.semantic_search) {
        const request = {
          query: query,
          content_pool: contentPool,
          search_type: searchType,
          language: language ? [language] : []
        };
        return await this.actor.semantic_search(request);
      }

      // Fallback to enhanced local search
      return this.mockSemanticSearch(query, contentPool, searchType);
    } catch (error) {
      console.warn('AI semantic search failed, using fallback:', error);
      return this.mockSemanticSearch(query, contentPool, searchType);
    }
  }

  /**
   * Generate abstract summary
   */
  async generateAbstractSummary(text, summaryType = 'abstract', targetLength = 100, language = null, style = 'concise') {
    try {
      if (this.actor.generate_abstract_summary) {
        const request = {
          text: text,
          summary_type: summaryType,
          target_length: targetLength ? [targetLength] : [],
          language: language ? [language] : [],
          style: style ? [style] : []
        };
        return await this.actor.generate_abstract_summary(request);
      }

      // Fallback to mock summary
      return this.mockAbstractSummary(text, summaryType, targetLength);
    } catch (error) {
      console.warn('AI summary generation failed, using fallback:', error);
      return this.mockAbstractSummary(text, summaryType, targetLength);
    }
  }

  /**
   * Enhanced text analysis with multiple features
   */
  async enhancedAnalysis(text, features = {}) {
    const {
      contentAnalysis = true,
      languageDetection = true,
      sentimentAnalysis = true,
      topicExtraction = true,
      complexityAnalysis = true
    } = features;

    const results = {};

    if (contentAnalysis) {
      results.contentAnalysis = await this.analyzeContent(text);
    }

    if (languageDetection) {
      results.language = this.detectLanguage(text);
    }

    if (sentimentAnalysis) {
      results.sentiment = this.analyzeSentiment(text);
    }

    if (topicExtraction) {
      results.topics = this.extractTopics(text);
    }

    if (complexityAnalysis) {
      results.complexity = this.analyzeComplexity(text);
    }

    return results;
  }

  // Fallback methods for when AI endpoints are not available

  mockContentAnalysis(text) {
    const wordCount = text.split(/\s+/).length;
    const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length;
    
    return {
      content_type: wordCount > 100 ? 'document' : wordCount > 20 ? 'paragraph' : 'snippet',
      language: this.detectLanguage(text),
      confidence: 0.85 + Math.random() * 0.1,
      topics: this.extractTopics(text),
      sentiment: this.analyzeSentiment(text),
      complexity_score: Math.min(wordCount / sentenceCount / 20, 1),
      success: true,
      processing_time: 0.5 + Math.random() * 0.5
    };
  }

  mockSemanticSearch(query, contentPool, searchType) {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const results = [];

    contentPool.forEach((content, index) => {
      const contentTerms = content.toLowerCase().split(/\s+/);
      let relevanceScore = 0;
      let semanticSimilarity = 0;
      let keywordMatchScore = 0;

      // Calculate keyword matches
      queryTerms.forEach(term => {
        const matches = contentTerms.filter(cTerm => 
          cTerm.includes(term) || term.includes(cTerm)
        ).length;
        keywordMatchScore += matches;
      });

      // Simulate semantic similarity
      const commonWords = queryTerms.filter(term => 
        contentTerms.some(cTerm => cTerm.includes(term))
      ).length;
      semanticSimilarity = commonWords / queryTerms.length;

      // Calculate overall relevance
      relevanceScore = (keywordMatchScore * 0.4 + semanticSimilarity * 0.6) / 10;

      if (relevanceScore > 0.1) {
        results.push({
          content_id: `content_${index}`,
          relevance_score: Math.min(relevanceScore, 1),
          semantic_similarity: semanticSimilarity,
          keyword_match_score: keywordMatchScore / 10,
          context_relevance: 0.7 + Math.random() * 0.3,
          snippet: content.slice(0, 150) + (content.length > 150 ? '...' : ''),
          highlights: queryTerms.filter(term => 
            content.toLowerCase().includes(term)
          ).slice(0, 3)
        });
      }
    });

    return {
      results: results.sort((a, b) => b.relevance_score - a.relevance_score).slice(0, 10),
      suggestions: this.generateSearchSuggestions(query),
      success: true,
      processing_time: 0.8 + Math.random() * 0.4
    };
  }

  mockAbstractSummary(text, summaryType, targetLength) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim());
    const words = text.split(/\s+/);
    
    let summary;
    if (sentences.length <= 2) {
      summary = text;
    } else {
      // Extract key sentences
      const keySentences = sentences
        .filter(s => s.length > 20)
        .slice(0, Math.max(1, Math.floor(sentences.length / 3)));
      summary = keySentences.join('. ') + '.';
    }

    // Limit to target length
    if (targetLength && summary.split(/\s+/).length > targetLength) {
      summary = summary.split(/\s+/).slice(0, targetLength).join(' ') + '...';
    }

    return {
      summary: summary,
      original_sentences: sentences,
      generated_sentences: [summary],
      key_concepts: this.extractTopics(text),
      abstraction_level: 0.7 + Math.random() * 0.2,
      coherence_score: 0.85 + Math.random() * 0.1,
      success: true,
      processing_time: 1.0 + Math.random() * 0.5
    };
  }

  // Utility methods

  detectLanguage(text) {
    const englishWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    const indonesianWords = ['dan', 'atau', 'tetapi', 'di', 'ke', 'dari', 'untuk', 'dengan', 'oleh', 'adalah', 'ini', 'itu', 'yang', 'tidak', 'ada', 'akan', 'sudah', 'dapat', 'bisa', 'harus', 'mungkin', 'juga', 'saja', 'pada', 'dalam', 'kami', 'kita', 'mereka', 'dia'];
    
    const words = text.toLowerCase().split(/\s+/);
    let englishCount = 0;
    let indonesianCount = 0;

    words.forEach(word => {
      if (englishWords.includes(word)) englishCount++;
      if (indonesianWords.includes(word)) indonesianCount++;
    });

    if (englishCount > indonesianCount) return 'en';
    if (indonesianCount > englishCount) return 'id';
    return 'auto';
  }

  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome', 'perfect', 'love', 'like', 'happy', 'pleased', 'satisfied', 'baik', 'bagus', 'hebat', 'luar biasa', 'fantastis', 'sempurna', 'suka', 'senang', 'puas'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry', 'frustrated', 'disappointed', 'buruk', 'jelek', 'menyebalkan', 'benci', 'tidak suka', 'sedih', 'marah', 'kesal', 'kecewa'];
    
    const words = text.toLowerCase().split(/\s+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.some(pos => word.includes(pos))) positiveCount++;
      if (negativeWords.some(neg => word.includes(neg))) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  extractTopics(text, maxTopics = 5) {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxTopics)
      .map(([word]) => word);
  }

  analyzeComplexity(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).filter(s => s.trim()).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    const longWords = text.split(/\s+/).filter(word => word.length > 6).length;
    
    // Flesch reading ease approximation
    const complexity = (avgWordsPerSentence * 1.015) + (longWords / words * 84.6);
    return Math.min(complexity / 100, 1);
  }

  generateSearchSuggestions(query) {
    const words = query.toLowerCase().split(/\s+/);
    const suggestions = [];
    
    // Add variations and expansions
    words.forEach(word => {
      if (word.length > 3) {
        suggestions.push(`${word}s`); // Plural
        suggestions.push(`${word}ing`); // Gerund
        suggestions.push(`related to ${word}`); // Related
      }
    });

    return suggestions.slice(0, 3);
  }

  isStopWord(word) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'yang', 'dan', 'atau', 'tetapi', 'di', 'ke', 'dari', 'untuk', 'dengan', 'oleh', 'adalah', 'ini', 'itu', 'tidak', 'ada', 'akan', 'sudah', 'dapat', 'bisa', 'harus'];
    return stopWords.includes(word.toLowerCase());
  }
}

export default AIService;
