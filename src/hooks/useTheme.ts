import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

interface UseThemeReturn {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Custom hook for managing theme state with localStorage persistence
 * Defaults to light mode with fallback to system preference
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<Theme>('light'); // Default during SSR
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize theme after hydration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check localStorage first
    const stored = localStorage.getItem('sucia-theme');
    if (stored === 'light' || stored === 'dark') {
      setThemeState(stored);
      setIsInitialized(true);
      return;
    }
    
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setThemeState('dark');
    }
    
    setIsInitialized(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    // Force clear all theme classes first from both html and body
    root.classList.remove('dark', 'light');
    body.classList.remove('dark', 'light');
    
    // Apply theme class to both html and body elements
    if (newTheme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      // Force dark color scheme
      root.style.colorScheme = 'dark';
      body.style.colorScheme = 'dark';
    } else {
      root.classList.add('light');
      body.classList.add('light');
      // Force light color scheme
      root.style.colorScheme = 'light';
      body.style.colorScheme = 'light';
    }
    
    // Force multiple style recalculations to ensure changes take effect
    void root.offsetHeight;
    void body.offsetHeight;
    
    // Additional force refresh for stubborn cases
    requestAnimationFrame(() => {
      void root.offsetHeight;
      void body.offsetHeight;
    });
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sucia-theme', newTheme);
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  // Apply theme on initial load and when theme changes
  useEffect(() => {
    if (isInitialized) {
      applyTheme(theme);
    }
  }, [theme, isInitialized]);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only update if no stored preference exists
      const stored = localStorage.getItem('sucia-theme');
      if (!stored) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return {
    theme,
    setTheme,
    toggleTheme,
  };
} 