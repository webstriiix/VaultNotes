import React, { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  DatePicker,
  Switch,
  Divider,
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  
} from '@heroui/react';
import {
  IoSearch,
  IoClose,
  IoFilter,
  IoTime,
  IoCalendar,
  IoPricetag,
  IoOptions,
  IoTrendingUp,
  IoDocument,
  IoRefresh,
  IoChevronDown,
  IoEllipsisVertical
} from 'react-icons/io5';
import useSemanticSearch from '../../hooks/useSemanticSearch';
import { useNavigate } from 'react-router-dom';

const AdvancedSearch = ({ isOpen, onClose, onResultSelect }) => {
  const navigate = useNavigate();
  // Settings modal state (replaces useDisclosure for simpler control)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const {
    isSearching,
    searchResults,
    searchError,
    searchHistory,
    indexStatus,
    performSearch,
    debouncedSearch,
    initializeIndex,
    clearSearch,
    clearSearchHistory
  } = useSemanticSearch();

  // Search form state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOptions, setSearchOptions] = useState({
    maxResults: 10,
    includeContent: false,
    searchTags: true,
    searchTitle: true,
    searchContent: true,
    sortBy: 'relevance'
  });
  const [dateRange, setDateRange] = useState({
    enabled: false,
    start: null,
    end: null
  });
  const [selectedTags, setSelectedTags] = useState([]);
  const [isLiveSearch, setIsLiveSearch] = useState(true);

  // UI state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  // Handle search input change
  const handleSearchChange = (value) => {
    setSearchQuery(value);
    
    if (isLiveSearch && value.trim().length >= 2) {
      const options = {
        ...searchOptions,
        dateRange: dateRange.enabled ? dateRange : null
      };
      debouncedSearch(value, options);
    } else if (value.trim().length < 2) {
      clearSearch();
    }
  };

  // Handle manual search
  const handleSearch = () => {
    if (searchQuery.trim().length >= 2) {
      const options = {
        ...searchOptions,
        dateRange: dateRange.enabled ? dateRange : null
      };
      performSearch(searchQuery, options);
    }
  };

  // Handle search option changes
  const handleOptionChange = (key, value) => {
    setSearchOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle result selection
  const handleResultClick = (result) => {
    setSelectedResult(result);
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Navigate to note
      navigate(`/notes/${result.noteId}`);
    }
  };

  // Handle history item click
  const handleHistoryClick = (historyItem) => {
    setSearchQuery(historyItem.query);
    handleSearchChange(historyItem.query);
  };

  // Initialize index if needed
  useEffect(() => {
    if (indexStatus === 'not_indexed' && isOpen) {
      initializeIndex();
    }
  }, [indexStatus, isOpen, initializeIndex]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(Number(timestamp) / 1000000).toLocaleDateString();
  };

  // Highlight search terms in text
  const highlightText = (text, query) => {
    if (!query || !text) return text;
    
    const terms = query.toLowerCase().split(/\s+/).filter(term => term.length > 1);
    let highlightedText = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200 text-yellow-900 px-1 rounded">$1</mark>');
    });
    
    return highlightedText;
  };

  if (!isOpen) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-gradient-to-br from-gray-900 to-black border border-gray-700",
          header: "border-b border-gray-700",
          body: "py-6",
          footer: "border-t border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IoSearch className="text-2xl text-blue-400" />
                <h2 className="text-xl font-bold text-white">Advanced Search</h2>
                {indexStatus === 'indexing' && (
                  <Spinner size="sm" color="primary" />
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Consolidated Kebab Menu for Settings and Close */}
                <Dropdown placement="bottom-end">
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <IoEllipsisVertical className="text-xl" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Search actions"
                    onAction={(key) => {
                      if (key === 'settings') setIsSettingsOpen(true);
                      if (key === 'close') onClose();
                    }}
                  >
                    <DropdownItem key="settings">
                      <div className="flex items-center gap-2">
                        <IoOptions />
                        Settings
                      </div>
                    </DropdownItem>
                    <DropdownItem key="close" className="text-danger" color="danger">
                      <div className="flex items-center gap-2">
                        <IoClose />
                        Close
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            {indexStatus === 'error' && (
              <div className="text-red-400 text-sm">
                Search index error. Try refreshing the index.
              </div>
            )}
          </ModalHeader>

          <ModalBody>
            <div className="space-y-6">
              {/* Search Input and Main Action */}
              <div className="flex gap-2">
                <Input
                  placeholder="Search your encrypted notes..."
                  value={searchQuery}
                  onValueChange={handleSearchChange}
                  startContent={<IoSearch className="text-gray-400" />}
                  endContent={
                    isSearching ? (
                      <Spinner size="sm" />
                    ) : (
                      searchQuery && (
                        <Button
                          isIconOnly
                          variant="ghost"
                          size="sm"
                          onPress={() => {
                            setSearchQuery('');
                            clearSearch();
                          }}
                        >
                          <IoClose />
                        </Button>
                      )
                    )
                  }
                  classNames={{
                    base: "flex-grow",
                    mainWrapper: "h-full",
                    input: "text-lg",
                    inputWrapper: "h-12 bg-gray-800/50 border-gray-600 data-[hover=true]:border-gray-500 group-data-[focus=true]:border-blue-400"
                  }}
                />
                {!isLiveSearch && (
                  <Button
                    color="primary"
                    onPress={handleSearch}
                    isLoading={isSearching}
                    startContent={!isSearching && <IoSearch />}
                    size="lg" // Make search button more prominent
                    className="h-12"
                  >
                    Search
                  </Button>
                )}
              </div>

              {/* Live Search & Filters Toggle */}
              <div className="flex items-center justify-between flex-wrap gap-2 -mt-4"> {/* Adjust margin-top */}
                <Switch
                  size="sm"
                  isSelected={isLiveSearch}
                  onValueChange={setIsLiveSearch}
                  classNames={{
                    base: "inline-flex flex-row-reverse bg-transparent hover:bg-transparent",
                    wrapper: "p-0 h-4 overflow-visible",
                    thumb: "w-6 h-6 border-2 shadow-lg"
                  }}
                  thumbIcon={null}
                >
                  <span className="text-sm text-gray-400">Live search</span>
                </Switch>

                <Button
                  variant="ghost"
                  size="sm"
                  onPress={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  startContent={<IoFilter />}
                  endContent={<IoChevronDown className={`transition-transform ${showAdvancedOptions ? 'rotate-180' : ''}`} />}
                  className="text-gray-400 hover:text-white"
                >
                  Filters
                </Button>
              </div>

              {/* Advanced Options - Always visible or toggled based on preference */}
              {showAdvancedOptions && (
                <Card className="bg-gray-800/30 border-gray-700">
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Search Scope */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300">Search Scope</h4>
                        <div className="space-y-2">
                          <Switch
                            size="sm"
                            isSelected={searchOptions.searchTitle}
                            onValueChange={(value) => handleOptionChange('searchTitle', value)}
                            classNames={{
                                wrapper: "group-data-[selected=true]:bg-blue-600",
                                thumb: "group-data-[selected=true]:ml-4",
                                startContent: "ml-0" // Remove extra margin
                            }}
                            thumbIcon={null}
                          >
                            <span className="text-sm text-gray-400 ml-2">Search in titles</span> {/* Added ml-2 */}
                          </Switch>
                          <Switch
                            size="sm"
                            isSelected={searchOptions.searchContent}
                            onValueChange={(value) => handleOptionChange('searchContent', value)}
                            classNames={{
                                wrapper: "group-data-[selected=true]:bg-blue-600",
                                thumb: "group-data-[selected=true]:ml-4",
                                startContent: "ml-0"
                            }}
                            thumbIcon={null}
                          >
                            <span className="text-sm text-gray-400 ml-2">Search in content</span>
                          </Switch>
                          <Switch
                            size="sm"
                            isSelected={searchOptions.searchTags}
                            onValueChange={(value) => handleOptionChange('searchTags', value)}
                            classNames={{
                                wrapper: "group-data-[selected=true]:bg-blue-600",
                                thumb: "group-data-[selected=true]:ml-4",
                                startContent: "ml-0"
                            }}
                            thumbIcon={null}
                          >
                            <span className="text-sm text-gray-400 ml-2">Search in tags</span>
                          </Switch>
                        </div>
                      </div>

                      {/* Sort & Limit */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300">Sort & Limit</h4>
                        <div className="space-y-2">
                          <Dropdown>
                            <DropdownTrigger>
                              <Button variant="bordered" className="w-full justify-start text-gray-400 border-gray-600">
                                Sort by: {searchOptions.sortBy.charAt(0).toUpperCase() + searchOptions.sortBy.slice(1)}
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                              aria-label="Sort options"
                              selectedKeys={[searchOptions.sortBy]}
                              onAction={(key) => handleOptionChange('sortBy', key)}
                              selectionMode="single"
                            >
                              <DropdownItem key="relevance">Relevance</DropdownItem>
                              <DropdownItem key="date">Date</DropdownItem>
                              <DropdownItem key="title">Title</DropdownItem>
                            </DropdownMenu>
                          </Dropdown>

                          <Input
                            type="number"
                            label="Max results"
                            value={searchOptions.maxResults.toString()}
                            onValueChange={(value) => handleOptionChange('maxResults', parseInt(value) || 1)}
                            min={1}
                            max={100}
                            className="text-gray-400"
                            classNames={{
                              inputWrapper: "bg-gray-800/50 border-gray-600",
                              label: "text-gray-400",
                              input: "text-white"
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Date Range */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          size="sm"
                          isSelected={dateRange.enabled}
                          onValueChange={(value) => setDateRange(prev => ({ ...prev, enabled: value }))}
                          thumbIcon={null}
                        />
                        <h4 className="text-sm font-semibold text-gray-300">Date Range</h4>
                      </div>

                      {dateRange.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <DatePicker
                            label="From"
                            value={dateRange.start}
                            onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                            classNames={{
                              base: "w-full",
                              inputWrapper: "bg-gray-800/50 border-gray-600",
                              label: "text-gray-400",
                              input: "text-white"
                            }}
                          />
                          <DatePicker
                            label="To"
                            value={dateRange.end}
                            onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                            classNames={{
                              base: "w-full",
                              inputWrapper: "bg-gray-800/50 border-gray-600",
                              label: "text-gray-400",
                              input: "text-white"
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Search Results */}
              {searchError && (
                <Card className="bg-red-900/20 border-red-700">
                  <CardBody>
                    <p className="text-red-400">{searchError}</p>
                  </CardBody>
                </Card>
              )}

              {searchResults.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">
                      Search Results ({searchResults.length})
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={clearSearch}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <Card
                        key={result.noteId}
                        isPressable
                        onPress={() => handleResultClick(result)}
                        classNames={{
                          base: "bg-gray-800/30 border-gray-700 hover:bg-gray-700/50 transition-colors cursor-pointer",
                          body: "p-4"
                        }}
                      >
                        <CardBody>
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4
                                className="font-semibold text-white line-clamp-1"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(result.title, searchQuery)
                                }}
                              />
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <IoTrendingUp />
                                <span>{Math.round(result.relevanceScore * 100)}%</span>
                              </div>
                            </div>

                            {result.content && (
                              <p
                                className="text-sm text-gray-300 line-clamp-2"
                                dangerouslySetInnerHTML={{
                                  __html: highlightText(result.content.substring(0, 150) + '...', searchQuery)
                                }}
                              />
                            )}

                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {result.tags && result.tags.length > 0 && (
                                  <div className="flex items-center gap-1">
                                    <IoPricetag className="text-xs text-gray-500" />
                                    {result.tags.slice(0, 3).map((tag, index) => (
                                      <Chip
                                        key={index}
                                        size="sm"
                                        variant="flat"
                                        className="text-xs bg-blue-900/30 text-blue-300"
                                      >
                                        {tag}
                                      </Chip>
                                    ))}
                                    {result.tags.length > 3 && (
                                      <span className="text-xs text-gray-500">+{result.tags.length - 3}</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <IoCalendar />
                                <span>{formatTimestamp(result.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && searchResults.length === 0 && !isSearching && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <IoTime className="text-gray-400" />
                      Recent Searches
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={clearSearchHistory}
                      className="text-gray-400 hover:text-white"
                    >
                      Clear
                    </Button>
                  </div>

                  <div className="space-y-1">
                    {searchHistory.map((item, index) => (
                      <div
                        key={index}
                        onClick={() => handleHistoryClick(item)}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-800/30 hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <span className="text-gray-300">{item.query}</span>
                        <span className="text-xs text-gray-500">{item.resultCount} results</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="text-center py-8">
                  <IoDocument className="mx-auto text-4xl text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No results found</h3>
                  <p className="text-gray-500">Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Search Settings Modal */}
      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        size="2xl"
        classNames={{
          backdrop: "bg-black/50 backdrop-blur-sm",
          base: "bg-gradient-to-br from-gray-900 to-black border border-gray-700"
        }}
      >
        <ModalContent>
          <ModalHeader>
            <h2 className="text-xl font-bold text-white">Search Settings</h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Index Status</h3>
                <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg">
                  <div>
                    <p className="text-gray-300">Search Index</p>
                    <p className="text-sm text-gray-500">
                      Status: {indexStatus.replace('_', ' ')}
                    </p>
                  </div>
                  <Button
                    variant="bordered"
                    onPress={initializeIndex}
                    isLoading={indexStatus === 'indexing'}
                    startContent={<IoRefresh />}
                    className="border-gray-600 text-gray-400 hover:text-white"
                  >
                    Rebuild Index
                  </Button>
                </div>
              </div>

              <Divider className="bg-gray-700" />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Advanced Options</h3>
                <div className="space-y-3">
                  <Switch
                    isSelected={searchOptions.includeContent}
                    onValueChange={(value) => handleOptionChange('includeContent', value)}
                    thumbIcon={null}
                  >
                    <div>
                      <p className="text-gray-300">Include full content in results</p>
                      <p className="text-sm text-gray-500">
                        May slow down search but provides more context
                      </p>
                    </div>
                  </Switch>
                </div>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              onPress={() => setIsSettingsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AdvancedSearch;
