import React, { useState, useEffect } from 'react'
import { useActiveGuestUsers } from '../hooks/useGuestUser'
import { GuestUser } from '../types/guestUser'

interface TVUserDisplayProps {
  className?: string
  maxUsers?: number
  showJoinTime?: boolean
  showUserCount?: boolean
  autoScroll?: boolean
  displayMode?: 'grid' | 'list' | 'carousel'
  updateInterval?: number
}

export function TVUserDisplay({
  className = "",
  maxUsers = 20,
  showJoinTime = true,
  showUserCount = true,
  autoScroll = true,
  displayMode = 'grid',
  updateInterval = 3000
}: TVUserDisplayProps) {
  const activeUsers = useActiveGuestUsers()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [displayUsers, setDisplayUsers] = useState<GuestUser[]>([])
  const [scrollOffset, setScrollOffset] = useState(0)

  // Update current time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Update display users and handle scrolling
  useEffect(() => {
    const sortedUsers = [...activeUsers]
      .sort((a, b) => a.joinedAt - b.joinedAt) // Sort by join time
      .slice(0, maxUsers)

    setDisplayUsers(sortedUsers)

    // Reset scroll if users changed significantly
    if (scrollOffset >= sortedUsers.length) {
      setScrollOffset(0)
    }
  }, [activeUsers, maxUsers, scrollOffset])

  // Auto-scroll for carousel mode
  useEffect(() => {
    if (!autoScroll || displayMode !== 'carousel' || displayUsers.length <= 8) {
      return
    }

    const interval = setInterval(() => {
      setScrollOffset(prev => (prev + 1) % displayUsers.length)
    }, updateInterval)

    return () => clearInterval(interval)
  }, [autoScroll, displayMode, displayUsers.length, updateInterval])

  const formatJoinTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  const getVisibleUsers = () => {
    if (displayMode !== 'carousel') {
      return displayUsers
    }

    // For carousel, show 8 users starting from scrollOffset
    const visibleCount = Math.min(8, displayUsers.length)
    const users = []
    
    for (let i = 0; i < visibleCount; i++) {
      const index = (scrollOffset + i) % displayUsers.length
      users.push(displayUsers[index])
    }
    
    return users
  }

  const visibleUsers = getVisibleUsers()

  if (displayUsers.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-12">
          <div className="text-6xl mb-4">🎮</div>
          <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">
            No Active Players
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Waiting for players to join the game...
          </p>
        </div>
      </div>
    )
  }

  const renderUserCard = (user: GuestUser, index: number) => (
    <div
      key={user.id}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-l-4 transition-all duration-300 hover:shadow-xl"
      style={{ borderLeftColor: user.color }}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {user.nickname}
            </h3>
          </div>
          <div className="flex items-center text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-xs font-medium">ACTIVE</span>
          </div>
        </div>
        
        {showJoinTime && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Joined {formatJoinTime(user.joinedAt)}
          </p>
        )}
      </div>
    </div>
  )

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {visibleUsers.map(renderUserCard)}
    </div>
  )

  const renderListView = () => (
    <div className="space-y-3">
      {visibleUsers.map((user, index) => (
        <div
          key={user.id}
          className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md border-l-4"
          style={{ borderLeftColor: user.color }}
        >
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-gray-500">
              #{index + 1}
            </div>
            <div
              className="w-6 h-6 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {user.nickname}
              </h3>
              {showJoinTime && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatJoinTime(user.joinedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center text-green-500">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-xs font-medium">ONLINE</span>
          </div>
        </div>
      ))}
    </div>
  )

  const renderCarouselView = () => (
    <div className="relative">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {visibleUsers.map(renderUserCard)}
      </div>
      
      {displayUsers.length > 8 && (
        <div className="flex justify-center mt-6">
          <div className="flex space-x-2">
            {Array.from({ length: Math.ceil(displayUsers.length / 8) }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-colors ${
                  Math.floor(scrollOffset / 8) === i
                    ? 'bg-blue-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
            <span className="text-4xl mr-3">🎮</span>
            Active Players
          </h1>
          {showUserCount && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {displayUsers.length} player{displayUsers.length !== 1 ? 's' : ''} online
            </p>
          )}
        </div>
        
        <div className="text-right">
          <div className="text-lg font-mono text-gray-700 dark:text-gray-300">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Users Display */}
      <div className="min-h-[400px]">
        {displayMode === 'grid' && renderGridView()}
        {displayMode === 'list' && renderListView()}
        {displayMode === 'carousel' && renderCarouselView()}
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              Live Updates
            </div>
            {displayMode === 'carousel' && displayUsers.length > 8 && (
              <div>
                Auto-scrolling every {updateInterval / 1000}s
              </div>
            )}
          </div>
          <div>
            Showing {visibleUsers.length} of {displayUsers.length} players
          </div>
        </div>
      </div>
    </div>
  )
}

export default TVUserDisplay 