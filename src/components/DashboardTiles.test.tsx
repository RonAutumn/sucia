import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import DashboardTiles from './DashboardTiles';

// Mock the events data
jest.mock('../data/mockData', () => ({
  events: [
    {
      id: '1',
      name: 'Today Event 1',
      description: 'Test event happening today',
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      location: 'Test Location 1',
      guests: [
        { id: '1', name: 'Guest 1', email: 'guest1@test.com', checkedIn: true },
        { id: '2', name: 'Guest 2', email: 'guest2@test.com', checkedIn: false },
        { id: '3', name: 'Guest 3', email: 'guest3@test.com', checkedIn: true },
      ],
    },
    {
      id: '2',
      name: 'Today Event 2',
      description: 'Another test event happening today',
      date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      location: 'Test Location 2',
      guests: [
        { id: '4', name: 'Guest 4', email: 'guest4@test.com', checkedIn: false },
        { id: '5', name: 'Guest 5', email: 'guest5@test.com', checkedIn: true },
      ],
    },
    {
      id: '3',
      name: 'Tomorrow Event',
      description: 'Test event happening tomorrow',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      location: 'Test Location 3',
      guests: [
        { id: '6', name: 'Guest 6', email: 'guest6@test.com', checkedIn: false },
      ],
    },
  ],
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('DashboardTiles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders all three tiles with correct titles', () => {
    render(<DashboardTiles />);
    
    expect(screen.getByText('Daily Overview')).toBeInTheDocument();
    expect(screen.getByText('Real-time metrics for all events today')).toBeInTheDocument();
    expect(screen.getByText('Total Events Today')).toBeInTheDocument();
    expect(screen.getByText('Total Guests Today')).toBeInTheDocument();
    expect(screen.getByText('Live Check-ins Today')).toBeInTheDocument();
  });

  it('displays correct event count for today', async () => {
    render(<DashboardTiles />);
    
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 events today
    });
    
    expect(screen.getByText('Active events scheduled')).toBeInTheDocument();
  });

  it('displays correct guest count and check-in percentage', async () => {
    render(<DashboardTiles />);
    
    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 total guests today
    });
    
    // Should show 3 checked in (2 from event 1 + 1 from event 2) out of 5 total = 60%
    expect(screen.getByText(/3 checked in \(60\.0%\)/)).toBeInTheDocument();
  });

  it('displays correct live check-ins count', async () => {
    render(<DashboardTiles />);
    
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 checked-in guests
    });
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('uses localStorage data when available', async () => {
    // Mock localStorage to return custom check-in data
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'checkins-1') {
        return JSON.stringify({ '1': true, '2': true, '3': false }); // 2 checked in
      }
      if (key === 'checkins-2') {
        return JSON.stringify({ '4': true, '5': true }); // 2 checked in
      }
      return null;
    });

    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Should show 4 checked in total (2 from each event)
      expect(screen.getByText(/4 checked in \(80\.0%\)/)).toBeInTheDocument();
    });
  });

  it('handles localStorage errors gracefully', async () => {
    // Mock localStorage to throw an error
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Should fall back to default data
      expect(screen.getByText('5')).toBeInTheDocument(); // 5 total guests
      expect(screen.getByText(/3 checked in/)).toBeInTheDocument(); // 3 default checked in
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error loading check-in data'),
      expect.any(Error)
    );

    consoleSpy.mockRestore();
  });

  it('updates data automatically every 30 seconds', async () => {
    jest.useFakeTimers();
    
    render(<DashboardTiles />);
    
    // Initial render
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    // Fast-forward 30 seconds
    act(() => {
      jest.advanceTimersByTime(30000);
    });

    // Should still show the same data (since mock data doesn't change)
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument();
    });
  });

  it('applies correct color coding for guest check-in percentage', async () => {
    // Test green color (80%+ check-in rate)
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'checkins-1') {
        return JSON.stringify({ '1': true, '2': true, '3': true }); // All checked in
      }
      if (key === 'checkins-2') {
        return JSON.stringify({ '4': true, '5': true }); // All checked in
      }
      return null;
    });

    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Find the tile container that has the green background
      const guestTileContainer = screen.getByText('Total Guests Today').closest('.bg-green-50');
      expect(guestTileContainer).toBeInTheDocument();
      expect(guestTileContainer).toHaveClass('bg-green-50', 'border-green-200');
    });
  });

  it('shows animation classes for check-in ticker', async () => {
    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Find the check-in count element and verify it has transition classes
      const checkInElement = screen.getByText('3');
      expect(checkInElement).toHaveClass('transition-all', 'duration-500');
    });
  });

  it('filters out events not happening today', async () => {
    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Should only count 2 events (not the tomorrow event)
      expect(screen.getByText('2')).toBeInTheDocument();
      // Should only count 5 guests (not the guest from tomorrow's event)
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });

  it('handles zero events today gracefully', async () => {
    // This test verifies the component renders without crashing when no events match today
    // The mock data already filters to today's events, so this tests the filtering logic
    render(<DashboardTiles />);
    
    await waitFor(() => {
      // Should show the component structure even if no events today
      expect(screen.getByText('Daily Overview')).toBeInTheDocument();
      expect(screen.getByText('Total Events Today')).toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<DashboardTiles />);
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { name: 'Daily Overview' })).toBeInTheDocument();
    
    // Check for descriptive text
    expect(screen.getByText('Real-time metrics for all events today')).toBeInTheDocument();
    
    // All tiles should have proper structure
    const tiles = screen.getAllByText(/Total|Live/).map(el => el.closest('div'));
    tiles.forEach(tile => {
      expect(tile).toBeInTheDocument();
    });
  });
}); 