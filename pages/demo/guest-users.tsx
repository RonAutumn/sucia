import React, { useState } from 'react'
import Head from 'next/head'
import { useGuestUser, useIsGuestUserJoined } from '../../src/hooks/useGuestUser'
import NicknameEntry from '../../src/components/NicknameEntry'
import UserProfile from '../../src/components/UserProfile'
import TVUserDisplay from '../../src/components/TVUserDisplay'

export default function GuestUsersDemo() {
  const isJoined = useIsGuestUserJoined()
  const { allUsers, activeUsers, currentUser } = useGuestUser()
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'carousel'>('grid')
  const [showTVDisplay, setShowTVDisplay] = useState(true)

  return (
    <>
      <Head>
        <title>Guest User System Demo - Sucia MVP</title>
        <meta name="description" content="Demo of the guest user system with nickname entry and TV display" />
      </Head>

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Guest User System Demo
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simple user system without authentication
                </p>
              </div>
              
              {isJoined && (
                <div className="flex items-center space-x-4">
                  <UserProfile compact />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!isJoined ? (
            /* Nickname Entry Screen */
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  Join the Game! 🎮
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Enter a nickname to get started. No account required!
                </p>
              </div>
              
              <NicknameEntry
                onJoined={(nickname) => {
                  console.log('User joined:', nickname)
                }}
              />
              
              {/* Demo Info */}
              <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  🎯 Demo Features:
                </h3>
                <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                  <li>• <strong>No Authentication:</strong> Just pick a nickname and start playing</li>
                  <li>• <strong>Real-time Updates:</strong> See other players join and leave instantly</li>
                  <li>• <strong>TV Display:</strong> Perfect for showing active players on a main screen</li>
                  <li>• <strong>Session Management:</strong> Automatic cleanup when users leave</li>
                  <li>• <strong>Color Coding:</strong> Each user gets a unique color for visual distinction</li>
                </ul>
              </div>
            </div>
          ) : (
            /* Main Demo Interface */
            <div className="space-y-8">
              {/* User Profile Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Your Profile
                  </h2>
                  <UserProfile />
                </div>
                
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                      System Stats
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {allUsers.length}
                        </div>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          Total Users
                        </div>
                      </div>
                      
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {activeUsers.length}
                        </div>
                        <div className="text-sm text-green-800 dark:text-green-300">
                          Active Users
                        </div>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {currentUser?.nickname}
                        </div>
                        <div className="text-sm text-purple-800 dark:text-purple-300">
                          Your Nickname
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* TV Display Controls */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    TV Display Settings
                  </h2>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={showTVDisplay}
                      onChange={(e) => setShowTVDisplay(e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      Show TV Display
                    </span>
                  </label>
                </div>
                
                {showTVDisplay && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        View Mode:
                      </span>
                      {(['grid', 'list', 'carousel'] as const).map((mode) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                            viewMode === mode
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* TV Display */}
              {showTVDisplay && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      📺 Main TV Display
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      This is what would be shown on the main TV screen for all players to see
                    </p>
                  </div>
                  
                  <TVUserDisplay
                    displayMode={viewMode}
                    maxUsers={20}
                    showJoinTime={true}
                    showUserCount={true}
                    autoScroll={viewMode === 'carousel'}
                    updateInterval={3000}
                  />
                </div>
              )}

              {/* Instructions */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
                  💡 Try These Actions:
                </h3>
                <ul className="space-y-2 text-yellow-800 dark:text-yellow-200">
                  <li>• Open this page in multiple browser tabs/windows to simulate multiple users</li>
                  <li>• Try different nicknames and see the color assignment</li>
                  <li>• Switch between different TV display modes (Grid, List, Carousel)</li>
                  <li>• Leave and rejoin to see the session management in action</li>
                  <li>• Wait 5+ minutes to see automatic activity timeout</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
} 