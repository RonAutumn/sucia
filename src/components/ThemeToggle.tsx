import React from 'react';
import { useTheme } from '../hooks/useTheme';
import AccessibleIconButton from './AccessibleIconButton';

/**
 * Theme toggle component with accessible button and smooth transitions
 * Features sun/moon icons with proper ARIA labels for screen readers
 */
export function ThemeToggle(): React.JSX.Element {
  const { theme, toggleTheme } = useTheme();

  const iconTooltip = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`;
  const iconLabel = `Switch to ${theme === 'light' ? 'dark' : 'light'} mode. Current theme: ${theme}.`;

  const currentIcon = (
    <div className="relative w-6 h-6" aria-hidden="true">
      {/* Sun Icon - visible in dark mode */}
      <svg
        className={`
          absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out
          ${theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
        />
      </svg>

      {/* Moon Icon - visible in light mode */}
      <svg
        className={`
          absolute inset-0 w-6 h-6 transition-all duration-300 ease-in-out
          ${theme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'}
        `}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    </div>
  );

  return (
    <AccessibleIconButton
      icon={currentIcon}
      label={iconLabel}
      tooltip={iconTooltip}
      onClick={toggleTheme}
      className="
        shadow-sm hover:shadow-md 
        transition-all duration-200 ease-in-out 
      "
    />
  );
}

export default ThemeToggle; 