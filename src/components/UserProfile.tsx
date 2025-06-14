import React, { useState } from 'react'
import { useCurrentGuestUser, useGuestUser } from '../hooks/useGuestUser'

interface UserProfileProps {
  className?: string
  showLeaveButton?: boolean
  compact?: boolean
}

export function UserProfile({ 
  className = "",
  showLeaveButton = true,
  compact = false
}: UserProfileProps) {
  const currentUser = useCurrentGuestUser()
  const { leaveSession, updateActivity } = useGuestUser()
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  if (!currentUser) {
    return null
  }

  const handleLeave = () => {
    setShowLeaveConfirm(false)
    leaveSession()
  }

  const formatJoinTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(minutes / 60)

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`
    } else if (minutes > 0) {
      return `${minutes}m`
    } else {
      return 'Just joined'
    }
  }

  const formatSessionTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const totalMinutes = Math.floor(diff / 60000)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div
          className="w-8 h-8 rounded-full"
          style={{ backgroundColor: currentUser.color }}
        />
        <div>
          <div className="font-medium text-gray-900 dark:text-white">
            {currentUser.nickname}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Online for {formatSessionTime(currentUser.joinedAt)}
          </div>
        </div>
        <div className="flex items-center text-green-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1" />
          <span className="text-xs">Active</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 ${className}`} 
         style={{ borderColor: currentUser.color }}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: currentUser.color }}
            >
              {currentUser.nickname.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {currentUser.nickname}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guest Player
              </p>
            </div>
          </div>
          
          <div className="flex items-center text-green-500">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mr-2" />
            <span className="text-sm font-medium">ONLINE</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Session Time
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatSessionTime(currentUser.joinedAt)}
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Joined
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              {formatJoinTime(currentUser.joinedAt)} ago
            </div>
          </div>
        </div>

        {/* User ID (for debugging/support) */}
        <div className="mb-4">
          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
            Player ID
          </div>
          <div className="text-sm font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded px-2 py-1">
            {currentUser.id.slice(-8)}
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Status
            </div>
            <div className="flex items-center mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Active & Ready to Play
              </span>
            </div>
          </div>
          
          <button
            onClick={updateActivity}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
          >
            Update Activity
          </button>
        </div>

        {/* Actions */}
        {showLeaveButton && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
            {showLeaveConfirm ? (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-700 dark:text-red-400 mb-3">
                  Are you sure you want to leave the game?
                </p>
                <div className="flex space-x-2">
                  <button
                    onClick={handleLeave}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    Yes, Leave
                  </button>
                  <button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Leave Game
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile 