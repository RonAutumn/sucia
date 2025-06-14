import React from 'react';
import { useTheme } from '../../hooks/useTheme';

/**
 * ThemeToggle Component
 * 
 * Provides a stylish toggle button for switching between light and dark themes.
 * Features smooth transitions, accessibility support, and visual feedback.
 * Integrates with the useTheme hook for state management and persistence.
 */
export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-12 h-12 rounded-full
        bg-gradient-to-br from-primary-400 to-primary-600
        dark:from-primary-500 dark:to-primary-700
        shadow-lg dark:shadow-primary-500/25
        hover:shadow-xl hover:scale-105
        active:scale-95
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        dark:focus:ring-offset-neutral-900
        group
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`
          absolute w-6 h-6 text-white
          transition-all duration-300 ease-in-out
          ${theme === 'light' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 rotate-90 scale-0'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`
          absolute w-6 h-6 text-white
          transition-all duration-300 ease-in-out
          ${theme === 'dark' 
            ? 'opacity-100 rotate-0 scale-100' 
            : 'opacity-0 -rotate-90 scale-0'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>

      {/* Glow Effect */}
      <div 
        className={`
          absolute inset-0 rounded-full
          bg-gradient-to-br from-primary-400/20 to-primary-600/20
          dark:from-primary-500/20 dark:to-primary-700/20
          blur-md scale-110
          opacity-0 group-hover:opacity-100
          transition-opacity duration-200
        `}
        aria-hidden="true"
      />
    </button>
  );
};

/**
 * Compact Theme Toggle Component
 * 
 * A smaller version of the theme toggle for use in constrained spaces
 * like mobile navigation or secondary locations.
 */
export const CompactThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-8 h-8 rounded-lg
        bg-neutral-100 dark:bg-neutral-800
        hover:bg-neutral-200 dark:hover:bg-neutral-700
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1
        dark:focus:ring-offset-neutral-900
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
    >
      {/* Sun Icon (Light Mode) */}
      <svg
        className={`
          absolute w-4 h-4 text-neutral-700 dark:text-neutral-300
          transition-all duration-200 ease-in-out
          ${theme === 'light' 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-0'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon (Dark Mode) */}
      <svg
        className={`
          absolute w-4 h-4 text-neutral-700 dark:text-neutral-300
          transition-all duration-200 ease-in-out
          ${theme === 'dark' 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-0'
          }
        `}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.5}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </button>
  );
};

export default ThemeToggle; 