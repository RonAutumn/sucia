import React, { memo } from 'react';

interface CheckInCounterProps {
  checkedInCount: number;
  totalCount: number;
  className?: string;
}

const CheckInCounter: React.FC<CheckInCounterProps> = memo(({ checkedInCount, totalCount, className = '' }) => {
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  
  // Determine color based on percentage thresholds
  const getStatusColor = () => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-700';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700';
    return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700';
  };

  const getProgressColor = () => {
    if (percentage >= 80) return 'text-green-500 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-500 dark:text-yellow-400';
    return 'text-red-500 dark:text-red-400';
  };

  const getProgressBgColor = () => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-400';
    if (percentage >= 50) return 'bg-yellow-500 dark:bg-yellow-400';
    return 'bg-red-500 dark:bg-red-400';
  };

  return (
    <div className={`bg-white dark:bg-neutral-800 rounded-lg shadow-md border border-neutral-200 dark:border-neutral-700 p-6 transition-colors duration-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-2 transition-colors duration-200">
            Check-in Progress
          </h3>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-200 ${getStatusColor()}`}>
              {checkedInCount} / {totalCount} guests
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-200 ${getStatusColor()}`}>
              {percentage}%
            </div>
          </div>
        </div>
        
        {/* Circular Progress Indicator */}
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-gray-200 dark:text-neutral-600 transition-colors duration-200"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${(percentage / 100) * 175.929} 175.929`}
              className={`transition-all duration-500 ease-in-out ${getProgressColor()}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-900 dark:text-neutral-100 transition-colors duration-200">
              {percentage}%
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="w-full bg-gray-200 dark:bg-neutral-600 rounded-full h-2 transition-colors duration-200">
          <div
            className={`h-2 rounded-full transition-all duration-300 ease-in-out ${getProgressBgColor()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
});

CheckInCounter.displayName = 'CheckInCounter';

export default CheckInCounter; 