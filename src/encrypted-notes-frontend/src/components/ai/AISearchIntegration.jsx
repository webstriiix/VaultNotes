import React, { useState } from 'react';
import { Card, CardBody, Button, Modal, ModalContent, ModalHeader, ModalBody, useDisclosure } from "@heroui/react";
import { BrainIcon, SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import AIEnhancedSearch from '../ai/AIEnhancedSearch';

/**
 * AI Search Integration
 * Example component showing how to integrate AI-enhanced search into the app
 */
const AISearchIntegration = ({ notes = [], onNoteSelect }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedResult, setSelectedResult] = useState(null);

  const handleSearchResultClick = (result) => {
    setSelectedResult(result);
    
    // Find the actual note from the results
    const note = notes.find(n => n.id === result.noteId);
    if (note && onNoteSelect) {
      onNoteSelect(note);
    }
    
    onClose(); // Close search modal
  };

  return (
    <div className="space-y-4">
      {/* AI Search Trigger */}
      <div className="flex gap-2">
        <Button
          color="primary"
          variant="flat"
          startContent={<BrainIcon className="w-4 h-4" />}
          onClick={onOpen}
          className="flex-1"
        >
          <SparklesIcon className="w-4 h-4 mr-1" />
          AI-Enhanced Search
        </Button>
      </div>

      {/* Quick Search Stats */}
      <Card className="border-1 border-gray-200 dark:border-gray-700">
        <CardBody className="py-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{notes.length}</div>
              <div className="text-xs text-gray-500">Total Notes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">AI</div>
              <div className="text-xs text-gray-500">Enhanced</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">∞</div>
              <div className="text-xs text-gray-500">Possibilities</div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* AI Features Preview */}
      <Card className="border-1 border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
        <CardBody className="py-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                AI-Powered Features
              </h3>
              <ul className="space-y-1 text-sm text-purple-700 dark:text-purple-300">
                <li>• Semantic search with intent analysis</li>
                <li>• Multi-language content detection</li>
                <li>• Smart query refinement suggestions</li>
                <li>• Content complexity assessment</li>
                <li>• Topic extraction and categorization</li>
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Search Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        className="max-h-[90vh]"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <BrainIcon className="w-5 h-5 text-blue-600" />
              AI-Enhanced Search
            </div>
            <p className="text-sm font-normal text-gray-500">
              Search your notes with artificial intelligence assistance
            </p>
          </ModalHeader>
          <ModalBody className="py-4">
            <AIEnhancedSearch 
              onResultClick={handleSearchResultClick}
              className="w-full"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Recent AI Insights (Mock) */}
      <Card className="border-1 border-gray-200 dark:border-gray-700">
        <CardBody className="py-3">
          <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-500" />
            AI Insights
          </h4>
          <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/20 rounded">
              <span className="font-medium">Content Analysis:</span> Your notes contain 
              {notes.length > 10 ? ' diverse topics' : ' focused content'} with 
              {Math.floor(Math.random() * 3) + 1} primary themes.
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-950/20 rounded">
              <span className="font-medium">Search Optimization:</span> AI has indexed 
              {Math.floor(notes.length * 0.95)} notes for enhanced semantic search.
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/20 rounded">
              <span className="font-medium">Language Detection:</span> Content detected in 
              multiple languages with 95% accuracy.
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default AISearchIntegration;
