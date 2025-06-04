import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { events } from '../data/mockData';
import AriaLiveRegion from './AriaLiveRegion';
import { useAriaLiveAnnouncements } from '../hooks/useAriaLiveAnnouncements';

const AdminReset: React.FC = () => {
  const navigate = useNavigate();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [lastResetTime, setLastResetTime] = useState<string | null>(null);
  const { announcement, announce } = useAriaLiveAnnouncements();

  useEffect(() => {
    // Load last reset time from localStorage
    const savedResetTime = localStorage.getItem('last-admin-reset');
    if (savedResetTime) {
      setLastResetTime(new Date(savedResetTime).toLocaleString());
    }
  }, []);

  const handleResetRequest = () => {
    setShowConfirmDialog(true);
    announce('Confirmation dialog opened');
  };

  const handleConfirmReset = () => {
    // Clear all check-in data for all events
    events.forEach(event => {
      try {
        localStorage.removeItem(`checkins-${event.id}`);
      } catch (error) {
        console.warn(`Failed to clear check-in data for event ${event.id}:`, error);
      }
    });
    
    // Store reset timestamp
    try {
      const resetTime = new Date().toISOString();
      localStorage.setItem('last-admin-reset', resetTime);
      setLastResetTime(new Date(resetTime).toLocaleString());
    } catch (error) {
      console.warn('Failed to store reset timestamp:', error);
    }
    
    // Close dialog and show success
    setShowConfirmDialog(false);
    setResetConfirmed(true);
    
    announce('All check-ins have been reset successfully');
    
    // Reset the confirmation after 5 seconds
    setTimeout(() => {
      setResetConfirmed(false);
    }, 5000);
  };

  const handleCancelReset = () => {
    setShowConfirmDialog(false);
    announce('Reset cancelled');
  };

  const handleKeyDown = (event: React.KeyboardEvent, action: () => void) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      action();
    }
  };

  // Calculate total guests across all events for statistics
  const totalGuests = events.reduce((total, event) => total + event.guests.length, 0);
  const totalEvents = events.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* ARIA Live Region for announcements */}
      <AriaLiveRegion announcement={announcement} />
      
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-6">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors mb-4 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            aria-label="Navigate back to events list"
          >
            ← Back to Events
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600">
            Manage system-wide settings and reset guest check-ins.
          </p>
        </div>

        {/* Main Reset Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="border-l-4 border-yellow-400 bg-yellow-50 p-4 mb-6" role="alert">
            <div className="flex">
              <svg 
                className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0" 
                viewBox="0 0 20 20" 
                fill="currentColor"
                aria-hidden="true"
              >
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-yellow-700">
                  <strong>Warning:</strong> This action will reset all guest check-ins across all {totalEvents} events ({totalGuests} total guests). 
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Reset All Check-ins
          </h2>
          
          <p className="text-gray-600 mb-6">
            Use this function to reset all guest check-ins to "Not Checked In" status across all events. 
            This is useful for testing or starting fresh for a new event cycle.
          </p>

          {resetConfirmed ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4" role="status">
              <div className="flex items-center">
                <svg 
                  className="h-5 w-5 text-green-400 flex-shrink-0" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Reset completed successfully! All check-ins have been cleared across {totalEvents} events.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={handleResetRequest}
              onKeyDown={(e) => handleKeyDown(e, handleResetRequest)}
              className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              aria-describedby="reset-warning"
            >
              Reset All Check-ins
            </button>
          )}
          
          <div id="reset-warning" className="sr-only">
            This will permanently clear all guest check-in data across all events
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            System Information
          </h2>
          
          <div className="grid gap-4">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">System Status:</span>
              <span className="text-green-600 font-medium">Online</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">Total Events:</span>
              <span className="text-gray-900">{totalEvents}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">Total Guests:</span>
              <span className="text-gray-900">{totalGuests}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="font-medium text-gray-600">Version:</span>
              <span className="text-gray-900">1.0.0</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="font-medium text-gray-600">Last Reset:</span>
              <span className="text-gray-900">{lastResetTime || 'Never'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmDialog && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          aria-describedby="modal-description"
        >
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg 
                  className="h-6 w-6 text-red-600" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 id="modal-title" className="text-lg font-medium text-gray-900 text-center mb-2">
                Confirm Reset Action
              </h3>
              
              <p id="modal-description" className="text-sm text-gray-500 text-center mb-6">
                Are you sure you want to reset all check-ins? This will clear check-in data for all {totalGuests} guests across {totalEvents} events. This action cannot be undone.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={handleCancelReset}
                  onKeyDown={(e) => handleKeyDown(e, handleCancelReset)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmReset}
                  onKeyDown={(e) => handleKeyDown(e, handleConfirmReset)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  autoFocus
                >
                  Yes, Reset All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReset; 