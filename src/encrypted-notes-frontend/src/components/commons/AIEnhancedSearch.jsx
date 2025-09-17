import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Chip,
  Tabs,
  Tab,
  Card,
  CardBody,
  Progress,
  Divider,
  Select,
  SelectItem,
  Textarea,
  Avatar,
  Tooltip,
  Switch
} from '@heroui/react';
import { 
  MagnifyingGlassIcon, 
  XMarkIcon, 
  SparklesIcon,
  DocumentTextIcon,
  LanguageIcon,
  HeartIcon,
  BrainIcon,
  LightBulbIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import useSemanticSearch from '../../hooks/useSemanticSearch';

const AIEnhancedSearch = ({ isOpen, onClose, notes = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('search');
  const [aiFeatures, setAiFeatures] = useState({
    contentAnalysis: true,
    semanticSearch: true,
    abstractSummary: false,
    languageDetection: true,
    sentimentAnalysis: false
  });
  const [analysisResults, setAnalysisResults] = useState(null);
  const [summaryResults, setSummaryResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchLanguage, setSearchLanguage] = useState('auto');
  const [searchType, setSearchType] = useState('hybrid');

  const {
    searchResults,
    isSearching,
    performSearch,
    searchHistory,
    clearHistory
  } = useSemanticSearch(notes);

  // AI Analysis function
  const analyzeContent = useCallback(async () => {
    if (!searchQuery.trim() || !aiFeatures.contentAnalysis) return;

    setIsAnalyzing(true);
    try {
      // Mock AI analysis - replace with actual backend call
      const analysisRequest = {
        text: searchQuery,
        context: notes.map(note => note.encrypted_text).join(' ').slice(0, 1000)
      };

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Mock response - replace with actual backend response
      const mockAnalysis = {
        content_type: searchQuery.length > 50 ? 'document' : 'query',
        language: /[a-zA-Z]/.test(searchQuery) ? 'en' : 'id',
        confidence: 0.95,
        topics: extractTopics(searchQuery),
        sentiment: analyzeSentiment(searchQuery),
        complexity_score: calculateComplexity(searchQuery),
        success: true,
        processing_time: 1.2
      };

      setAnalysisResults(mockAnalysis);
    } catch (error) {
      console.error('AI Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [searchQuery, notes, aiFeatures.contentAnalysis]);

  // Abstract Summary function
  const generateSummary = useCallback(async () => {
    if (!searchQuery.trim() || !aiFeatures.abstractSummary) return;

    setIsAnalyzing(true);
    try {
      const summaryRequest = {
        text: searchQuery,
        summary_type: 'abstract',
        target_length: 100,
        language: searchLanguage === 'auto' ? null : searchLanguage,
        style: 'concise'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock summary response
      const mockSummary = {
        summary: generateMockSummary(searchQuery),
        original_sentences: searchQuery.split('.').filter(s => s.trim()),
        generated_sentences: [
          'This content focuses on key concepts and relationships.',
          'The analysis reveals important patterns and insights.',
          'Multiple perspectives are considered in this summary.'
        ],
        key_concepts: extractTopics(searchQuery),
        abstraction_level: 0.8,
        coherence_score: 0.92,
        success: true,
        processing_time: 1.8
      };

      setSummaryResults(mockSummary);
    } catch (error) {
      console.error('Summary generation failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [searchQuery, searchLanguage, aiFeatures.abstractSummary]);

  // Enhanced search with AI
  const handleAISearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    // Perform semantic search with AI enhancements
    await performSearch(searchQuery, {
      useAI: true,
      language: searchLanguage,
      searchType: searchType,
      contentAnalysis: aiFeatures.contentAnalysis,
      semanticSimilarity: aiFeatures.semanticSearch
    });

    // Run parallel AI analysis if enabled
    if (aiFeatures.contentAnalysis) {
      analyzeContent();
    }
    if (aiFeatures.abstractSummary) {
      generateSummary();
    }
  }, [searchQuery, searchLanguage, searchType, aiFeatures, performSearch, analyzeContent, generateSummary]);

  // Utility functions for mock AI responses
  const extractTopics = (text) => {
    const words = text.toLowerCase().split(/\s+/);
    const topics = words.filter(word => word.length > 4).slice(0, 5);
    return topics.length > 0 ? topics : ['general', 'content'];
  };

  const analyzeSentiment = (text) => {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'baik', 'bagus'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'buruk', 'jelek'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positive = words.some(word => positiveWords.includes(word));
    const negative = words.some(word => negativeWords.includes(word));
    
    if (positive && !negative) return 'positive';
    if (negative && !positive) return 'negative';
    return 'neutral';
  };

  const calculateComplexity = (text) => {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);
    return Math.min(avgWordsPerSentence / 20, 1);
  };

  const generateMockSummary = (text) => {
    if (text.length < 50) {
      return `This is a concise query about ${extractTopics(text).join(', ')}.`;
    }
    return `This content discusses ${extractTopics(text).join(', ')} with ${analyzeSentiment(text)} sentiment and moderate complexity.`;
  };

  // Auto-analyze when query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() && aiFeatures.contentAnalysis) {
        analyzeContent();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [searchQuery, analyzeContent, aiFeatures.contentAnalysis]);

  const renderSearchTab = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Enter your search query..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
          startContent={<MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />}
          className="flex-1"
        />
        <Button
          color="primary"
          onPress={handleAISearch}
          isLoading={isSearching || isAnalyzing}
          startContent={!isSearching && !isAnalyzing && <SparklesIcon className="w-4 h-4" />}
        >
          AI Search
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Select
          label="Language"
          selectedKeys={[searchLanguage]}
          onSelectionChange={(keys) => setSearchLanguage(Array.from(keys)[0])}
          className="w-32"
          size="sm"
        >
          <SelectItem key="auto">Auto</SelectItem>
          <SelectItem key="en">English</SelectItem>
          <SelectItem key="id">Indonesian</SelectItem>
        </Select>

        <Select
          label="Search Type"
          selectedKeys={[searchType]}
          onSelectionChange={(keys) => setSearchType(Array.from(keys)[0])}
          className="w-32"
          size="sm"
        >
          <SelectItem key="semantic">Semantic</SelectItem>
          <SelectItem key="keyword">Keyword</SelectItem>
          <SelectItem key="hybrid">Hybrid</SelectItem>
        </Select>
      </div>

      {/* Search Results */}
      {searchResults?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Search Results ({searchResults.length})
          </h3>
          {searchResults.map((result, index) => (
            <Card key={index} className="p-3">
              <CardBody className="p-0">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">{result.title || `Note ${result.id}`}</h4>
                  <Chip size="sm" variant="flat" color="primary">
                    {Math.round(result.relevance * 100)}% match
                  </Chip>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {result.snippet || result.content?.slice(0, 100) + '...'}
                </p>
                {result.highlights && result.highlights.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {result.highlights.slice(0, 3).map((highlight, i) => (
                      <Chip key={i} size="sm" variant="bordered" className="text-xs">
                        {highlight}
                      </Chip>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalysisTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Content Analysis</h3>
        <Button
          size="sm"
          onPress={analyzeContent}
          isLoading={isAnalyzing}
          startContent={<BrainIcon className="w-4 h-4" />}
        >
          Analyze
        </Button>
      </div>

      {isAnalyzing && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Progress size="sm" isIndeterminate className="flex-1" />
              <span className="text-sm text-gray-600">Analyzing content...</span>
            </div>
          </CardBody>
        </Card>
      )}

      {analysisResults && (
        <div className="space-y-3">
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-xs text-gray-600">Content Type</p>
                    <p className="font-medium">{analysisResults.content_type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <LanguageIcon className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-xs text-gray-600">Language</p>
                    <p className="font-medium">{analysisResults.language.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HeartIcon className="w-5 h-5 text-red-500" />
                  <div>
                    <p className="text-xs text-gray-600">Sentiment</p>
                    <p className="font-medium capitalize">{analysisResults.sentiment}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <FireIcon className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-xs text-gray-600">Complexity</p>
                    <Progress
                      value={analysisResults.complexity_score * 100}
                      className="w-16"
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>

          {analysisResults.topics && (
            <Card>
              <CardBody>
                <h4 className="font-medium mb-2">Key Topics</h4>
                <div className="flex gap-2 flex-wrap">
                  {analysisResults.topics.map((topic, index) => (
                    <Chip key={index} size="sm" variant="flat" color="secondary">
                      {topic}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderSummaryTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Abstract Summary</h3>
        <Button
          size="sm"
          onPress={generateSummary}
          isLoading={isAnalyzing}
          startContent={<LightBulbIcon className="w-4 h-4" />}
        >
          Generate
        </Button>
      </div>

      {summaryResults && (
        <div className="space-y-3">
          <Card>
            <CardBody>
              <h4 className="font-medium mb-2">Generated Summary</h4>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {summaryResults.summary}
              </p>
              <Divider className="my-3" />
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-600">Abstraction Level:</span>
                  <Progress
                    value={summaryResults.abstraction_level * 100}
                    className="mt-1"
                    size="sm"
                  />
                </div>
                <div>
                  <span className="text-gray-600">Coherence Score:</span>
                  <Progress
                    value={summaryResults.coherence_score * 100}
                    className="mt-1"
                    size="sm"
                    color="success"
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {summaryResults.key_concepts && (
            <Card>
              <CardBody>
                <h4 className="font-medium mb-2">Key Concepts</h4>
                <div className="flex gap-2 flex-wrap">
                  {summaryResults.key_concepts.map((concept, index) => (
                    <Chip key={index} size="sm" variant="flat" color="warning">
                      {concept}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">AI Features</h3>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BrainIcon className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium">Content Analysis</p>
              <p className="text-xs text-gray-600">Analyze content type, language, and topics</p>
            </div>
          </div>
          <Switch
            isSelected={aiFeatures.contentAnalysis}
            onValueChange={(checked) => setAiFeatures(prev => ({ ...prev, contentAnalysis: checked }))}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium">Semantic Search</p>
              <p className="text-xs text-gray-600">Enhanced semantic similarity matching</p>
            </div>
          </div>
          <Switch
            isSelected={aiFeatures.semanticSearch}
            onValueChange={(checked) => setAiFeatures(prev => ({ ...prev, semanticSearch: checked }))}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LightBulbIcon className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="font-medium">Abstract Summary</p>
              <p className="text-xs text-gray-600">Generate intelligent summaries</p>
            </div>
          </div>
          <Switch
            isSelected={aiFeatures.abstractSummary}
            onValueChange={(checked) => setAiFeatures(prev => ({ ...prev, abstractSummary: checked }))}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LanguageIcon className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium">Language Detection</p>
              <p className="text-xs text-gray-600">Automatic language identification</p>
            </div>
          </div>
          <Switch
            isSelected={aiFeatures.languageDetection}
            onValueChange={(checked) => setAiFeatures(prev => ({ ...prev, languageDetection: checked }))}
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <HeartIcon className="w-5 h-5 text-red-500" />
            <div>
              <p className="font-medium">Sentiment Analysis</p>
              <p className="text-xs text-gray-600">Analyze emotional tone and sentiment</p>
            </div>
          </div>
          <Switch
            isSelected={aiFeatures.sentimentAnalysis}
            onValueChange={(checked) => setAiFeatures(prev => ({ ...prev, sentimentAnalysis: checked }))}
          />
        </div>
      </div>

      {searchHistory.length > 0 && (
        <>
          <Divider />
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium">Search History</h4>
              <Button size="sm" variant="flat" onPress={clearHistory}>
                Clear
              </Button>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {searchHistory.slice(0, 5).map((query, index) => (
                <div
                  key={index}
                  className="text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setSearchQuery(query)}
                >
                  {query}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-6 h-6 text-primary" />
                <span>AI-Enhanced Search</span>
              </div>
              <p className="text-sm text-gray-600 font-normal">
                Intelligent search with content analysis and semantic understanding
              </p>
            </ModalHeader>
            <ModalBody>
              <Tabs
                selectedKey={selectedTab}
                onSelectionChange={setSelectedTab}
                variant="underlined"
                classNames={{
                  tabList: "gap-6 w-full relative rounded-none p-0 border-b border-divider",
                  cursor: "w-full bg-primary",
                  tab: "max-w-fit px-0 h-12",
                  tabContent: "group-data-[selected=true]:text-primary"
                }}
              >
                <Tab
                  key="search"
                  title={
                    <div className="flex items-center space-x-2">
                      <MagnifyingGlassIcon className="w-4 h-4" />
                      <span>Search</span>
                    </div>
                  }
                >
                  {renderSearchTab()}
                </Tab>
                <Tab
                  key="analysis"
                  title={
                    <div className="flex items-center space-x-2">
                      <BrainIcon className="w-4 h-4" />
                      <span>Analysis</span>
                    </div>
                  }
                >
                  {renderAnalysisTab()}
                </Tab>
                <Tab
                  key="summary"
                  title={
                    <div className="flex items-center space-x-2">
                      <LightBulbIcon className="w-4 h-4" />
                      <span>Summary</span>
                    </div>
                  }
                >
                  {renderSummaryTab()}
                </Tab>
                <Tab
                  key="settings"
                  title={
                    <div className="flex items-center space-x-2">
                      <SparklesIcon className="w-4 h-4" />
                      <span>Settings</span>
                    </div>
                  }
                >
                  {renderSettingsTab()}
                </Tab>
              </Tabs>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AIEnhancedSearch;
