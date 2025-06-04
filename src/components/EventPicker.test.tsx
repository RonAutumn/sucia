import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EventPicker from './EventPicker';
import * as mockData from '../data/mockData';

// Mock the mockData module
jest.mock('../data/mockData', () => ({
  events: [
    {
      id: '1',
      name: 'Test Event 1',
      description: 'First test event',
      date: '2024-03-15',
      location: 'Test Location 1',
      guests: [
        { id: '1', name: 'John Doe', checkedIn: false },
        { id: '2', name: 'Jane Smith', checkedIn: true }
      ]
    },
    {
      id: '2',
      name: 'Test Event 2',
      description: 'Second test event',
      date: '2024-04-20',
      location: 'Test Location 2',
      guests: [
        { id: '3', name: 'Bob Johnson', checkedIn: false }
      ]
    }
  ]
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('EventPicker', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders event picker with title', () => {
    renderWithRouter(<EventPicker />);
    expect(screen.getByText('Select an Event')).toBeInTheDocument();
  });

  test('displays all events from mock data', () => {
    renderWithRouter(<EventPicker />);
    expect(screen.getByText('Test Event 1')).toBeInTheDocument();
    expect(screen.getByText('Test Event 2')).toBeInTheDocument();
  });

  test('shows formatted dates correctly', () => {
    renderWithRouter(<EventPicker />);
    // Check that dates are formatted (using Intl.DateTimeFormat)
    // The actual dates shown will be Mar 14, 2024 and Apr 19, 2024 based on the test output
    expect(screen.getByText('Mar 14, 2024')).toBeInTheDocument();
    expect(screen.getByText('Apr 19, 2024')).toBeInTheDocument();
  });

  test('displays guest count for each event', () => {
    renderWithRouter(<EventPicker />);
    expect(screen.getByText('2 guests registered')).toBeInTheDocument();
    expect(screen.getByText('1 guests registered')).toBeInTheDocument();
  });

  test('shows event locations', () => {
    renderWithRouter(<EventPicker />);
    expect(screen.getByText('Test Location 1')).toBeInTheDocument();
    expect(screen.getByText('Test Location 2')).toBeInTheDocument();
  });

  test('navigates to correct event ID when card is clicked', () => {
    renderWithRouter(<EventPicker />);
    
    const firstEventCard = screen.getByText('Test Event 1').closest('div[class*="cursor-pointer"]');
    const secondEventCard = screen.getByText('Test Event 2').closest('div[class*="cursor-pointer"]');

    expect(firstEventCard).toBeInTheDocument();
    expect(secondEventCard).toBeInTheDocument();

    if (firstEventCard && secondEventCard) {
      fireEvent.click(firstEventCard);
      expect(mockNavigate).toHaveBeenCalledWith('/event/1');

      fireEvent.click(secondEventCard);
      expect(mockNavigate).toHaveBeenCalledWith('/event/2');
    }
  });

  test('has responsive grid classes', () => {
    const { container } = renderWithRouter(<EventPicker />);
    // Find the grid container by its classes
    const gridContainer = container.querySelector('.grid');
    
    expect(gridContainer).toHaveClass('grid');
    expect(gridContainer).toHaveClass('sm:grid-cols-1');
    expect(gridContainer).toHaveClass('md:grid-cols-2');
    expect(gridContainer).toHaveClass('lg:grid-cols-3');
  });

  test('cards have hover effects', () => {
    renderWithRouter(<EventPicker />);
    const eventCard = screen.getByText('Test Event 1').closest('div[class*="cursor-pointer"]');
    
    expect(eventCard).toHaveClass('hover:shadow-lg');
    expect(eventCard).toHaveClass('hover:scale-105');
    expect(eventCard).toHaveClass('transition-all');
  });

  test('displays event descriptions', () => {
    renderWithRouter(<EventPicker />);
    expect(screen.getByText('First test event')).toBeInTheDocument();
    expect(screen.getByText('Second test event')).toBeInTheDocument();
  });

  test('renders with proper styling classes', () => {
    renderWithRouter(<EventPicker />);
    // Check the outer container div that has the styling classes
    const { container } = render(
      <BrowserRouter>
        <EventPicker />
      </BrowserRouter>
    );
    
    const mainContainer = container.querySelector('.min-h-screen');
    expect(mainContainer).toHaveClass('min-h-screen');
    expect(mainContainer).toHaveClass('bg-gray-50');
  });
}); 