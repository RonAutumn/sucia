import React, { useState } from 'react'
import Head from 'next/head'
import { useIsGuestUserJoined } from '../../src/hooks/useGuestUser'
import NicknameEntry from '../../src/components/NicknameEntry'
import QueueSignup from '../../src/components/QueueSignup'
import QueueDisplay from '../../src/components/QueueDisplay'
import StaffQueueManager from '../../src/components/StaffQueueManager'
import UserProfile from '../../src/components/UserProfile'

export default function QueueManagementDemo() {
  const isJoined = useIsGuestUserJoined()
  const [activeTab, setActiveTab] = useState<'customer' | 'staff' | 'display'>('customer')
  const [selectedService, setSelectedService] = useState('')

  const tabs = [
    { id: 'customer', label: 'Customer View', icon: '👤' },
    { id: 'staff', label: 'Staff Management', icon: '👨‍💼' },
    { id: 'display', label: 'Queue Display', icon: '📺' }
  ]

  return (
    <>
      <Head>
        <title>Queue Management System Demo - Sucia MVP</title>
        <meta name="description" content="Demo of the service queue management system with signup, tracking, and staff controls" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <h1 className="text-xl font-bold text-gray-900">Queue Management System</h1>
                <span className="text-sm text-gray-500">Demo Environment</span>
              </div>
              
              {isJoined && (
                <UserProfile compact showLeaveButton={false} />
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'customer' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Experience</h2>
                <p className="text-gray-600 mb-6">
                  Experience the queue system from a customer's perspective. Join queues, track your position, and receive updates.
                </p>
              </div>

              {!isJoined ? (
                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <div className="text-4xl mb-4">👋</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Welcome!</h3>
                    <p className="text-gray-600">Enter a nickname to get started with the queue system.</p>
                  </div>
                  <NicknameEntry 
                    onJoined={() => console.log('User joined')}
                    showWelcome={false}
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Queue Signup */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Join a Service Queue</h3>
                    <QueueSignup 
                      onJoined={(serviceId) => {
                        console.log('Joined queue for service:', serviceId)
                        setSelectedService(serviceId)
                      }}
                      onError={(error) => console.error('Queue signup error:', error)}
                    />
                  </div>

                  {/* Current Queue Status */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Queue Status</h3>
                    <QueueDisplay 
                      showAllServices={false}
                      serviceId={selectedService}
                      maxEntries={5}
                      showUserActions={true}
                      compact={false}
                    />
                  </div>
                </div>
              )}

              {isJoined && (
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All Service Queues</h3>
                  <QueueDisplay 
                    showAllServices={true}
                    maxEntries={3}
                    showStats={true}
                    showUserActions={false}
                    compact={true}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Staff Management</h2>
                <p className="text-gray-600 mb-6">
                  Manage service queues, call customers, track service progress, and handle queue operations.
                </p>
              </div>

              <StaffQueueManager showAllServices={true} />
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Queue Display</h2>
                <p className="text-gray-600 mb-6">
                  Public display view optimized for showing queue status on TVs or large screens.
                </p>
              </div>

              <div className="bg-black text-white rounded-lg p-8 min-h-[600px]">
                <div className="text-center mb-8">
                  <h1 className="text-4xl font-bold mb-2">Service Queue Status</h1>
                  <p className="text-xl text-gray-300">Live Updates • {new Date().toLocaleTimeString()}</p>
                </div>

                <QueueDisplay 
                  className="text-white"
                  showAllServices={true}
                  maxEntries={5}
                  showStats={true}
                  showUserActions={false}
                  compact={false}
                  refreshInterval={10000}
                />
              </div>
            </div>
          )}
        </div>

        {/* Demo Instructions */}
        <div className="bg-blue-50 border-t border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-start space-x-4">
              <div className="text-blue-600 text-xl">💡</div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Instructions</h3>
                <div className="text-blue-800 space-y-2">
                  <p><strong>Customer View:</strong> Enter a nickname, join queues, and track your position in real-time.</p>
                  <p><strong>Staff Management:</strong> Call customers, start services, mark completions, skip entries, and adjust positions.</p>
                  <p><strong>Queue Display:</strong> TV-optimized view showing all queues with live updates every 10 seconds.</p>
                  <p className="text-sm text-blue-600 mt-3">
                    💾 All data is stored locally in your browser. Open multiple tabs to simulate different users and staff interactions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white border-t">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">System Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">🎯</div>
                <h4 className="font-semibold text-gray-900 mb-2">Smart Queue Management</h4>
                <p className="text-sm text-gray-600">
                  Automatic position tracking, wait time estimation, and priority handling.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">⚡</div>
                <h4 className="font-semibold text-gray-900 mb-2">Real-time Updates</h4>
                <p className="text-sm text-gray-600">
                  Live position changes, status updates, and automatic queue progression.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">👥</div>
                <h4 className="font-semibold text-gray-900 mb-2">Multi-Service Support</h4>
                <p className="text-sm text-gray-600">
                  Handle multiple service types with different durations and capacities.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">📊</div>
                <h4 className="font-semibold text-gray-900 mb-2">Analytics & Stats</h4>
                <p className="text-sm text-gray-600">
                  Queue statistics, wait time analysis, and service completion tracking.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">🔧</div>
                <h4 className="font-semibold text-gray-900 mb-2">Staff Controls</h4>
                <p className="text-sm text-gray-600">
                  Call customers, manage service flow, skip entries, and adjust positions.
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-2xl mb-2">📺</div>
                <h4 className="font-semibold text-gray-900 mb-2">Display Integration</h4>
                <p className="text-sm text-gray-600">
                  TV-optimized displays for public queue status and customer notifications.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 