# Semantic Search Implementation

This implementation adds advanced semantic search capabilities to the encrypted notes application with encrypted index storage on the Internet Computer canister.

## Components Overview

### 1. `useSemanticSearch` Hook (`/src/hooks/useSemanticSearch.js`)

A comprehensive React hook that provides semantic search functionality with the following features:

**Features:**
- **Full-text search** across note titles, content, and tags
- **Encrypted index storage** on the IC canister
- **Real-time search** with debouncing
- **Advanced filtering** by date range, search scope, and result limits
- **Search history** with caching
- **Relevance scoring** with TF-IDF-like algorithm
- **Background indexing** for performance

**Key Methods:**
```javascript
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
```

**Usage Example:**
```javascript
// Perform a search
await performSearch("meeting notes", {
  maxResults: 20,
  includeContent: true,
  searchTags: true,
  sortBy: 'relevance',
  dateRange: { start: new Date('2024-01-01'), end: new Date() }
});

// Real-time search with debouncing
debouncedSearch("project", { maxResults: 10 }, 300);
```

### 2. `AdvancedSearch` Component (`/src/components/commons/AdvancedSearch.jsx`)

A comprehensive modal-based search interface with advanced filtering options.

**Features:**
- **Live search** with real-time results
- **Advanced filters** for search scope, date range, and sorting
- **Search history** with quick access
- **Result highlighting** showing matched terms
- **Relevance scoring** display
- **Search settings** with index management
- **Responsive design** matching the app's dark theme

**Usage:**
```jsx
<AdvancedSearch
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  onResultSelect={(result) => {
    // Handle selected search result
    navigate(`/notes/${result.noteId}`);
  }}
/>
```

### 3. `SearchIntegration` Component (`/src/components/commons/SearchIntegration.jsx`)

A simple button component that opens the advanced search modal.

**Usage:**
```jsx
<SearchIntegration 
  onNoteSelect={(result) => {
    // Handle note selection
    console.log('Selected note:', result);
  }}
  className="custom-styling"
/>
```

## Backend Implementation

### New Canister Endpoints

**Store Search Index:**
```rust
#[update]
pub fn store_search_index(encrypted_blob: String) -> ()
```

**Get Search Index:**
```rust
#[query]
pub fn get_search_index() -> Option<String>
```

**Get Index Info:**
```rust
#[query]
pub fn get_search_index_info() -> Option<u64>
```

**Delete Index:**
```rust
#[update]
pub fn delete_search_index() -> bool
```

### Data Structures

**SearchIndex Type:**
```rust
#[derive(Debug, CandidType, Deserialize, Clone)]
pub struct SearchIndex {
    pub owner: Principal,
    pub encrypted_blob: String,
    pub last_updated: u64,
}
```

## Integration Example

The search functionality has been integrated into the existing Notes page:

```jsx
// In Notes.jsx
import SearchIntegration from "../../components/commons/SearchIntegration";

// Add to the filter buttons section
<SearchIntegration 
  onNoteSelect={handleSearchResultSelect}
  className="h-14 px-6 rounded-xl"
/>
```

## How It Works

### 1. Index Creation
- When first used, the hook automatically indexes all user notes
- Creates term frequency maps for efficient searching
- Encrypts the index using the same encryption service as notes
- Stores encrypted index on the canister

### 2. Search Process
- Retrieves and decrypts the search index
- Performs client-side search using TF-IDF-like scoring
- Supports partial matching and relevance ranking
- Can optionally fetch full note content for results

### 3. Security
- Search index is encrypted before storage
- Only the note owner can access their search index
- All search operations happen client-side after decryption
- No plaintext search data is stored on the canister

## Search Algorithm Features

### Relevance Scoring
- **Title matches**: Higher weight (10x)
- **Tag matches**: High weight (8x)
- **Content matches**: Term frequency based (2x)
- **Partial matches**: Lower weight (1x)
- **Position bonus**: First and last sentences get bonuses

### Stop Words Filtering
Common words are filtered out to improve search quality:
```javascript
const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', ...];
```

### Date Range Filtering
Search results can be filtered by note creation/modification date.

### Search History
Recent searches are stored locally for quick access and repeated queries.

## Performance Optimizations

1. **Debounced Search**: Prevents excessive API calls during typing
2. **Result Caching**: Caches search results to avoid repeated computations
3. **Index Caching**: Reuses decrypted index for multiple searches
4. **Lazy Loading**: Only fetches full content when explicitly requested
5. **Background Indexing**: Index updates happen asynchronously

## UI/UX Features

- **Dark theme** integration matching the app design
- **Responsive layout** for mobile and desktop
- **Search highlighting** showing matched terms in results
- **Loading states** and error handling
- **Keyboard shortcuts** and accessibility features
- **Search suggestions** from history

## Styling

The components use **TailwindCSS** and **HeroUI** components, matching the existing app theme:

- Dark background with gradient borders
- Blue accent colors for primary actions
- Gray color scheme for secondary elements
- Smooth transitions and hover effects
- Consistent spacing and typography

## Future Enhancements

Potential improvements for the search functionality:

1. **Fuzzy Search**: Handle typos and similar terms
2. **Semantic Similarity**: Use embeddings for semantic matching
3. **Search Analytics**: Track popular search terms
4. **Search Suggestions**: Auto-complete and query suggestions
5. **Export Search Results**: Save search results as new notes
6. **Advanced Query Syntax**: Support for operators like AND, OR, NOT
7. **Search Bookmarks**: Save frequently used search queries

## Testing

To test the implementation:

1. **Create some notes** with varied content and tags
2. **Open the Advanced Search** using the "Advanced Search" button
3. **Try different search terms** and filters
4. **Check the search index status** in settings
5. **Test live search** by enabling real-time search
6. **Verify result highlighting** and relevance scores

## Error Handling

The implementation includes comprehensive error handling:

- **Authentication errors**: When user is not logged in
- **Encryption errors**: When notes can't be decrypted
- **Network errors**: When canister calls fail
- **Index errors**: When search index is corrupted
- **Search errors**: When search queries fail

All errors are gracefully handled with user-friendly error messages and fallback states.
