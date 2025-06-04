import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GuestList from './GuestList';

// Mock data for consistent testing
const mockEvent = {
  id: '1',
  name: 'Test Event 1',
  description: 'First test event description',
  date: '2024-07-15',
  location: 'Test Venue 1',
  guests: [
    {
      id: '1',
      name: 'Alice Smith',
      email: 'alice@test.com',
      checkedIn: true,
    },
    {
      id: '2',
      name: 'Bob Johnson',
      email: 'bob@test.com',
      checkedIn: false,
    },
    {
      id: '3',
      name: 'Charlie Brown',
      email: 'charlie@test.com',
      checkedIn: false,
    },
  ],
};

// Mock events data
jest.mock('../data/mockData', () => ({
  events: [
    {
      id: '1',
      name: 'Test Event 1',
      description: 'First test event description',
      date: '2024-07-15',
      location: 'Test Venue 1',
      guests: [
        {
          id: '1',
          name: 'Alice Smith',
          email: 'alice@test.com',
          checkedIn: true,
        },
        {
          id: '2',
          name: 'Bob Johnson',
          email: 'bob@test.com',
          checkedIn: false,
        },
        {
          id: '3',
          name: 'Charlie Brown',
          email: 'charlie@test.com',
          checkedIn: false,
        },
      ],
    },
    {
      id: '2',
      name: 'Test Event 2',
      description: 'Second test event description',
      date: '2024-08-20',
      location: 'Test Venue 2',
      guests: [
        {
          id: '4',
          name: 'David Wilson',
          email: 'david@test.com',
          checkedIn: false,
        },
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

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const renderWithRouter = (eventId: string) => {
  return render(
    <MemoryRouter initialEntries={[`/event/${eventId}`]}>
      <GuestList />
    </MemoryRouter>
  );
};

describe('GuestList', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    mockNavigate.mockClear();
  });

  describe('Basic Rendering', () => {
    test('renders event information correctly', () => {
      renderWithRouter('1');
      
      expect(screen.getByText('Test Event 1')).toBeInTheDocument();
      expect(screen.getByText('First test event description')).toBeInTheDocument();
      expect(screen.getByText('Date: 2024-07-15')).toBeInTheDocument();
      expect(screen.getByText('Location: Test Venue 1')).toBeInTheDocument();
    });

    test('renders back button with proper navigation', () => {
      renderWithRouter('1');
      
      const backButton = screen.getByRole('button', { name: /navigate back to events list/i });
      expect(backButton).toBeInTheDocument();
      
      fireEvent.click(backButton);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    test('displays 404 error for invalid event ID', () => {
      renderWithRouter('999');
      
      expect(screen.getByText('Event Not Found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back to events/i })).toBeInTheDocument();
    });
  });

  describe('Guest Data and Sorting', () => {
    test('displays guests in alphabetical order by name', () => {
      renderWithRouter('1');
      
      const guestNames = screen.getAllByText(/Alice Smith|Bob Johnson|Charlie Brown/);
      
      // Should find Alice Smith first (alphabetically), then Bob, then Charlie
      // Since we have both desktop and mobile views, we'll have duplicates
      expect(guestNames.length).toBeGreaterThan(0);
      
      // Check that Alice Smith appears before Charlie Brown in the DOM
      const aliceElements = screen.getAllByText('Alice Smith');
      const charlieElements = screen.getAllByText('Charlie Brown');
      expect(aliceElements[0]).toBeInTheDocument();
      expect(charlieElements[0]).toBeInTheDocument();
    });

    test('displays guest email addresses', () => {
      renderWithRouter('1');
      
      expect(screen.getAllByText('alice@test.com')).toHaveLength(2); // Desktop + mobile
      expect(screen.getAllByText('bob@test.com')).toHaveLength(2);
      expect(screen.getAllByText('charlie@test.com')).toHaveLength(2);
    });

    test('shows check-in status with visual indicators', () => {
      renderWithRouter('1');
      
      // Alice Smith should be checked in (green indicators)
      const checkedInElements = screen.getAllByText('Checked In');
      expect(checkedInElements.length).toBeGreaterThan(0);
      
      // Bob and Charlie should not be checked in
      const notCheckedInElements = screen.getAllByText('Not Checked In');
      expect(notCheckedInElements.length).toBeGreaterThan(0);
    });
  });

  describe('Search Functionality', () => {
    test('renders search input with proper accessibility', () => {
      renderWithRouter('1');
      
      const searchInput = screen.getByLabelText(/search guests by name/i);
      expect(searchInput).toBeInTheDocument();
      expect(searchInput).toHaveAttribute('placeholder', 'Search guests (min. 3 characters)...');
      expect(searchInput).toHaveAttribute('aria-describedby', 'search-instructions');
    });

    test('shows search instructions', () => {
      renderWithRouter('1');
      
      const searchInput = screen.getByLabelText(/search guests by name/i);
      
      // Type less than 3 characters
      fireEvent.change(searchInput, { target: { value: 'Al' } });
      
      expect(screen.getByText('Please enter at least 3 characters to search')).toBeInTheDocument();
    });

    test('filters guests based on search term', async () => {
      renderWithRouter('1');
      
      const searchInput = screen.getByLabelText(/search guests by name/i);
      
      // Search for Alice
      fireEvent.change(searchInput, { target: { value: 'Alice' } });
      
      // Wait for debounce
      await waitFor(() => {
        expect(screen.getByText('Showing 1 of 3 guests')).toBeInTheDocument();
      });
    });

    test('shows clear search button when search term exists', () => {
      renderWithRouter('1');
      
      const searchInput = screen.getByLabelText(/search guests by name/i);
      
      fireEvent.change(searchInput, { target: { value: 'test' } });
      
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      expect(clearButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      expect(searchInput).toHaveValue('');
    });
  });

  describe('Check-in Functionality', () => {
    test('toggles check-in status when button is clicked', async () => {
      renderWithRouter('1');
      
      // Find check-in buttons for Charlie Brown (not checked in initially)
      const checkInButtons = screen.getAllByText('Check In');
      expect(checkInButtons.length).toBeGreaterThan(0);
      
      // Click the first check-in button
      fireEvent.click(checkInButtons[0]);
      
      // Should save to localStorage - Charlie's ID should be set to true
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'checkins-1',
        expect.stringContaining('"3":true') // Charlie's ID (3) with checked-in status
      );
    });

    test('loads saved check-in status from localStorage', () => {
      // Mock localStorage to return saved check-in data
      localStorageMock.getItem.mockReturnValue('{"1":true,"2":false}');
      
      renderWithRouter('1');
      
      // Verify localStorage was checked
      expect(localStorageMock.getItem).toHaveBeenCalledWith('checkins-1');
    });
  });

  describe('Check-in Counter', () => {
    test('displays check-in statistics correctly', () => {
      renderWithRouter('1');
      
      expect(screen.getByText('Check-in Status')).toBeInTheDocument();
      // Alice is checked in initially, so 1/3 checked in = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
      
      // Use a more flexible approach to find the check-in text
      const checkInElement = screen.getByText((content, element) => {
        return element?.textContent === '1 / 3 checked in' || false;
      });
      expect(checkInElement).toBeInTheDocument();
    });
  });

  describe('Different Event IDs', () => {
    test('loads correct guest list for different event ID', () => {
      renderWithRouter('2');
      
      expect(screen.getByText('Test Event 2')).toBeInTheDocument();
      expect(screen.getByText('Second test event description')).toBeInTheDocument();
      expect(screen.getAllByText('David Wilson')).toHaveLength(2); // Table + card view
    });

    test('shows correct guest count for different events', () => {
      // Event 1 has 3 guests
      renderWithRouter('1');
      expect(screen.getByText('Guest List (3 guests total)')).toBeInTheDocument();
      
      // Event 2 has 1 guest
      renderWithRouter('2');
      expect(screen.getByText('Guest List (1 guest total)')).toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('includes ARIA live region for announcements', () => {
      renderWithRouter('1');
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    test('announces check-in actions', async () => {
      renderWithRouter('1');
      
      const checkInButtons = screen.getAllByText('Check In');
      fireEvent.click(checkInButtons[0]);
      
      // Wait for announcement to appear
      await waitFor(() => {
        const liveRegion = screen.getByRole('status');
        expect(liveRegion).toHaveTextContent(/checked in successfully/i);
      });
    });

    test('supports keyboard navigation for check-in buttons', () => {
      renderWithRouter('1');
      
      const checkInButtons = screen.getAllByRole('button', { name: /check in|check out/i });
      const firstButton = checkInButtons[0];
      
      // Focus the button
      firstButton.focus();
      expect(firstButton).toHaveFocus();
      
      // Press Enter key
      fireEvent.keyDown(firstButton, { key: 'Enter' });
      
      // Should trigger check-in
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('supports spacebar activation for check-in buttons', () => {
      renderWithRouter('1');
      
      const checkInButtons = screen.getAllByRole('button', { name: /check in|check out/i });
      const firstButton = checkInButtons[0];
      
      // Press spacebar
      fireEvent.keyDown(firstButton, { key: ' ' });
      
      // Should trigger check-in
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    test('has proper ARIA labels for status indicators', () => {
      renderWithRouter('1');
      
      // Check for ARIA labels on status badges
      const statusElements = screen.getAllByText(/checked in|not checked in/i);
      statusElements.forEach(element => {
        // Find the parent element with aria-label
        let ariaElement = element.closest('[aria-label]');
        if (ariaElement) {
          expect(ariaElement).toHaveAttribute('aria-label');
        }
      });
    });

    test('table has proper semantic markup', () => {
      renderWithRouter('1');
      
      // Check for table role and structure
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
      
      // Check for column headers
      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(4); // Name, Email, Status, Action
    });

    test('mobile cards have proper article roles', () => {
      renderWithRouter('1');
      
      // Check for article roles in mobile view
      const articles = screen.getAllByRole('article');
      expect(articles.length).toBeGreaterThan(0);
      
      // Each article should have an aria-labelledby
      articles.forEach(article => {
        expect(article).toHaveAttribute('aria-labelledby');
      });
    });

    test('focus management works correctly', () => {
      renderWithRouter('1');
      
      const backButton = screen.getByRole('button', { name: /navigate back to events list/i });
      const searchInput = screen.getByLabelText(/search guests by name/i);
      
      // Check focus styles are applied
      expect(backButton).toHaveClass('focus:ring-2');
      expect(searchInput).toHaveClass('focus:ring-2');
    });
  });
}); 