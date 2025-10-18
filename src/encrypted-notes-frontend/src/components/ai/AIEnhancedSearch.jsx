import React, { useState } from 'react';
import { Card, CardBody, Button, Input, Badge, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/react";
import { SearchIcon, BrainIcon, SparklesIcon, LanguageIcon, StarIcon } from '@heroicons/react/24/outline';
import useSemanticSearch from '../hooks/useSemanticSearch';

/**
 * AI-Enhanced Search Component
 * Provides advanced search capabilities with AI content analysis
 */
const AIEnhancedSearch = ({ onResultClick, className = "" }) => {
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState('hybrid'); // 'traditional', 'hybrid', 'ai'
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const {
    isSearching,
    searchResults,
    searchError,
    searchHistory,
    performSearch,
    debouncedSearch,
    clearSearch,
    // AI-specific methods would be added here when hook is enhanced
    // performAISearch,
    // analyzeContent,
    // generateSummary,
    // aiResults,
    // contentAnalysis,
    // isAiAnalyzing
  } = useSemanticSearch();

  // Enhanced search with AI capabilities
  const handleAISearch = async () => {
    if (!query.trim()) return;

    try {
      // For now, use traditional search with AI-like enhancements
      await performSearch(query, {
        useKeyword: true,
        useSemantic: true,
        maxResults: 20,
        threshold: 0.1
      });

      // Mock AI analysis
      const mockAnalysis = {
        query_intent: detectQueryIntent(query),
        content_type: 'mixed',
        language: detectLanguage(query),
        complexity: calculateComplexity(query),
        suggested_refinements: generateRefinements(query),
        topics: extractTopics(query)
      };
      
      setAiAnalysis(mockAnalysis);
    } catch (error) {
      console.error('AI search failed:', error);
    }
  };

  // Search mode handlers
  const handleSearch = async () => {
    if (searchMode === 'ai') {
      await handleAISearch();
    } else {
      await performSearch(query, {
        useKeyword: searchMode === 'traditional' || searchMode === 'hybrid',
        useSemantic: searchMode === 'hybrid',
        maxResults: 15,
        threshold: 0.1
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // AI Enhancement Methods (Mock implementations)
  const detectQueryIntent = (text) => {
    const questionWords = ['what', 'how', 'why', 'when', 'where', 'who', 'apa', 'bagaimana', 'mengapa', 'kapan', 'dimana', 'siapa'];
    const lowerText = text.toLowerCase();
    
    if (questionWords.some(word => lowerText.includes(word))) return 'question';
    if (lowerText.includes('find') || lowerText.includes('search') || lowerText.includes('cari')) return 'search';
    if (lowerText.includes('compare') || lowerText.includes('vs') || lowerText.includes('bandingkan')) return 'comparison';
    return 'exploration';
  };

  const detectLanguage = (text) => {
    const indonesianWords = ['dan', 'atau', 'yang', 'ini', 'itu', 'untuk', 'dengan', 'dari', 'pada', 'dalam'];
    const englishWords = ['and', 'or', 'the', 'this', 'that', 'for', 'with', 'from', 'on', 'in'];
    
    const words = text.toLowerCase().split(/\s+/);
    const indonesianCount = words.filter(word => indonesianWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    if (indonesianCount > englishCount) return 'Indonesian';
    if (englishCount > indonesianCount) return 'English';
    return 'Mixed';
  };

  const calculateComplexity = (text) => {
    const words = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s/g, '').length / words;
    const complexity = Math.min((words * 0.1 + avgWordLength * 0.05), 1);
    
    if (complexity < 0.3) return 'Simple';
    if (complexity < 0.7) return 'Moderate';
    return 'Complex';
  };

  const generateRefinements = (text) => {
    const words = text.split(/\s+/);
    const refinements = [];
    
    if (words.length > 1) {
      refinements.push(`"${text}"`); // Exact phrase
    }
    
    words.forEach(word => {
      if (word.length > 3) {
        refinements.push(`${word}*`); // Wildcard
      }
    });
    
    return refinements.slice(0, 3);
  };

  const extractTopics = (text) => {
    const commonTopics = ['technology', 'business', 'education', 'health', 'finance', 'travel', 'food', 'science'];
    const words = text.toLowerCase().split(/\s+/);
    
    return commonTopics.filter(topic => 
      words.some(word => word.includes(topic.slice(0, 4)))
    ).slice(0, 3);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input Section */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            placeholder="Search with AI enhancement..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            startContent={<SearchIcon className="w-4 h-4 text-gray-400" />}
            endContent={
              <div className="flex gap-1">
                {searchMode === 'ai' && (
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                )}
                <Button
                  size="sm"
                  variant="light"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs"
                >
                  Advanced
                </Button>
              </div>
            }
            className="w-full"
          />
        </div>
        <Button
          color="primary"
          onClick={handleSearch}
          isLoading={isSearching}
          startContent={searchMode === 'ai' ? <BrainIcon className="w-4 h-4" /> : <SearchIcon className="w-4 h-4" />}
        >
          Search
        </Button>
      </div>

      {/* Search Mode Selection */}
      {showAdvanced && (
        <Card className="border-1 border-gray-200 dark:border-gray-700">
          <CardBody className="py-3">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium">Search Mode:</span>
              {[
                { key: 'traditional', label: 'Traditional', icon: SearchIcon },
                { key: 'hybrid', label: 'Hybrid', icon: StarIcon },
                { key: 'ai', label: 'AI Enhanced', icon: BrainIcon }
              ].map(mode => (
                <Chip
                  key={mode.key}
                  variant={searchMode === mode.key ? 'solid' : 'bordered'}
                  color={searchMode === mode.key ? 'primary' : 'default'}
                  onClick={() => setSearchMode(mode.key)}
                  className="cursor-pointer"
                  startContent={<mode.icon className="w-3 h-3" />}
                >
                  {mode.label}
                </Chip>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* AI Analysis Panel */}
      {aiAnalysis && (
        <Card className="border-1 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardBody className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <BrainIcon className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-blue-800 dark:text-blue-200">AI Analysis</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Intent:</span> 
                <Badge variant="flat" color="primary" className="ml-2">
                  {aiAnalysis.query_intent}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Language:</span> 
                <Badge variant="flat" color="secondary" className="ml-2">
                  <LanguageIcon className="w-3 h-3 mr-1" />
                  {aiAnalysis.language}
                </Badge>
              </div>
              <div>
                <span className="font-medium">Complexity:</span> 
                <Badge 
                  variant="flat" 
                  color={aiAnalysis.complexity === 'Simple' ? 'success' : aiAnalysis.complexity === 'Moderate' ? 'warning' : 'danger'}
                  className="ml-2"
                >
                  {aiAnalysis.complexity}
                </Badge>
              </div>
              {aiAnalysis.topics?.length > 0 && (
                <div>
                  <span className="font-medium">Topics:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {aiAnalysis.topics.map((topic, idx) => (
                      <Chip key={idx} size="sm" variant="flat" color="default">
                        {topic}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {aiAnalysis.suggested_refinements?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                <span className="font-medium text-sm">Suggested refinements:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {aiAnalysis.suggested_refinements.map((refinement, idx) => (
                    <Button
                      key={idx}
                      size="sm"
                      variant="flat"
                      color="primary"
                      onClick={() => setQuery(refinement)}
                      className="text-xs"
                    >
                      {refinement}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Error Display */}
      {searchError && (
        <Card className="border-1 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardBody className="py-3">
            <span className="text-red-600 dark:text-red-400 text-sm">{searchError}</span>
          </CardBody>
        </Card>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Search Results ({searchResults.length})
            </h3>
            <Button
              size="sm"
              variant="flat"
              onClick={clearSearch}
              className="text-xs"
            >
              Clear
            </Button>
          </div>

          <div className="space-y-2">
            {searchResults.map((result, index) => (
              <Card
                key={result.noteId || index}
                isPressable
                onPress={() => onResultClick?.(result)}
                className="hover:shadow-md transition-shadow border-1 border-gray-200 dark:border-gray-700"
              >
                <CardBody className="py-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-base mb-1">
                        {result.title || 'Untitled Note'}
                      </h4>
                      {result.content && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {result.content.substring(0, 150)}...
                        </p>
                      )}
                      
                      <div className="flex items-center gap-3 mt-2">
                        <Badge 
                          variant="flat" 
                          color="primary"
                          className="text-xs"
                        >
                          {(result.relevanceScore * 100).toFixed(0)}% match
                        </Badge>
                        
                        {result.ai_enhanced && (
                          <Badge variant="flat" color="secondary" className="text-xs">
                            <SparklesIcon className="w-3 h-3 mr-1" />
                            AI Enhanced
                          </Badge>
                        )}
                        
                        {result.searchType && (
                          <Badge variant="flat" color="default" className="text-xs">
                            {result.searchType}
                          </Badge>
                        )}
                      </div>

                      {result.ai_highlights?.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium">Highlights: </span>
                          {result.ai_highlights.slice(0, 3).map((highlight, idx) => (
                            <Chip key={idx} size="sm" variant="flat" color="warning" className="text-xs mr-1">
                              {highlight}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && !isSearching && searchResults.length === 0 && (
        <Card className="border-1 border-gray-200 dark:border-gray-700">
          <CardBody className="py-3">
            <h4 className="font-medium text-sm mb-2">Recent Searches</h4>
            <div className="flex flex-wrap gap-2">
              {searchHistory.slice(0, 5).map((historyQuery, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="flat"
                  onClick={() => setQuery(historyQuery)}
                  className="text-xs"
                >
                  {historyQuery}
                </Button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
};

export default AIEnhancedSearch;
