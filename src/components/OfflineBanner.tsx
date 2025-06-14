import React from 'react';

interface OfflineBannerProps {
  /** Whether the banner should be visible */
  isVisible: boolean;
  /** Optional custom message to display */
  message?: string;
  /** Optional className for additional styling */
  className?: string;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({
  isVisible,
  message = 'Offline; changes will sync when online',
  className = '',
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 bg-warning-600 text-white px-4 py-3 shadow-lg transform transition-transform duration-300 ${className}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center justify-center max-w-7xl mx-auto">
        <svg
          className="h-5 w-5 text-warning-200 mr-3 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-sm font-medium text-center">
          {message}
        </span>
        <svg
          className="h-5 w-5 text-warning-200 ml-3 flex-shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
          />
        </svg>
      </div>
    </div>
  );
};

export default OfflineBanner; 