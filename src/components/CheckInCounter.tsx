import React from 'react';

interface CheckInCounterProps {
  checkedInCount: number;
  totalCount: number;
  className?: string;
}

const CheckInCounter: React.FC<CheckInCounterProps> = ({
  checkedInCount,
  totalCount,
  className = ''
}) => {
  const percentage = totalCount > 0 ? Math.round((checkedInCount / totalCount) * 100) : 0;
  
  // Calculate color classes based on percentage
  const getColorClasses = () => {
    if (percentage >= 75) return 'bg-green-50 border-green-200 text-green-700';
    if (percentage >= 50) return 'bg-blue-50 border-blue-200 text-blue-700';
    if (percentage >= 25) return 'bg-yellow-50 border-yellow-200 text-yellow-700';
    return 'bg-gray-50 border-gray-200 text-gray-700';
  };

  return (
    <div 
      className={`border rounded-lg p-4 ${getColorClasses()} ${className}`}
      role="status"
      aria-label={`Check-in progress: ${checkedInCount} of ${totalCount} guests checked in, ${percentage} percent complete`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Check-in Status</h3>
          <p aria-label={`${checkedInCount} out of ${totalCount} guests have checked in`}>
            <span className="font-bold text-2xl">{checkedInCount}</span>
            <span className="text-lg"> / {totalCount} checked in</span>
          </p>
        </div>
        <div className="text-right">
          <div className="relative">
            {/* Circular progress background */}
            <svg 
              className="w-16 h-16"
              role="img"
              aria-label={`Progress circle showing ${percentage} percent completion`}
            >
              <circle
                className="text-gray-200"
                strokeWidth="5"
                stroke="currentColor"
                fill="transparent"
                r="30"
                cx="32"
                cy="32"
              />
              {/* Progress circle */}
              <circle
                className="text-current"
                strokeWidth="5"
                strokeDasharray={188.5}
                strokeDashoffset={188.5 - (percentage / 100) * 188.5}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="30"
                cx="32"
                cy="32"
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  transition: 'stroke-dashoffset 0.35s'
                }}
              />
            </svg>
            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-lg font-bold"
                aria-hidden="true"
              >
                {percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInCounter; 