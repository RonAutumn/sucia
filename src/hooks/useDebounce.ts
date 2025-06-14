import { useState, useEffect, useRef } from 'react';

/**
 * Custom debounce hook optimized for 30ms performance requirement
 * Provides immediate value for first character and debounces subsequent changes
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const isFirstChange = useRef(true);

  useEffect(() => {
    // For the first change, apply immediately for better UX
    if (isFirstChange.current) {
      setDebouncedValue(value);
      isFirstChange.current = false;
      return;
    }

    // For subsequent changes, apply debouncing
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  // Reset first change flag when value becomes empty
  useEffect(() => {
    if (typeof value === 'string' && value.length === 0) {
      isFirstChange.current = true;
    }
  }, [value]);

  return debouncedValue;
}

/**
 * Performance-optimized debounce hook for search
 * Implements 30ms delay with performance monitoring
 */
export function useFuzzySearchDebounce(searchTerm: string): {
  debouncedSearchTerm: string;
  isSearching: boolean;
  searchPerformance: number | null;
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [searchPerformance, setSearchPerformance] = useState<number | null>(null);
  const performanceTimer = useRef<number | null>(null);

  useEffect(() => {
    // Start performance measurement
    performanceTimer.current = performance.now();
    setIsSearching(true);

    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsSearching(false);
      
      // Measure performance
      if (performanceTimer.current !== null) {
        const elapsed = performance.now() - performanceTimer.current;
        setSearchPerformance(elapsed);
      }
    }, 30); // 30ms delay as required

    return () => {
      clearTimeout(timer);
      setIsSearching(false);
    };
  }, [searchTerm]);

  return {
    debouncedSearchTerm,
    isSearching,
    searchPerformance
  };
} 