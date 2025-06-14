import React, { memo, useCallback, useMemo } from 'react';
import { useFuzzySearchDebounce } from '../hooks/useDebounce';

interface FuzzySearchBoxProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  placeholder?: string;
  className?: string;
  resultsCount?: number;
  totalCount?: number;
  isPerformanceMode?: boolean;
  searchPerformance?: number | null;
}

/**
 * High-performance fuzzy search box component
 * Optimized for ≤30ms response time per keystroke
 */
const FuzzySearchBox: React.FC<FuzzySearchBoxProps> = memo(({
  searchTerm,
  onSearchChange,
  placeholder = "Search guests (fuzzy matching supported)",
  className = "",
  resultsCount = 0,
  totalCount = 0,
  isPerformanceMode = false,
  searchPerformance = null
}) => {
  // Performance-optimized debouncing with 30ms delay
  const { debouncedSearchTerm, isSearching } = useFuzzySearchDebounce(searchTerm);

  // Memoized clear function to prevent unnecessary re-renders
  const handleClear = useCallback(() => {
    onSearchChange('');
  }, [onSearchChange]);

  // Memoized input change handler
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  // Memoized keyboard handler for accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && searchTerm) {
      e.preventDefault();
      handleClear();
    }
  }, [searchTerm, handleClear]);

  // Performance status indicator (development mode)
  const performanceStatus = useMemo(() => {
    if (!isPerformanceMode || searchPerformance === null) return null;
    
    const isGood = searchPerformance <= 30;
    const isWarning = searchPerformance > 30 && searchPerformance <= 50;
    
    return {
      isGood,
      isWarning,
      time: searchPerformance.toFixed(1)
    };
  }, [isPerformanceMode, searchPerformance]);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <label htmlFor="fuzzy-search" className="sr-only">
          Search guests with fuzzy matching
        </label>
        
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg 
            className={`w-5 h-5 transition-colors ${
              isSearching ? 'text-primary-500 dark:text-primary-400 animate-pulse' : 'text-neutral-400 dark:text-neutral-500'
            }`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          id="fuzzy-search"
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-12 py-3 
            border border-neutral-300 dark:border-neutral-600 rounded-lg 
            focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-primary-500 dark:focus:border-primary-400
            transition-colors duration-200
            text-sm text-neutral-900 dark:text-neutral-100
            placeholder-neutral-500 dark:placeholder-neutral-400
            ${isSearching ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-white dark:bg-neutral-800'}
          `}
          aria-label="Search guests with fuzzy matching support"
          aria-describedby="search-help search-results"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 focus:ring-2 focus:ring-primary-400 dark:focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 rounded transition-colors"
            aria-label="Clear search"
            tabIndex={0}
          >
            <svg 
              className="w-5 h-5" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </button>
        )}
      </div>

      {/* Search Results Info */}
      <div id="search-results" className="mt-2 flex items-center justify-between text-sm">
        <div className="text-neutral-600 dark:text-neutral-300">
          {searchTerm.length > 0 ? (
            <>
              {resultsCount === 0 ? (
                <span className="text-orange-600 dark:text-orange-400">
                  No matches found for "{searchTerm}". Try checking spelling or using different terms.
                </span>
              ) : (
                <span>
                  Showing <span className="font-medium text-primary-600 dark:text-primary-400">{resultsCount}</span> of{' '}
                  <span className="font-medium">{totalCount}</span> guests
                  {searchTerm.length >= 2 && (
                    <span className="text-primary-600 dark:text-primary-400 ml-1">(fuzzy matching)</span>
                  )}
                </span>
              )}
            </>
          ) : (
            <span id="search-help" className="text-neutral-500 dark:text-neutral-400">
              Start typing to search with typo tolerance
            </span>
          )}
        </div>

        {/* Performance Indicator (Development Mode) */}
        {performanceStatus && (
          <div className={`text-xs px-2 py-1 rounded ${
            performanceStatus.isGood 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
              : performanceStatus.isWarning 
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
          }`}>
            {performanceStatus.time}ms
          </div>
        )}
      </div>

      {/* Search Loading Indicator */}
      {isSearching && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-500 animate-pulse" />
      )}
    </div>
  );
});

FuzzySearchBox.displayName = 'FuzzySearchBox';

export default FuzzySearchBox; 