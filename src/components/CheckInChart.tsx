import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { events } from '../data/mockData';

interface CheckInData {
  timeSlot: string;
  count: number;
  timeRange: string;
}

interface CheckInChartProps {
  eventId: string;
  className?: string;
}

interface CustomTooltipProps extends TooltipProps<number, string> {
  active?: boolean;
  payload?: Array<{
    value: number;
    payload: CheckInData;
  }>;
  label?: string;
}

// Custom tooltip component for better data display
const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{data.timeRange}</p>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Check-ins: <span className="font-semibold text-primary-600 dark:text-primary-400">{data.count}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Utility function to process check-in data into 15-minute intervals
const processCheckInData = (eventId: string): CheckInData[] => {
  if (!eventId) return [];

  // Find the event data
  const event = events.find(e => e.id === eventId);
  if (!event) return [];

  // Load check-in data from localStorage
  let checkInData: Record<string, boolean> = {};
  try {
    const savedCheckIns = localStorage.getItem(`checkins-${eventId}`);
    checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {};
  } catch (error) {
    console.warn('Error loading check-in data from localStorage:', error);
    checkInData = {};
  }

  // Count total checked-in guests
  let totalCheckedIn = 0;
  event.guests.forEach(guest => {
    const isCheckedIn = checkInData[guest.id] !== undefined ? checkInData[guest.id] : guest.checkedIn;
    if (isCheckedIn) totalCheckedIn++;
  });

  // If no one is checked in, return empty data
  if (totalCheckedIn === 0) {
    return [];
  }

  // Generate time intervals for the event day (assume 8 AM to 6 PM event window)
  const eventDate = new Date();
  const startHour = 8; // 8 AM
  const endHour = 18; // 6 PM
  const intervals: CheckInData[] = [];

  // Create 15-minute intervals
  for (let hour = startHour; hour < endHour; hour++) {
    for (let quarter = 0; quarter < 4; quarter++) {
      const minutes = quarter * 15;
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const nextMinutes = minutes + 15;
      const nextHour = nextMinutes >= 60 ? hour + 1 : hour;
      const displayMinutes = nextMinutes >= 60 ? 0 : nextMinutes;
      const timeRange = `${timeSlot} - ${nextHour.toString().padStart(2, '0')}:${displayMinutes.toString().padStart(2, '0')}`;
      
      intervals.push({
        timeSlot,
        count: 0,
        timeRange
      });
    }
  }

  // Distribute check-ins across intervals using realistic patterns
  // Early arrivals (30 minutes before - first 2 intervals): 10%
  // Main arrival window (first 2 hours): 70%
  // Late arrivals (remaining time): 20%
  
  const patterns = [
    { weight: 0.05, range: [0, 2] },    // Very early (5%)
    { weight: 0.05, range: [2, 4] },    // Early (5%)
    { weight: 0.25, range: [4, 8] },    // Main rush 1 (25%)
    { weight: 0.35, range: [8, 12] },   // Peak time (35%)
    { weight: 0.20, range: [12, 16] },  // Steady flow (20%)
    { weight: 0.08, range: [16, 20] },  // Late arrivals (8%)
    { weight: 0.02, range: [20, 24] },  // Very late (2%)
  ];

  // Distribute guests according to pattern
  let remainingGuests = totalCheckedIn;
  patterns.forEach(({ weight, range }) => {
    const guestsInPeriod = Math.round(totalCheckedIn * weight);
    const intervalCount = range[1] - range[0];
    
    for (let i = range[0]; i < range[1] && i < intervals.length; i++) {
      if (remainingGuests > 0) {
        // Add some randomness to make it look more realistic
        const baseCount = Math.floor(guestsInPeriod / intervalCount);
        const extraGuest = Math.random() < 0.5 ? 1 : 0;
        const count = Math.min(baseCount + extraGuest, remainingGuests);
        
        intervals[i].count = count;
        remainingGuests -= count;
      }
    }
  });

  // Distribute any remaining guests randomly across peak intervals
  while (remainingGuests > 0) {
    const randomIndex = Math.floor(Math.random() * Math.min(16, intervals.length));
    intervals[randomIndex].count++;
    remainingGuests--;
  }

  // Filter out intervals with no check-ins for cleaner visualization
  return intervals.filter(interval => interval.count > 0);
};

// Custom hook for responsive chart configuration
const useResponsiveChart = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return {
    isMobile,
    margins: {
      top: 20,
      right: isMobile ? 10 : 30,
      left: isMobile ? 10 : 20,
      bottom: isMobile ? 10 : 5,
    },
    barCategoryGap: isMobile ? "10%" : "20%",
    fontSize: isMobile ? 10 : 12,
    labelInterval: isMobile ? 1 : 0,
  };
};

const CheckInChart: React.FC<CheckInChartProps> = ({ eventId, className = '' }) => {
  // State for time range selector
  const [timeRange, setTimeRange] = useState<'1h' | '4h' | '24h'>('24h');

  // Process check-in data into 15-minute intervals
  const chartData: CheckInData[] = useMemo(() => {
    return processCheckInData(eventId);
  }, [eventId]);

  // Get responsive chart configuration
  const { isMobile, margins, barCategoryGap, fontSize, labelInterval } = useResponsiveChart();

  // Handle empty state
  if (chartData.length === 0) {
    return (
      <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 ${className}`}>
        {/* Chart Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-display">
              Check-in Activity
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Guest arrivals per 15-minute interval
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="mt-4 sm:mt-0">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '1h' | '4h' | '24h')}
              className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 transition-colors"
            >
              <option value="1h">Last Hour</option>
              <option value="4h">Last 4 Hours</option>
              <option value="24h">Last 24 Hours</option>
            </select>
          </div>
        </div>

        {/* Empty State */}
        <div className="h-80 flex items-center justify-center">
          <div className="text-center">
            <svg 
              className="w-16 h-16 mx-auto text-neutral-400 mb-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>No check-in data available icon</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-neutral-900 mb-2">No Check-in Data</h4>
            <p className="text-neutral-600">
              No guests have checked in yet. Check-in activity will appear here as guests arrive.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg p-6 ${className}`}>
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 font-display">
            Check-in Activity
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
            Guest arrivals per 15-minute interval
          </p>
        </div>
        
        {/* Time Range Selector */}
        <div className="mt-4 sm:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '1h' | '4h' | '24h')}
            className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-400 dark:focus:border-primary-400 transition-colors"
          >
            <option value="1h">Last Hour</option>
            <option value="4h">Last 4 Hours</option>
            <option value="24h">Last 24 Hours</option>
          </select>
        </div>
      </div>

      {/* Chart Container - Responsive height for mobile */}
      <div className="h-80 sm:h-80 md:h-96" role="img" aria-label="Bar chart showing check-in activity over time">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={margins}
            barCategoryGap={barCategoryGap}
          >
            <XAxis
              dataKey="timeSlot"
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: fontSize, 
                fill: '#6B7280' 
              }}
              className="text-gray-500"
              interval={labelInterval} // Show every other label on mobile
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ 
                fontSize: fontSize, 
                fill: '#6B7280' 
              }}
              label={{ 
                value: 'Check-ins', 
                angle: -90, 
                position: 'insideLeft',
                style: { 
                  textAnchor: 'middle', 
                  fontSize: `${fontSize}px`, 
                  fill: '#6B7280' 
                }
              }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              // Better positioning for mobile
              position={{ x: undefined, y: undefined }}
              allowEscapeViewBox={{ x: false, y: true }}
            />
            <Bar
              dataKey="count"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with Data Summary */}
      <div className="mt-4 pt-4 border-t border-neutral-200 dark:border-neutral-600 transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-neutral-600 dark:text-neutral-400 gap-2">
          <span className="flex items-center">
            <svg 
              className="w-4 h-4 mr-1 text-blue-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Total check-ins icon</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Total check-ins: <span className="font-medium text-neutral-900 dark:text-neutral-100 ml-1">
              {chartData.reduce((sum, item) => sum + item.count, 0)}
            </span>
          </span>
          <span className="flex items-center">
            <svg 
              className="w-4 h-4 mr-1 text-orange-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <title>Peak check-in time icon</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Peak time: <span className="font-medium text-neutral-900 dark:text-neutral-100 ml-1">
              {chartData.reduce((max, item) => item.count > max.count ? item : max).timeRange}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckInChart; 