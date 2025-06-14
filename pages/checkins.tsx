import React, { useState, useMemo, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import DashboardLayout from '../src/components/layout/DashboardLayout'
import { events } from '../src/data/mockData'
import { Guest, Event } from '../src/types'
import CheckInCounter from '../src/components/CheckInCounter'
import { fuzzySearch, highlightMatches } from '../src/utils/fuzzySearch'
import FuzzySearchBox from '../src/components/FuzzySearchBox'
import { useAriaLiveAnnouncements } from '../src/hooks/useAriaLiveAnnouncements'
import AriaLiveRegion from '../src/components/AriaLiveRegion'

interface ExtendedGuest extends Guest {
  eventId: string
  eventName: string
}

export default function CheckInsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'all' | 'today' | 'upcoming'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isClient, setIsClient] = useState(false)
  const { announcement, announce } = useAriaLiveAnnouncements()

  // Ensure we only run client-side code after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdated(new Date())
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Get all guests from all events with event context
  const allGuests = useMemo((): ExtendedGuest[] => {
    if (!isClient) {
      // Return default data during SSR to prevent hydration mismatch
      return events.flatMap(event => 
        event.guests.map(guest => ({
          ...guest,
          eventId: event.id,
          eventName: event.name
        }))
      ).sort((a, b) => a.name.localeCompare(b.name))
    }

    const guestsWithEvents: ExtendedGuest[] = []
    
    events.forEach(event => {
      // Load check-in statuses from localStorage for each event
      let checkInData: Record<string, boolean> = {}
      try {
        const savedCheckIns = localStorage.getItem(`checkins-${event.id}`)
        checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {}
      } catch (error) {
        console.warn('Error loading check-in data from localStorage:', error)
        checkInData = {}
      }

      // Add guests with their event context and updated check-in status
      event.guests.forEach(guest => {
        guestsWithEvents.push({
          ...guest,
          checkedIn: checkInData[guest.id] !== undefined ? checkInData[guest.id] : guest.checkedIn,
          eventId: event.id,
          eventName: event.name
        })
      })
    })
    
    return guestsWithEvents.sort((a, b) => a.name.localeCompare(b.name))
  }, [isClient, lastUpdated])

  // Filter events based on active tab
  const filteredEvents = useMemo(() => {
    const today = new Date().toDateString()
    
    switch (activeTab) {
      case 'today':
        return events.filter(event => new Date(event.date).toDateString() === today)
      case 'upcoming':
        return events.filter(event => new Date(event.date) > new Date())
      default:
        return events
    }
  }, [activeTab])

  // Filter guests based on active tab and search
  const { searchResults, filteredGuests } = useMemo(() => {
    // First filter by tab
    let guests = allGuests
    if (activeTab !== 'all') {
      const relevantEventIds = filteredEvents.map(e => e.id)
      guests = allGuests.filter(guest => relevantEventIds.includes(guest.eventId))
    }

    // Then apply search
    if (searchTerm.trim().length === 0) {
      return {
        searchResults: guests.map(guest => ({ item: guest, score: 1.0, matchPositions: [] })),
        filteredGuests: guests
      }
    }

    const results = fuzzySearch(
      guests,
      searchTerm,
      (guest) => guest.name,
      {
        maxResults: 100,
        minScore: 0.3
      }
    )

    return {
      searchResults: results,
      filteredGuests: results.map(result => result.item)
    }
  }, [allGuests, filteredEvents, activeTab, searchTerm])

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalGuests = filteredGuests.length
    const checkedInGuests = filteredGuests.filter(guest => guest.checkedIn).length
    return {
      total: totalGuests,
      checkedIn: checkedInGuests,
      percentage: totalGuests > 0 ? Math.round((checkedInGuests / totalGuests) * 100) : 0
    }
  }, [filteredGuests])

  const toggleCheckIn = (guestId: string, eventId: string) => {
    if (!isClient) return // Prevent any client-side operations during SSR
    
    // Update localStorage for the specific event
    try {
      const savedCheckIns = localStorage.getItem(`checkins-${eventId}`)
      const checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {}
      
      // Toggle the check-in status
      checkInData[guestId] = !checkInData[guestId]
      
      localStorage.setItem(`checkins-${eventId}`, JSON.stringify(checkInData))
      
      // Find guest name for announcement
      const guest = allGuests.find(g => g.id === guestId)
      if (guest) {
        const action = checkInData[guestId] ? 'checked in' : 'checked out'
        announce(`${guest.name} ${action} successfully`)
      }
      
      // Trigger re-render by updating lastUpdated
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error updating check-in status:', error)
      announce('Error updating check-in status. Please try again.')
    }
  }

  const tabs = useMemo(() => {
    const baseGuests = isClient ? allGuests : events.flatMap(event => 
      event.guests.map(guest => ({
        ...guest,
        eventId: event.id,
        eventName: event.name
      }))
    )

    return [
      { id: 'all', label: 'All Events', count: baseGuests.length },
      { 
        id: 'today', 
        label: 'Today', 
        count: baseGuests.filter(g => 
          filteredEvents.filter(e => 
            new Date(e.date).toDateString() === new Date().toDateString()
          ).map(e => e.id).includes(g.eventId)
        ).length 
      },
      { 
        id: 'upcoming', 
        label: 'Upcoming', 
        count: baseGuests.filter(g => 
          filteredEvents.filter(e => 
            new Date(e.date) > new Date()
          ).map(e => e.id).includes(g.eventId)
        ).length 
      }
    ]
  }, [allGuests, filteredEvents, isClient])

  // Show loading state during hydration
  if (!isClient) {
    return (
      <>
        <Head>
          <title>Check-ins - Sucia MVP</title>
          <meta name="description" content="Manage guest check-ins across all events" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <DashboardLayout title="Guest Check-ins">
          <div className="p-6 max-w-7xl mx-auto">

            {/* Loading state */}
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600 dark:text-gray-400">Loading check-in data...</span>
            </div>
          </div>
        </DashboardLayout>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Check-ins - Sucia MVP</title>
        <meta name="description" content="Manage guest check-ins across all events" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <DashboardLayout title="Guest Check-ins">
        <div className="p-6 max-w-7xl mx-auto">
          <AriaLiveRegion announcement={announcement} />

          {/* Metrics Overview */}
          <div className="mb-6">
            <CheckInCounter
              checkedInCount={metrics.checkedIn}
              totalCount={metrics.total}
              className="mb-4"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200 dark:border-gray-700">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`
                      whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm
                      ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                      }
                    `}
                  >
                    {tab.label}
                    <span className={`
                      ml-2 py-0.5 px-2 rounded-full text-xs
                      ${activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-300'
                      }
                    `}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <FuzzySearchBox
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              resultsCount={filteredGuests.length}
              totalCount={allGuests.length}
              isPerformanceMode={false}
              searchPerformance={null}
            />
          </div>

          {/* Guest List */}
          <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-lg">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Guest
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Event
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((result) => {
                    const guest = result.item
                    const highlightedName = highlightMatches(guest.name, result.matchPositions)
                    
                    return (
                      <tr key={`${guest.eventId}-${guest.id}`} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${guest.checkedIn ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {highlightedName || guest.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {guest.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {guest.eventName}
                          </div>
                          <button
                            onClick={() => router.push(`/event/${guest.eventId}`)}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                          >
                            View Event →
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            guest.checkedIn
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          }`}>
                            {guest.checkedIn ? (
                              <>
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Checked In
                              </>
                            ) : (
                              'Not Checked In'
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => toggleCheckIn(guest.id, guest.eventId)}
                            className={`px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 ${
                              guest.checkedIn
                                ? 'bg-red-100 text-red-700 hover:bg-red-200 focus:ring-red-500 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50'
                                : 'bg-green-100 text-green-700 hover:bg-green-200 focus:ring-green-500 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50'
                            }`}
                            aria-label={`${guest.checkedIn ? 'Check out' : 'Check in'} ${guest.name}`}
                          >
                            {guest.checkedIn ? 'Check Out' : 'Check In'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {filteredGuests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No guests found matching your search.' : 'No guests found for the selected filter.'}
                </div>
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Last updated: {lastUpdated.toLocaleTimeString()} • 
              <button
                onClick={() => setLastUpdated(new Date())}
                className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                Refresh now
              </button>
            </p>
            <p className="mt-1">
              Auto-refreshes every 30 seconds
            </p>
          </div>
        </div>
      </DashboardLayout>
    </>
  )
} 