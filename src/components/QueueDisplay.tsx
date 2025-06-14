import React, { useState, useEffect } from 'react'
import { useQueue, useServiceQueue } from '../hooks/useQueue'
import { useCurrentGuestUser } from '../hooks/useGuestUser'
import { QueueEntry, ServiceType, QueueStatus } from '../types/queue'

interface QueueDisplayProps {
  className?: string
  serviceId?: string // If provided, shows only this service's queue
  showAllServices?: boolean
  maxEntries?: number
  showStats?: boolean
  showUserActions?: boolean
  compact?: boolean
  refreshInterval?: number
}

export function QueueDisplay({
  className = "",
  serviceId,
  showAllServices = true,
  maxEntries = 10,
  showStats = true,
  showUserActions = true,
  compact = false,
  refreshInterval = 30000
}: QueueDisplayProps) {
  const currentUser = useCurrentGuestUser()
  const { allQueues, services, stats, leaveQueue, refresh } = useQueue()
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '')
  const [isLeaving, setIsLeaving] = useState(false)

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refresh, refreshInterval])

  const formatWaitTime = (minutes: number): string => {
    if (minutes < 1) return 'Less than 1 min'
    if (minutes < 60) return `${Math.round(minutes)} min`
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return `${hours}h ${mins}m`
  }

  const formatJoinTime = (timestamp: number): string => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const getStatusColor = (status: QueueStatus): string => {
    switch (status) {
      case 'waiting': return 'text-blue-600 bg-blue-50'
      case 'called': return 'text-orange-600 bg-orange-50'
      case 'in-service': return 'text-green-600 bg-green-50'
      case 'completed': return 'text-gray-600 bg-gray-50'
      case 'cancelled': return 'text-red-600 bg-red-50'
      case 'skipped': return 'text-yellow-600 bg-yellow-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: QueueStatus): string => {
    switch (status) {
      case 'waiting': return '⏳'
      case 'called': return '📢'
      case 'in-service': return '🔄'
      case 'completed': return '✅'
      case 'cancelled': return '❌'
      case 'skipped': return '⏭️'
      default: return '❓'
    }
  }

  const handleLeaveQueue = async () => {
    setIsLeaving(true)
    try {
      await leaveQueue()
    } catch (error) {
      console.error('Failed to leave queue:', error)
    } finally {
      setIsLeaving(false)
    }
  }

  const renderQueueEntry = (entry: QueueEntry, index: number) => {
    const isCurrentUser = currentUser && entry.userId === currentUser.id
    const statusColor = getStatusColor(entry.status)
    const statusIcon = getStatusIcon(entry.status)

    return (
      <div
        key={entry.id}
        className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 ${
          isCurrentUser ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
        }`}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Position */}
          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
            isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
          }`}>
            {entry.position}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className={`font-medium ${isCurrentUser ? 'text-blue-900' : 'text-gray-900'}`}>
                {entry.userNickname}
              </span>
              {isCurrentUser && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">You</span>
              )}
            </div>
            
            {!compact && (
              <div className="text-sm text-gray-600 mt-1">
                <span>Joined {formatJoinTime(entry.joinedAt)}</span>
                {entry.preferences?.groupSize && entry.preferences.groupSize > 1 && (
                  <span className="ml-2">• Group of {entry.preferences.groupSize}</span>
                )}
                {entry.preferences?.preferredTime && (
                  <span className="ml-2">• {entry.preferences.preferredTime}</span>
                )}
              </div>
            )}
          </div>

          {/* Wait Time */}
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatWaitTime(entry.estimatedWaitTime)}
            </div>
            {!compact && (
              <div className="text-xs text-gray-500">estimated</div>
            )}
          </div>

          {/* Status */}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
            <span className="mr-1">{statusIcon}</span>
            {entry.status}
          </div>
        </div>

        {/* User Actions */}
        {showUserActions && isCurrentUser && entry.status === 'waiting' && (
          <div className="ml-3">
            <button
              onClick={handleLeaveQueue}
              disabled={isLeaving}
              className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
            >
              {isLeaving ? 'Leaving...' : 'Leave Queue'}
            </button>
          </div>
        )}
      </div>
    )
  }

  const renderServiceQueue = (service: ServiceType, queue: QueueEntry[]) => {
    const waitingQueue = queue.filter(entry => entry.status === 'waiting').slice(0, maxEntries)
    const inServiceCount = queue.filter(entry => entry.status === 'in-service').length
    const totalWaiting = queue.filter(entry => entry.status === 'waiting').length

    return (
      <div key={service.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
        {/* Service Header */}
        <div className="p-4 border-b border-gray-200" style={{ backgroundColor: service.color + '10' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{service.icon}</span>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{service.name}</h3>
                {!compact && (
                  <p className="text-sm text-gray-600">{service.description}</p>
                )}
              </div>
            </div>
            
            {showStats && (
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  {totalWaiting} waiting • {inServiceCount} in service
                </div>
                {!compact && (
                  <div className="text-xs text-gray-500">
                    ~{service.estimatedDuration}min per service
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Queue Entries */}
        <div className="divide-y divide-gray-100">
          {waitingQueue.length > 0 ? (
            waitingQueue.map((entry, index) => renderQueueEntry(entry, index))
          ) : (
            <div className="p-6 text-center text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No one in queue</p>
              <p className="text-sm">Be the first to join!</p>
            </div>
          )}
        </div>

        {/* Show More Indicator */}
        {totalWaiting > maxEntries && (
          <div className="p-3 text-center border-t border-gray-200 bg-gray-50">
            <span className="text-sm text-gray-600">
              +{totalWaiting - maxEntries} more in queue
            </span>
          </div>
        )}
      </div>
    )
  }

  if (serviceId) {
    // Single service view
    const service = services.find(s => s.id === serviceId)
    const queue = allQueues.get(serviceId) || []
    
    if (!service) {
      return (
        <div className={`text-center p-6 ${className}`}>
          <p className="text-gray-500">Service not found</p>
        </div>
      )
    }

    return (
      <div className={className}>
        {renderServiceQueue(service, queue)}
      </div>
    )
  }

  if (!showAllServices && selectedServiceId) {
    // Selected service view
    const service = services.find(s => s.id === selectedServiceId)
    const queue = allQueues.get(selectedServiceId) || []
    
    return (
      <div className={className}>
        {/* Service Selector */}
        <div className="mb-4">
          <select
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a service...</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.icon} {service.name}
              </option>
            ))}
          </select>
        </div>

        {service && renderServiceQueue(service, queue)}
      </div>
    )
  }

  // All services view
  return (
    <div className={className}>
      {/* Overall Stats */}
      {showStats && stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Queue Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalInQueue}</div>
              <div className="text-sm text-gray-600">Total Waiting</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.currentlyServing}</div>
              <div className="text-sm text-gray-600">Being Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(stats.averageWaitTime)}m
              </div>
              <div className="text-sm text-gray-600">Avg Wait</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.servicesCompleted}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      )}

      {/* Service Queues */}
      <div className="space-y-6">
        {services.map((service) => {
          const queue = allQueues.get(service.id) || []
          return renderServiceQueue(service, queue)
        })}
      </div>

      {services.length === 0 && (
        <div className="text-center p-8">
          <div className="text-4xl mb-4">🏪</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Services Available</h3>
          <p className="text-gray-600">Services will appear here when they become available.</p>
        </div>
      )}
    </div>
  )
} 