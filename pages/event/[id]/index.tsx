import React, { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { events } from '../../../src/data/mockData'
import { Guest } from '../../../src/types'
import CheckInCounter from '../../../src/components/CheckInCounter'
import AriaLiveRegion from '../../../src/components/AriaLiveRegion'
import FuzzySearchBox from '../../../src/components/FuzzySearchBox'
import { useAriaLiveAnnouncements } from '../../../src/hooks/useAriaLiveAnnouncements'
import { exportGuestsToCSV } from '../../../src/utils/csvUtils'
import { fuzzySearch, FuzzySearchResult, highlightMatches } from '../../../src/utils/fuzzySearch'
import Link from 'next/link'
import { useMemo, useCallback, memo } from 'react'
import { FixedSizeList as List } from 'react-window'

// Enhanced GuestItem component
const GuestItem = memo(({ 
  guest, 
  onToggleCheckIn, 
  onKeyDown,
  highlightedName,
  searchScore
}: { 
  guest: Guest
  onToggleCheckIn: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent, id: string) => void
  highlightedName?: React.ReactNode
  searchScore?: number
}) => (
  <div 
    className={`p-6 ${guest.checkedIn ? 'bg-green-50 dark:bg-green-900/20' : 'bg-white dark:bg-gray-800'} border-b border-gray-200 dark:border-gray-700 transition-colors`}
    role="article"
    aria-labelledby={`guest-${guest.id}-name`}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h3 id={`guest-${guest.id}-name`} className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            {highlightedName || guest.name}
          </h3>
          {searchScore && searchScore < 1.0 && searchScore >= 0.8 && (
            <span className="text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-full">
              fuzzy match
            </span>
          )}
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm">{guest.email}</p>
        <div className="mt-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              guest.checkedIn
                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
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
          onClick={() => onToggleCheckIn(guest.id)}
          onKeyDown={(e) => onKeyDown(e, guest.id)}
          className={`min-h-[44px] min-w-[100px] px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
            guest.checkedIn
              ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 focus:ring-red-500 dark:focus:ring-red-400'
              : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 focus:ring-green-500 dark:focus:ring-green-400'
          }`}
          aria-label={`${guest.checkedIn ? 'Check out' : 'Check in'} ${guest.name}`}
        >
          {guest.checkedIn ? 'Check Out' : 'Check In'}
        </button>
      </div>
    </div>
  </div>
))

GuestItem.displayName = 'GuestItem'

// Enhanced table row component
const GuestTableRow = memo(({ 
  guest, 
  onToggleCheckIn, 
  onKeyDown,
  highlightedName,
  searchScore
}: { 
  guest: Guest
  onToggleCheckIn: (id: string) => void
  onKeyDown: (event: React.KeyboardEvent, id: string) => void
  highlightedName?: React.ReactNode
  searchScore?: number
}) => (
  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${guest.checkedIn ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-100">
      <div className="flex items-center gap-2">
        <span>{highlightedName || guest.name}</span>
        {searchScore && searchScore < 1.0 && searchScore >= 0.8 && (
          <span className="text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded">
            fuzzy
          </span>
        )}
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
      {guest.email}
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          guest.checkedIn
            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
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
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
      <button
        onClick={() => onToggleCheckIn(guest.id)}
        onKeyDown={(e) => onKeyDown(e, guest.id)}
        className={`min-h-[44px] min-w-[100px] px-4 py-2 rounded-md font-medium transition-colors focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
          guest.checkedIn
            ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 focus:ring-red-500 dark:focus:ring-red-400'
            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50 focus:ring-green-500 dark:focus:ring-green-400'
        }`}
        aria-label={`${guest.checkedIn ? 'Check out' : 'Check in'} ${guest.name}`}
      >
        {guest.checkedIn ? 'Check Out' : 'Check In'}
      </button>
    </td>
  </tr>
))

GuestTableRow.displayName = 'GuestTableRow'

export default function EventCheckInPage() {
  const router = useRouter()
  const { id } = router.query
  const [guests, setGuests] = useState<Guest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isExporting, setIsExporting] = useState(false)
  const [searchPerformance, setSearchPerformance] = useState<number | null>(null)
  const [isClient, setIsClient] = useState(false)
  const { announcement, announce } = useAriaLiveAnnouncements()

  const event = events.find(e => e.id === id)

  // Ensure we only run client-side code after hydration
  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleSearchChange = useCallback((term: string) => {
    setSearchTerm(term)
  }, [])

  useEffect(() => {
    if (event && isClient) {
      // Load check-in statuses from localStorage
      const savedCheckIns = localStorage.getItem(`checkins-${id}`)
      const checkInData = savedCheckIns ? JSON.parse(savedCheckIns) : {}
      
      // Apply saved check-in statuses and sort alphabetically
      const updatedGuests = event.guests
        .map(guest => ({
          ...guest,
          checkedIn: checkInData[guest.id] !== undefined ? checkInData[guest.id] : guest.checkedIn
        }))
        .sort((a, b) => a.name.localeCompare(b.name))
      
      setGuests(updatedGuests)
    } else if (event && !isClient) {
      // Set default data during SSR
      setGuests(event.guests.sort((a, b) => a.name.localeCompare(b.name)))
    }
  }, [event, id, isClient])

  // Enhanced fuzzy search filtering with performance monitoring
  const { searchResults, filteredGuests } = useMemo(() => {
    const startTime = performance.now()
    
    if (searchTerm.trim().length === 0) {
      const endTime = performance.now()
      setSearchPerformance(endTime - startTime)
      return {
        searchResults: guests.map(guest => ({ item: guest, score: 1.0, matchPositions: [] })),
        filteredGuests: guests
      }
    }

    // Perform fuzzy search with performance optimization
    const results = fuzzySearch(
      guests,
      searchTerm,
      (guest) => guest.name,
      {
        maxResults: 100,
        minScore: 0.3
      }
    )

    const endTime = performance.now()
    setSearchPerformance(endTime - startTime)

    return {
      searchResults: results,
      filteredGuests: results.map(result => result.item)
    }
  }, [guests, searchTerm])

  const toggleCheckIn = (guestId: string) => {
    if (!isClient) return // Prevent any client-side operations during SSR
    
    setGuests(prevGuests => {
      const updatedGuests = prevGuests.map(guest =>
        guest.id === guestId ? { ...guest, checkedIn: !guest.checkedIn } : guest
      )
      
      // Find the guest that was toggled for announcement
      const toggledGuest = updatedGuests.find(guest => guest.id === guestId)
      if (toggledGuest) {
        const action = toggledGuest.checkedIn ? 'checked in' : 'checked out'
        announce(`Guest ${toggledGuest.name} ${action} successfully`)
      }
      
      // Save to localStorage
      const checkInData = updatedGuests.reduce((acc, guest) => {
        acc[guest.id] = guest.checkedIn
        return acc
      }, {} as Record<string, boolean>)
      
      localStorage.setItem(`checkins-${id}`, JSON.stringify(checkInData))
      
      return updatedGuests
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent, guestId: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggleCheckIn(guestId)
    }
  }

  const clearSearch = useCallback(() => {
    handleSearchChange('')
  }, [handleSearchChange])

  const handleExportCSV = async () => {
    if (!id || isExporting || !isClient) return
    
    setIsExporting(true)
    
    try {
      // Use filteredGuests to export only the currently visible guests
      const guestsToExport = filteredGuests.length > 0 ? filteredGuests : guests
      
      // Add a small delay for better UX with loading state
      await new Promise(resolve => setTimeout(resolve, 100))
      
      exportGuestsToCSV(guestsToExport, id as string)
      
      // Announce success
      const exportedCount = guestsToExport.length
      announce(`Successfully exported ${exportedCount} guest${exportedCount !== 1 ? 's' : ''} to CSV`)
      
    } catch (error) {
      console.error('Error exporting CSV:', error)
      announce('Failed to export guest list. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const checkedInCount = guests.filter(guest => guest.checkedIn).length

  // Enhanced virtual list row renderer with fuzzy search highlighting
  const VirtualGuestItem = ({ index, style }: { index: number; style: React.CSSProperties }) => {
    const result = searchResults[index]
    if (!result) return null

    const highlightedName = highlightMatches(result.item.name, result.matchPositions)
    
    return (
      <div style={style}>
        <GuestItem
          guest={result.item}
          onToggleCheckIn={toggleCheckIn}
          onKeyDown={handleKeyDown}
          highlightedName={highlightedName}
          searchScore={result.score}
        />
      </div>
    )
  }

  // Determine if we should use virtual scrolling (threshold: 50+ items)
  const useVirtualScrolling = filteredGuests.length > 50

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
          <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline">
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>{event.name} - Check-ins | Sucia MVP</title>
        <meta name="description" content={`Manage check-ins for ${event.name}`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AriaLiveRegion announcement={announcement} />
        
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/"
              className="bg-gray-600 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors mb-4 inline-flex items-center focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
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
              Dashboard
            </Link>
            
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {event.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{event.description}</p>
            <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              <p>Date: {event.date}</p>
              <p>Location: {event.location}</p>
            </div>
            
            {/* Check-in Counter */}
            <CheckInCounter
              checkedInCount={checkedInCount}
              totalCount={guests.length}
              className="mb-6"
            />
            
            {/* QR Scanner Demo Link */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-1">QR Code Scanner (Demo)</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    Try the experimental QR/barcode scanning feature for faster check-ins
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/event/${id}/qr-scanner`)}
                  className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-2"
                  aria-label="Open QR scanner demo"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h5.01M4 20h5.01" />
                  </svg>
                  Try Scanner
                </button>
              </div>
            </div>
          </div>

          {/* Enhanced Fuzzy Search Bar and Export */}
          <div className="sticky top-0 bg-gray-50 dark:bg-gray-900 py-4 z-10 transition-colors duration-200">
            <div className="flex gap-4 items-start">
              <div className="flex-1">
                <FuzzySearchBox
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  resultsCount={filteredGuests.length}
                  totalCount={guests.length}
                  isPerformanceMode={process.env.NODE_ENV === 'development'}
                  searchPerformance={searchPerformance}
                />
              </div>
              
              {/* Export Button */}
              <button
                onClick={handleExportCSV}
                disabled={isExporting || filteredGuests.length === 0 || !isClient}
                className={`min-h-[44px] px-4 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 focus:ring-blue-500 dark:focus:ring-blue-400 flex items-center gap-2 ${
                  isExporting || filteredGuests.length === 0 || !isClient
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
                }`}
                aria-label={`Export ${filteredGuests.length} visible guest${filteredGuests.length !== 1 ? 's' : ''} to CSV`}
              >
                {isExporting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Exporting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Guest List ({guests.length} guest{guests.length !== 1 ? 's' : ''} total)
            </h2>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <div className="shadow overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" role="table">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
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
                      const highlightedName = highlightMatches(result.item.name, result.matchPositions)
                      return (
                        <GuestTableRow
                          key={result.item.id}
                          guest={result.item}
                          onToggleCheckIn={toggleCheckIn}
                          onKeyDown={handleKeyDown}
                          highlightedName={highlightedName}
                          searchScore={result.score}
                        />
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="lg:hidden">
              {useVirtualScrolling ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <List
                    height={600} // Fixed height for virtual scrolling
                    width="100%" // Full width
                    itemCount={filteredGuests.length}
                    itemSize={140} // Height of each guest item
                    className="divide-y divide-gray-200 dark:divide-gray-700"
                  >
                    {VirtualGuestItem}
                  </List>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {searchResults.map((result) => {
                    const highlightedName = highlightMatches(result.item.name, result.matchPositions)
                    return (
                      <GuestItem
                        key={result.item.id}
                        guest={result.item}
                        onToggleCheckIn={toggleCheckIn}
                        onKeyDown={handleKeyDown}
                        highlightedName={highlightedName}
                        searchScore={result.score}
                      />
                    )
                  })}
                </div>
              )}
            </div>

            {filteredGuests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500 dark:text-gray-400">
                  {searchTerm ? 'No guests found matching your search.' : 'No guests found.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
} 