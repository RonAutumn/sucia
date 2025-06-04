import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminReset from './AdminReset';

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

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock events data
jest.mock('../data/mockData', () => ({
  events: [
    {
      id: '1',
      name: 'Test Event 1',
      guests: [
        { id: '1', name: 'Alice', email: 'alice@test.com', checkedIn: false },
        { id: '2', name: 'Bob', email: 'bob@test.com', checkedIn: false },
      ],
    },
    {
      id: '2',
      name: 'Test Event 2',
      guests: [
        { id: '3', name: 'Charlie', email: 'charlie@test.com', checkedIn: false },
      ],
    },
  ],
}));

// Mock timers for setTimeout
jest.useFakeTimers();

const renderAdminReset = () => {
  return render(
    <MemoryRouter>
      <AdminReset />
    </MemoryRouter>
  );
};

describe('AdminReset', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    mockNavigate.mockClear();
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  describe('Basic Rendering', () => {
    test('renders admin panel with correct title and description', () => {
      renderAdminReset();
      
      expect(screen.getByText('Admin Panel')).toBeInTheDocument();
      expect(screen.getByText('Manage system-wide settings and reset guest check-ins.')).toBeInTheDocument();
    });

    test('renders back button with proper navigation', () => {
      renderAdminReset();
      
      const backButton = screen.getByRole('button', { name: /navigate back to events list/i });
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('displays warning message with correct statistics', () => {
      renderAdminReset();
      
      // Use getAllByText to find all elements containing "Warning" and check the first one
      const warningElements = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('Warning') && 
               element?.textContent?.includes('2') && 
               element?.textContent?.includes('events') && 
               element?.textContent?.includes('3') && 
               element?.textContent?.includes('total guests') || false;
      });
      
      expect(warningElements[0]).toBeInTheDocument();
    });

    test('shows reset button initially', () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      expect(resetButton).toBeInTheDocument();
    });
  });

  describe('System Information', () => {
    test('displays system information correctly', () => {
      renderAdminReset();
      
      expect(screen.getByText('System Information')).toBeInTheDocument();
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Total Events
      expect(screen.getByText('3')).toBeInTheDocument(); // Total Guests
      expect(screen.getByText('1.0.0')).toBeInTheDocument(); // Version
    });

    test('shows "Never" for last reset when no previous reset', () => {
      renderAdminReset();
      
      expect(screen.getByText('Never')).toBeInTheDocument();
    });

    test('displays last reset time when available', () => {
      const resetTime = '2024-01-01T12:00:00.000Z';
      localStorageMock.getItem.mockReturnValue(resetTime);
      
      renderAdminReset();
      
      expect(localStorageMock.getItem).toHaveBeenCalledWith('last-admin-reset');
      // Should display formatted date (actual format depends on locale)
      expect(screen.queryByText('Never')).not.toBeInTheDocument();
    });
  });

  describe('Confirmation Dialog', () => {
    test('opens confirmation dialog when reset button is clicked', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Confirm Reset Action')).toBeInTheDocument();
        // Look for the confirmation text specifically in the dialog
        expect(screen.getByText(/Are you sure you want to reset all check-ins/)).toBeInTheDocument();
      });
    });

    test('dialog has proper accessibility attributes', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog).toHaveAttribute('aria-modal', 'true');
        expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
        expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
      });
    });

    test('closes dialog when cancel button is clicked', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    test('supports keyboard navigation in dialog', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.keyDown(cancelButton, { key: 'Enter' });
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Reset Functionality', () => {
    test('performs reset when confirmed', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
      fireEvent.click(confirmButton);
      
      // Should remove localStorage items for each event
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkins-1');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('checkins-2');
      
      // Should store reset timestamp
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'last-admin-reset',
        expect.any(String)
      );
    });

    test('shows success message after reset', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        // Look for the success message text specifically
        expect(screen.getByText(/Reset completed successfully/)).toBeInTheDocument();
        // Find all "2 events" text and check that one is in the success message
        const eventsTexts = screen.getAllByText(/2 events/);
        const successMessage = eventsTexts.find(element => 
          element.closest('.bg-green-50')
        );
        expect(successMessage).toBeInTheDocument();
      });
    });

    test('hides success message after timeout', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(screen.getByText(/Reset completed successfully/)).toBeInTheDocument();
      });
      
      // Fast-forward 5 seconds
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      
      await waitFor(() => {
        expect(screen.queryByText(/Reset completed successfully/)).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: /reset all check-ins/i })).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility Features', () => {
    test('includes ARIA live region for announcements', () => {
      renderAdminReset();
      
      // Get all status elements and find the ARIA live region
      const statusElements = screen.getAllByRole('status');
      const liveRegion = statusElements.find(el => 
        el.getAttribute('aria-live') === 'polite' && 
        el.getAttribute('aria-atomic') === 'true'
      );
      
      expect(liveRegion).toBeInTheDocument();
    });

    test('announces dialog actions', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        // Find the ARIA live region specifically
        const statusElements = screen.getAllByRole('status');
        const liveRegion = statusElements.find(el => 
          el.getAttribute('aria-live') === 'polite' && 
          el.getAttribute('aria-atomic') === 'true'
        );
        expect(liveRegion).toHaveTextContent('Confirmation dialog opened');
      });
    });

    test('announces reset completion', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        // Find the ARIA live region specifically
        const statusElements = screen.getAllByRole('status');
        const liveRegion = statusElements.find(el => 
          el.getAttribute('aria-live') === 'polite' && 
          el.getAttribute('aria-atomic') === 'true'
        );
        expect(liveRegion).toHaveTextContent('All check-ins have been reset successfully');
      });
    });

    test('announces cancel action', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        // Find the ARIA live region specifically
        const statusElements = screen.getAllByRole('status');
        const liveRegion = statusElements.find(el => 
          el.getAttribute('aria-live') === 'polite' && 
          el.getAttribute('aria-atomic') === 'true'
        );
        expect(liveRegion).toHaveTextContent('Reset cancelled');
      });
    });

    test('has proper focus management', async () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
        expect(confirmButton).toHaveFocus();
      });
    });

    test('warning alert has proper role', () => {
      renderAdminReset();
      
      const warningAlert = screen.getByRole('alert');
      expect(warningAlert).toBeInTheDocument();
      expect(warningAlert).toHaveTextContent('Warning');
    });

    test('buttons have focus indicators', () => {
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      const backButton = screen.getByRole('button', { name: /navigate back to events list/i });
      
      expect(resetButton).toHaveClass('focus:ring-2');
      expect(backButton).toHaveClass('focus:ring-2');
    });
  });

  describe('Edge Cases', () => {
    test('handles localStorage errors gracefully', async () => {
      // Create a component instance with error-throwing localStorage
      const erroringLocalStorage = {
        ...localStorageMock,
        removeItem: jest.fn(() => {
          throw new Error('localStorage error');
        })
      };
      
      // Temporarily override localStorage
      Object.defineProperty(window, 'localStorage', {
        value: erroringLocalStorage,
        configurable: true
      });
      
      renderAdminReset();
      
      const resetButton = screen.getByRole('button', { name: /reset all check-ins/i });
      fireEvent.click(resetButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByRole('button', { name: /yes, reset all/i });
      
      // Click should still work even with localStorage errors
      fireEvent.click(confirmButton);
      
      // Should still show success message despite localStorage error
      await waitFor(() => {
        expect(screen.getByText(/Reset completed successfully/)).toBeInTheDocument();
      });
      
      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        configurable: true
      });
    });
  });
}); 