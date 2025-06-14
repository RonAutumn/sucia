import React, { useState } from 'react'
import { useStaffQueue } from '../hooks/useQueue'
import { QueueEntry, ServiceType, QueueStatus } from '../types/queue'

interface StaffQueueManagerProps {
  className?: string
  serviceId?: string
  showAllServices?: boolean
}

export function StaffQueueManager({
  className = "",
  serviceId,
  showAllServices = true
}: StaffQueueManagerProps) {
  const { allQueues, services, callNext, markStarted, markCompleted, skipEntry, adjustPosition, refresh } = useStaffQueue(serviceId)
  const [selectedServiceId, setSelectedServiceId] = useState(serviceId || '')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [skipReason, setSkipReason] = useState('')
  const [showSkipModal, setShowSkipModal] = useState<string | null>(null)
  const [adjustPositionModal, setAdjustPositionModal] = useState<{ entryId: string; currentPosition: number } | null>(null)
  const [newPosition, setNewPosition] = useState(1)

  const handleAction = async (action: () => Promise<any>, actionId: string) => {
    setActionLoading(actionId)
    try {
      await action()
      refresh()
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleCallNext = (targetServiceId: string) => {
    handleAction(() => callNext(targetServiceId), `call-${targetServiceId}`)
  }

  const handleMarkStarted = (entryId: string) => {
    handleAction(() => markStarted(entryId), `start-${entryId}`)
  }

  const handleMarkCompleted = (entryId: string) => {
    handleAction(() => markCompleted(entryId), `complete-${entryId}`)
  }

  const handleSkipEntry = async (entryId: string) => {
    await handleAction(() => skipEntry(entryId, skipReason), `skip-${entryId}`)
    setShowSkipModal(null)
    setSkipReason('')
  }

  const handleAdjustPosition = async () => {
    if (!adjustPositionModal) return
    
    await handleAction(
      () => adjustPosition(adjustPositionModal.entryId, newPosition),
      `adjust-${adjustPositionModal.entryId}`
    )
    setAdjustPositionModal(null)
    setNewPosition(1)
  }

  const getStatusColor = (status: QueueStatus): string => {
    switch (status) {
      case 'waiting': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'called': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'in-service': return 'text-green-600 bg-green-50 border-green-200'
      case 'completed': return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'cancelled': return 'text-red-600 bg-red-50 border-red-200'
      case 'skipped': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
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

  const renderQueueEntry = (entry: QueueEntry, service: ServiceType) => {
    const statusColor = getStatusColor(entry.status)
    const statusIcon = getStatusIcon(entry.status)
    const isLoading = actionLoading?.includes(entry.id)

    return (
      <div key={entry.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Entry Info */}
          <div className="flex items-center space-x-4 flex-1">
            {/* Position */}
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full text-lg font-bold text-gray-700">
              {entry.position}
            </div>

            {/* User Details */}
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">{entry.userNickname}</h3>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColor}`}>
                  <span className="mr-1">{statusIcon}</span>
                  {entry.status}
                </div>
              </div>
              
              <div className="text-sm text-gray-600 space-y-1">
                <div>Service: <span className="font-medium">{service.name}</span></div>
                <div>Wait time: <span className="font-medium">{entry.estimatedWaitTime} minutes</span></div>
                <div>Joined: <span className="font-medium">{new Date(entry.joinedAt).toLocaleTimeString()}</span></div>
                
                {entry.preferences?.groupSize && entry.preferences.groupSize > 1 && (
                  <div>Group size: <span className="font-medium">{entry.preferences.groupSize}</span></div>
                )}
                
                {entry.preferences?.preferredTime && (
                  <div>Preferred time: <span className="font-medium">{entry.preferences.preferredTime}</span></div>
                )}
                
                {entry.preferences?.specialRequests && (
                  <div>Special requests: <span className="font-medium">{entry.preferences.specialRequests}</span></div>
                )}
                
                {entry.notes && (
                  <div>Notes: <span className="font-medium text-yellow-700">{entry.notes}</span></div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2 ml-4">
            {entry.status === 'waiting' && (
              <>
                <button
                  onClick={() => handleCallNext(service.id)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === `call-${service.id}` ? 'Calling...' : 'Call Next'}
                </button>
                
                <button
                  onClick={() => {
                    setShowSkipModal(entry.id)
                    setSkipReason('')
                  }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                >
                  Skip
                </button>
                
                <button
                  onClick={() => {
                    setAdjustPositionModal({ entryId: entry.id, currentPosition: entry.position })
                    setNewPosition(entry.position)
                  }}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  Move
                </button>
              </>
            )}

            {entry.status === 'called' && (
              <button
                onClick={() => handleMarkStarted(entry.id)}
                disabled={isLoading}
                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading === `start-${entry.id}` ? 'Starting...' : 'Start Service'}
              </button>
            )}

            {entry.status === 'in-service' && (
              <button
                onClick={() => handleMarkCompleted(entry.id)}
                disabled={isLoading}
                className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {actionLoading === `complete-${entry.id}` ? 'Completing...' : 'Complete'}
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderServiceQueue = (service: ServiceType, queue: QueueEntry[]) => {
    const activeQueue = queue.filter(entry => ['waiting', 'called', 'in-service'].includes(entry.status))
    const waitingCount = queue.filter(entry => entry.status === 'waiting').length
    const inServiceCount = queue.filter(entry => entry.status === 'in-service').length
    const nextEntry = queue.find(entry => entry.status === 'waiting')

    return (
      <div key={service.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        {/* Service Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{service.icon}</span>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
              <p className="text-gray-600">{service.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-600 space-y-1">
              <div>{waitingCount} waiting • {inServiceCount}/{service.maxCapacity} in service</div>
              <div>~{service.estimatedDuration}min per service</div>
            </div>
            
            {nextEntry && (
              <button
                onClick={() => handleCallNext(service.id)}
                disabled={actionLoading === `call-${service.id}`}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === `call-${service.id}` ? 'Calling...' : `Call ${nextEntry.userNickname}`}
              </button>
            )}
          </div>
        </div>

        {/* Queue Entries */}
        <div className="space-y-3">
          {activeQueue.length > 0 ? (
            activeQueue.map(entry => renderQueueEntry(entry, service))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🎉</div>
              <p>No active queue entries</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Staff Queue Management</h1>
        <p className="text-gray-600">Manage service queues and customer flow</p>
      </div>

      {/* Service Selector (if not showing all services) */}
      {!showAllServices && (
        <div className="mb-6">
          <label htmlFor="service-select" className="block text-sm font-medium text-gray-700 mb-2">
            Select Service
          </label>
          <select
            id="service-select"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Services</option>
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.icon} {service.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Queue Management */}
      <div className="space-y-6">
        {showAllServices || !selectedServiceId ? (
          // Show all services
          services.map((service) => {
            const queue = allQueues.get(service.id) || []
            return renderServiceQueue(service, queue)
          })
        ) : (
          // Show selected service
          (() => {
            const service = services.find(s => s.id === selectedServiceId)
            const queue = allQueues.get(selectedServiceId) || []
            return service ? renderServiceQueue(service, queue) : null
          })()
        )}
      </div>

      {/* Skip Modal */}
      {showSkipModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Skip Queue Entry</h3>
            <div className="mb-4">
              <label htmlFor="skip-reason" className="block text-sm font-medium text-gray-700 mb-2">
                Reason (optional)
              </label>
              <textarea
                id="skip-reason"
                value={skipReason}
                onChange={(e) => setSkipReason(e.target.value)}
                placeholder="Why is this entry being skipped?"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleSkipEntry(showSkipModal)}
                disabled={actionLoading === `skip-${showSkipModal}`}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
              >
                {actionLoading === `skip-${showSkipModal}` ? 'Skipping...' : 'Skip Entry'}
              </button>
              <button
                onClick={() => {
                  setShowSkipModal(null)
                  setSkipReason('')
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Position Modal */}
      {adjustPositionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold mb-4">Adjust Queue Position</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Current position: {adjustPositionModal.currentPosition}
              </p>
              <label htmlFor="new-position" className="block text-sm font-medium text-gray-700 mb-2">
                New Position
              </label>
              <input
                type="number"
                id="new-position"
                min="1"
                value={newPosition}
                onChange={(e) => setNewPosition(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAdjustPosition}
                disabled={actionLoading === `adjust-${adjustPositionModal.entryId}`}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading === `adjust-${adjustPositionModal.entryId}` ? 'Moving...' : 'Move'}
              </button>
              <button
                onClick={() => {
                  setAdjustPositionModal(null)
                  setNewPosition(1)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 