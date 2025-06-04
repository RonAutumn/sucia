import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { events } from '../data/mockData';
import { Guest } from '../types';
import CheckInCounter from './CheckInCounter';
import AriaLiveRegion from './AriaLiveRegion';
import { useAriaLiveAnnouncements } from '../hooks/useAriaLiveAnnouncements';

const GuestList: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const { announcement, announce } = useAriaLiveAnnouncements();

  const event = events.find(e => e.id === id);

  // Debounce search term with 150ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (event) {
      // Load check-in statuses from localStorage
      const savedCheckIns = localStorage.getItem(`checkins-${id}`);
      const checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {};
      
      // Apply saved check-in statuses and sort alphabetically
      const updatedGuests = event.guests
        .map(guest => ({
          ...guest,
          checkedIn: checkInData[guest.id] !== undefined ? checkInData[guest.id] : guest.checkedIn
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setGuests(updatedGuests);
    }
  }, [event, id]);

  // Filter guests based on search term
  const filteredGuests = useMemo(() => {
    if (debouncedSearchTerm.length < 3) {
      return guests;
    }
    
    return guests.filter(guest =>
      guest.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [guests, debouncedSearchTerm]);

  const toggleCheckIn = (guestId: string) => {
    setGuests(prevGuests => {
      const updatedGuests = prevGuests.map(guest =>
        guest.id === guestId ? { ...guest, checkedIn: !guest.checkedIn } : guest
      );
      
      // Find the guest that was toggled for announcement
      const toggledGuest = updatedGuests.find(guest => guest.id === guestId);
      if (toggledGuest) {
        const action = toggledGuest.checkedIn ? 'checked in' : 'checked out';
        announce(`Guest ${toggledGuest.name} ${action} successfully`);
      }
      
      // Save to localStorage
      const checkInData = updatedGuests.reduce((acc, guest) => {
        acc[guest.id] = guest.checkedIn;
        return acc;
      }, {} as Record<string, boolean>);
      
      localStorage.setItem(`checkins-${id}`, JSON.stringify(checkInData));
      
      return updatedGuests;
    });
  };

  const handleKeyDown = (event: React.KeyboardEvent, guestId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleCheckIn(guestId);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const checkedInCount = guests.filter(guest => guest.checkedIn).length;

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Event Not Found</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ARIA Live Region for announcements */}
      <AriaLiveRegion announcement={announcement} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-4 flex items-center focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Navigate back to events list"
          >
            <svg 
              className="w-4 h-4 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Events
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {event.name}
          </h1>
          <p className="text-gray-600 mb-4">{event.description}</p>
          <div className="text-sm text-gray-500 mb-4">
            <p>Date: {event.date}</p>
            <p>Location: {event.location}</p>
          </div>
          
          {/* Check-in Counter */}
          <CheckInCounter
            checkedInCount={checkedInCount}
            totalCount={guests.length}
            className="mb-6"
          />
        </div>

        {/* Sticky Search Bar */}
        <div className="sticky top-0 bg-gray-50 py-4 z-10">
          <div className="relative">
            <label htmlFor="guest-search" className="sr-only">
              Search guests by name
            </label>
            <input
              id="guest-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search guests (min. 3 characters)..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              aria-label="Search guests by name"
              aria-describedby="search-instructions"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                aria-label="Clear search"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <div id="search-instructions" className="mt-2 text-sm text-gray-500">
            {debouncedSearchTerm.length > 0 && debouncedSearchTerm.length < 3 && (
              <span>Please enter at least 3 characters to search</span>
            )}
            {debouncedSearchTerm.length >= 3 && (
              <span>Showing {filteredGuests.length} of {guests.length} guests</span>
            )}
          </div>
        </div>

        {/* Guest List */}
        <div className="mt-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Guest List ({guests.length} guest{guests.length !== 1 ? 's' : ''} total)
          </h2>

          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <div className="shadow overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200" role="table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredGuests.map((guest) => (
                    <tr 
                      key={guest.id} 
                      className={`hover:bg-gray-50 ${guest.checkedIn ? 'bg-green-50' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {guest.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {guest.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            guest.checkedIn
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                          aria-label={`${guest.name} is ${guest.checkedIn ? 'checked in' : 'not checked in'}`}
                        >
                          {guest.checkedIn ? (
                            <>
                              <svg 
                                className="w-3 h-3 mr-1" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Checked In
                            </>
                          ) : (
                            'Not Checked In'
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => toggleCheckIn(guest.id)}
                          onKeyDown={(e) => handleKeyDown(e, guest.id)}
                          className={`min-h-[44px] min-w-[100px] px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 ${
                            guest.checkedIn
                              ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
                              : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                          }`}
                          aria-label={`${guest.checkedIn ? 'Check out' : 'Check in'} ${guest.name}`}
                        >
                          {guest.checkedIn ? 'Check Out' : 'Check In'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile/Tablet Card View */}
          <div className="lg:hidden">
            <div className="divide-y divide-gray-200">
              {filteredGuests.map((guest) => (
                <div 
                  key={guest.id} 
                  className={`p-6 ${guest.checkedIn ? 'bg-green-50' : 'bg-white'}`}
                  role="article"
                  aria-labelledby={`guest-${guest.id}-name`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 id={`guest-${guest.id}-name`} className="text-lg font-semibold text-gray-900">
                        {guest.name}
                      </h3>
                      <p className="text-gray-600 text-sm">{guest.email}</p>
                      <div className="mt-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            guest.checkedIn
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                          aria-label={`${guest.name} is ${guest.checkedIn ? 'checked in' : 'not checked in'}`}
                        >
                          {guest.checkedIn ? (
                            <>
                              <svg 
                                className="w-3 h-3 mr-1" 
                                fill="currentColor" 
                                viewBox="0 0 20 20"
                                aria-hidden="true"
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Checked In
                            </>
                          ) : (
                            'Not Checked In'
                          )}
                        </span>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleCheckIn(guest.id)}
                        onKeyDown={(e) => handleKeyDown(e, guest.id)}
                        className={`min-h-[44px] min-w-[100px] px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 ${
                          guest.checkedIn
                            ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500'
                            : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500'
                        }`}
                        aria-label={`${guest.checkedIn ? 'Check out' : 'Check in'} ${guest.name}`}
                      >
                        {guest.checkedIn ? 'Check Out' : 'Check In'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {filteredGuests.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500" role="status">
                {debouncedSearchTerm.length >= 3 
                  ? `No guests found matching "${debouncedSearchTerm}"` 
                  : 'No guests in this event'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GuestList; 