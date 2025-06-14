import React from 'react';

interface NetworkStatusIndicatorProps {
  /** Whether the network is online */
  isOnline: boolean;
  /** Show text label alongside the icon */
  showLabel?: boolean;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Optional className for additional styling */
  className?: string;
}

const NetworkStatusIndicator: React.FC<NetworkStatusIndicatorProps> = ({
  isOnline,
  showLabel = false,
  size = 'sm',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconColor = isOnline ? 'text-success-500' : 'text-error-500';
  const statusText = isOnline ? 'Online' : 'Offline';
  const ariaLabel = `Network status: ${statusText}`;

  return (
    <div
      className={`flex items-center ${className}`}
      role="status"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <div className={`${sizeClasses[size]} ${iconColor} flex-shrink-0`}>
        {isOnline ? (
          <svg
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
      
      {showLabel && (
        <span className={`ml-2 text-sm font-medium ${iconColor}`}>
          {statusText}
        </span>
      )}
      
      {/* Screen reader only status */}
      <span className="sr-only">
        Network is currently {statusText.toLowerCase()}
      </span>
    </div>
  );
};

export default NetworkStatusIndicator; 