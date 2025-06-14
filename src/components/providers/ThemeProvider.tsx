import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTheme, Theme } from '../../hooks/useTheme';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * ThemeProvider Component
 * 
 * Provides theme context to the entire application and handles:
 * - Theme state management
 * - SSR hydration mismatches
 * - System preference detection
 * - Theme persistence
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const { theme, setTheme, toggleTheme } = useTheme();

  useEffect(() => {
    // Ensure theme is applied after hydration
    setIsLoading(false);
  }, []);

  // Don't render children until theme is properly initialized
  // This prevents hydration mismatches
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isLoading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * NoSSR Component
 * 
 * Prevents server-side rendering of theme-sensitive components
 * to avoid hydration mismatches.
 */
export const NoSSR: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <>{children}</>;
};

export default ThemeProvider; 