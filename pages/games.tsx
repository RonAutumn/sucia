import React, { useState, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DashboardLayout from '../src/components/layout/DashboardLayout'
import GamesPlatform from '../src/components/GamesPlatform'
import { events } from '../src/data/mockData'
import { Event, Guest } from '../src/types'

export default function GamesPage() {
  const router = useRouter()
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Ensure we only run client-side code after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Set default event (first event or most recent)
  useEffect(() => {
    if (events.length > 0 && !selectedEvent) {
      // Default to the first upcoming event, or the first event if none are upcoming
      const upcomingEvents = events.filter(event => new Date(event.date) >= new Date())
      const defaultEvent = upcomingEvents.length > 0 ? upcomingEvents[0] : events[0]
      setSelectedEvent(defaultEvent)
    }
  }, [selectedEvent])

  // Get all guests for the selected event
  const eventGuests: Guest[] = selectedEvent ? selectedEvent.guests : []

  // Show loading state during hydration
  if (!isClient || !selectedEvent) {
    return (
      <>
        <Head>
          <title>Games Platform - Sucia MVP</title>
          <meta name="description" content="Interactive games platform for events" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <DashboardLayout title="Games">
          <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Games Platform
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Create and manage interactive games for your events
              </p>
            </div>

            {/* Loading state */}
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading games platform...</span>
            </div>
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Games Platform - Sucia MVP</title>
        <meta name="description" content="Interactive games platform for events" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout title="Games Platform">
        <div className="p-6 max-w-7xl mx-auto">

          {/* Event Selection */}
          <div className="mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                    Select Event
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Choose which event to manage games for
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <select
                    value={selectedEvent?.id || ''}
                    onChange={(e) => {
                      const event = events.find(ev => ev.id === e.target.value)
                      setSelectedEvent(event || null)
                    }}
                    className="block w-64 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {new Date(event.date).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => router.push(`/event/${selectedEvent?.id}`)}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Event
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Event Info Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-2">
                    {selectedEvent.name}
                  </h3>
                  <p className="text-blue-700 dark:text-blue-400 mb-3">
                    {selectedEvent.description}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {new Date(selectedEvent.date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {selectedEvent.location}
                    </div>
                    <div className="flex items-center text-blue-600 dark:text-blue-400">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                      {eventGuests.length} guests
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    new Date(selectedEvent.date) > new Date()
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : new Date(selectedEvent.date).toDateString() === new Date().toDateString()
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}>
                    {new Date(selectedEvent.date) > new Date()
                      ? 'Upcoming'
                      : new Date(selectedEvent.date).toDateString() === new Date().toDateString()
                      ? 'Today'
                      : 'Past'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button
                onClick={() => router.push('/demo/game-lobby')}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Game Lobby</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Demo lobby</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
              
              <button
                onClick={() => router.push(`/event/${selectedEvent.id}`)}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Event Details</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">View full event</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                onClick={() => router.push('/checkins')}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Check-ins</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Manage guests</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>

              <button
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow text-left"
                disabled
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-500 dark:text-gray-400">Analytics</h4>
                    <p className="text-sm text-gray-400 dark:text-gray-500">Coming soon</p>
                  </div>
                  <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            </div>
          </div>

          {/* Games Platform Component */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <GamesPlatform 
              event={selectedEvent} 
              guests={eventGuests}
            />
          </div>
        </div>
      </DashboardLayout>
    </>
  )
} 