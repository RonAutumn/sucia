import React, { useState, useEffect } from 'react';
import { events } from '../data/mockData';
import { Guest } from '../types';

// Custom hooks for today's data
const useTodayEvents = () => {
  const [todayEvents, setTodayEvents] = useState<typeof events>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const today = new Date();
    const todayString = today.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Filter events happening today
    const eventsToday = events.filter(event => {
      // Convert event date to same format for comparison
      const eventDate = new Date(event.date);
      const eventString = eventDate.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      return eventString === todayString;
    });

    setTodayEvents(eventsToday);
  }, [lastUpdated]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { todayEvents, refresh: () => setLastUpdated(new Date()) };
};

const useTodayGuests = () => {
  const { todayEvents } = useTodayEvents();
  const [guestData, setGuestData] = useState({ total: 0, checkedIn: 0 });

  useEffect(() => {
    let totalGuests = 0;
    let checkedInGuests = 0;

    todayEvents.forEach(event => {
      // Load check-in statuses from localStorage
      let checkInData: Record<string, boolean> = {};
      try {
        const savedCheckIns = localStorage.getItem(`checkins-${event.id}`);
        checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {};
      } catch (error) {
        console.warn('Error loading check-in data from localStorage:', error);
        checkInData = {};
      }

      // Apply saved check-in statuses and count
      event.guests.forEach(guest => {
        totalGuests++;
        const isCheckedIn = checkInData[guest.id] !== undefined ? checkInData[guest.id] : guest.checkedIn;
        if (isCheckedIn) {
          checkedInGuests++;
        }
      });
    });

    setGuestData({ total: totalGuests, checkedIn: checkedInGuests });
  }, [todayEvents]);

  return guestData;
};

const useLiveCheckIns = () => {
  const { todayEvents } = useTodayEvents();
  const [checkInCount, setCheckInCount] = useState(0);
  const [lastCheckInTime, setLastCheckInTime] = useState<Date | null>(null);

  useEffect(() => {
    let totalCheckIns = 0;

    todayEvents.forEach(event => {
      try {
        const savedCheckIns = localStorage.getItem(`checkins-${event.id}`);
        if (savedCheckIns) {
          const checkInData: Record<string, boolean> = JSON.parse(savedCheckIns);
          // Count checked-in guests
          Object.values(checkInData).forEach(isCheckedIn => {
            if (isCheckedIn) totalCheckIns++;
          });
        } else {
          // Count default checked-in guests
          event.guests.forEach(guest => {
            if (guest.checkedIn) totalCheckIns++;
          });
        }
      } catch (error) {
        console.warn('Error loading check-in data:', error);
        // Fallback to default data
        event.guests.forEach(guest => {
          if (guest.checkedIn) totalCheckIns++;
        });
      }
    });

    setCheckInCount(totalCheckIns);
    setLastCheckInTime(new Date());
  }, [todayEvents]);

  return { checkInCount, lastCheckInTime };
};

// Individual tile components
interface TileProps {
  className?: string;
}

const TotalEventsToday: React.FC<TileProps> = ({ className = '' }) => {
  const { todayEvents } = useTodayEvents();
  
  return (
    <div className={`bg-blue-50 dark:bg-neutral-900 border-2 border-blue-200 dark:border-neutral-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
            Total Events Today
          </h3>
          <p className="text-3xl font-bold mt-2 font-display text-blue-700 dark:text-blue-300">
            {todayEvents.length}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Active events scheduled
          </p>
        </div>
        <div className="text-blue-500 dark:text-blue-400 ml-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const TotalGuestsToday: React.FC<TileProps> = ({ className = '' }) => {
  const guestData = useTodayGuests();
  const capacityPercentage = guestData.total > 0 ? (guestData.checkedIn / guestData.total) * 100 : 0;
  
  const getColor = () => {
    if (capacityPercentage >= 80) return 'green';
    if (capacityPercentage >= 50) return 'yellow';
    return 'red';
  };

  const colorClasses = {
    green: 'bg-green-50 dark:bg-neutral-900 border-green-200 dark:border-neutral-700 text-green-700 dark:text-green-300',
    yellow: 'bg-yellow-50 dark:bg-neutral-900 border-yellow-200 dark:border-neutral-700 text-yellow-700 dark:text-yellow-300',
    red: 'bg-red-50 dark:bg-neutral-900 border-red-200 dark:border-neutral-700 text-red-700 dark:text-red-300'
  };

  const iconColorClasses = {
    green: 'text-green-500 dark:text-green-400',
    yellow: 'text-yellow-500 dark:text-yellow-400',
    red: 'text-red-500 dark:text-red-400'
  };

  const color = getColor();
  
  return (
    <div className={`${colorClasses[color]} border-2 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
            Total Guests Today
          </h3>
          <p className="text-3xl font-bold mt-2 font-display">
            {guestData.total}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {guestData.checkedIn} checked in ({capacityPercentage.toFixed(1)}%)
          </p>
        </div>
        <div className={`${iconColorClasses[color]} ml-4`}>
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const LiveCheckInsTicker: React.FC<TileProps> = ({ className = '' }) => {
  const { checkInCount, lastCheckInTime } = useLiveCheckIns();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when check-in count changes
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 500);
    return () => clearTimeout(timer);
  }, [checkInCount]);
  
  return (
    <div className={`bg-orange-50 dark:bg-neutral-900 border-2 border-orange-200 dark:border-neutral-700 rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-neutral-600 dark:text-neutral-300 uppercase tracking-wide">
            Live Check-ins Today
          </h3>
          <p className={`text-3xl font-bold mt-2 font-display text-orange-700 dark:text-orange-300 transition-all duration-500 ${
            isAnimating ? 'scale-110 text-orange-600 dark:text-orange-200' : ''
          }`}>
            {checkInCount}
          </p>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            {lastCheckInTime ? `Last updated: ${lastCheckInTime.toLocaleTimeString()}` : 'Real-time updates'}
          </p>
        </div>
        <div className="text-orange-500 dark:text-orange-400 ml-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Main DashboardTiles component
const DashboardTiles: React.FC = () => {
  return (
    <div className="mb-8">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 font-display">
          Daily Overview
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
          Real-time metrics for all events today
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TotalEventsToday />
        <TotalGuestsToday />
        <LiveCheckInsTicker />
      </div>
    </div>
  );
};

export default DashboardTiles; 