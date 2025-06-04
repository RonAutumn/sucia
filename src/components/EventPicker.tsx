import React from 'react';
import { useNavigate } from 'react-router-dom';
import { events } from '../data/mockData';

const EventPicker: React.FC = () => {
  const navigate = useNavigate();

  const handleEventSelect = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  const handleKeyDown = (event: React.KeyboardEvent, eventId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleEventSelect(eventId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Select an Event
        </h1>
        
        {/* Responsive grid: 1 column on mobile, 2 on tablet, 3+ on desktop */}
        <div 
          className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          role="list"
          aria-label="Available events"
        >
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden transform hover:scale-105 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2"
              onClick={() => handleEventSelect(event.id)}
              onKeyDown={(e) => handleKeyDown(e, event.id)}
              tabIndex={0}
              role="listitem"
              aria-label={`${event.name} event on ${formatDate(event.date)} at ${event.location} with ${event.guests.length} guests`}
            >
              {/* Date Badge */}
              <div className="bg-blue-600 text-white px-4 py-2">
                <div className="text-sm font-medium" aria-label={`Event date: ${formatDate(event.date)}`}>
                  {formatDate(event.date)}
                </div>
              </div>
              
              {/* Card Content */}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                  {event.name}
                </h2>
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{event.description}</p>
                
                {/* Event Details */}
                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 mr-2 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                  <div className="flex items-center">
                    <svg 
                      className="w-4 h-4 mr-2 text-gray-400" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <span className="font-medium text-blue-600">
                      {event.guests.length} guests registered
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500" role="status">
              No events available at this time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventPicker; 