import React, { useState } from 'react';
import { Button } from '@heroui/react';
import { IoSearch } from 'react-icons/io5';
import AdvancedSearch from '../commons/AdvancedSearch';

/**
 * Search integration component that can be embedded in other pages
 * Provides a button to open the advanced search modal
 */
const SearchIntegration = ({ onNoteSelect, className = "" }) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleNoteSelect = (result) => {
    if (onNoteSelect) {
      onNoteSelect(result);
    }
    setIsSearchOpen(false);
  };

  return (
    <>
      <Button
        onPress={() => setIsSearchOpen(true)}
        variant="bordered"
        startContent={<IoSearch />}
        className={`border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 ${className}`}
      >
        Advanced Search
      </Button>

      <AdvancedSearch
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onResultSelect={handleNoteSelect}
      />
    </>
  );
};

export default SearchIntegration;
