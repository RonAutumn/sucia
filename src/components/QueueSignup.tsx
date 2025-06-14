import React, { useState, useEffect } from 'react'
import { useQueue } from '../hooks/useQueue'
import { useCurrentGuestUser } from '../hooks/useGuestUser'
import { ServiceType, QueuePreferences, QueuePriority } from '../types/queue'

interface QueueSignupProps {
  className?: string
  onJoined?: (serviceId: string) => void
  onError?: (error: string) => void
  preselectedService?: string
  showPreferences?: boolean
  allowPriority?: boolean
}

export function QueueSignup({
  className = "",
  onJoined,
  onError,
  preselectedService,
  showPreferences = true,
  allowPriority = true
}: QueueSignupProps) {
  const currentUser = useCurrentGuestUser()
  const { services, joinQueue, isInQueue, userQueueEntry, isLoading } = useQueue()
  
  const [selectedService, setSelectedService] = useState(preselectedService || '')
  const [priority, setPriority] = useState<QueuePriority>('normal')
  const [preferences, setPreferences] = useState<QueuePreferences>({
    preferredTime: '',
    specialRequests: '',
    groupSize: 1,
    accessibility: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (preselectedService && services.length > 0) {
      const service = services.find(s => s.id === preselectedService)
      if (service) {
        setSelectedService(preselectedService)
      }
    }
  }, [preselectedService, services])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) {
      setError('Please enter a nickname first')
      onError?.('Please enter a nickname first')
      return
    }

    if (!selectedService) {
      setError('Please select a service')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const result = await joinQueue({
        serviceId: selectedService,
        preferences: showPreferences ? preferences : undefined,
        priority: allowPriority ? priority : 'normal'
      })

      if (result.success) {
        onJoined?.(selectedService)
        // Reset form
        setSelectedService(preselectedService || '')
        setPriority('normal')
        setPreferences({
          preferredTime: '',
          specialRequests: '',
          groupSize: 1,
          accessibility: []
        })
      } else {
        setError(result.error || 'Failed to join queue')
        onError?.(result.error || 'Failed to join queue')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join queue'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedServiceData = services.find(s => s.id === selectedService)

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading services...</span>
      </div>
    )
  }

  if (!currentUser) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="text-yellow-600 text-xl mr-3">⚠️</div>
          <div>
            <h3 className="text-lg font-medium text-yellow-800">Nickname Required</h3>
            <p className="text-yellow-700 mt-1">Please enter a nickname before joining a queue.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isInQueue && userQueueEntry) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="text-green-600 text-xl mr-3">✅</div>
          <div>
            <h3 className="text-lg font-medium text-green-800">Already in Queue</h3>
            <p className="text-green-700 mt-1">
              You're in the queue for <strong>{userQueueEntry.serviceName}</strong> at position {userQueueEntry.position}.
            </p>
            <p className="text-green-600 text-sm mt-1">
              Estimated wait time: {userQueueEntry.estimatedWaitTime} minutes
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Join Service Queue</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Service Selection */}
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-2">
              Select Service *
            </label>
            <select
              id="service"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Choose a service...</option>
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.icon} {service.name} - {service.estimatedDuration}min
                </option>
              ))}
            </select>
          </div>

          {/* Service Info */}
          {selectedServiceData && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{selectedServiceData.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{selectedServiceData.name}</h3>
                  <p className="text-sm text-gray-600">{selectedServiceData.description}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Duration:</span>
                  <span className="ml-2 font-medium">{selectedServiceData.estimatedDuration} minutes</span>
                </div>
                <div>
                  <span className="text-gray-500">Capacity:</span>
                  <span className="ml-2 font-medium">{selectedServiceData.maxCapacity} concurrent</span>
                </div>
              </div>
            </div>
          )}

          {/* Priority Selection */}
          {allowPriority && (
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority Level
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as QueuePriority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low Priority</option>
                <option value="normal">Normal Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Higher priority may result in earlier service
              </p>
            </div>
          )}

          {/* Preferences */}
          {showPreferences && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700">Preferences (Optional)</h3>
              
              {/* Preferred Time */}
              <div>
                <label htmlFor="preferredTime" className="block text-xs font-medium text-gray-600 mb-1">
                  Preferred Time
                </label>
                <input
                  type="text"
                  id="preferredTime"
                  value={preferences.preferredTime}
                  onChange={(e) => setPreferences(prev => ({ ...prev, preferredTime: e.target.value }))}
                  placeholder="e.g., ASAP, after 3pm, before lunch"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Group Size */}
              <div>
                <label htmlFor="groupSize" className="block text-xs font-medium text-gray-600 mb-1">
                  Group Size
                </label>
                <input
                  type="number"
                  id="groupSize"
                  min="1"
                  max="10"
                  value={preferences.groupSize}
                  onChange={(e) => setPreferences(prev => ({ ...prev, groupSize: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Special Requests */}
              <div>
                <label htmlFor="specialRequests" className="block text-xs font-medium text-gray-600 mb-1">
                  Special Requests
                </label>
                <textarea
                  id="specialRequests"
                  value={preferences.specialRequests}
                  onChange={(e) => setPreferences(prev => ({ ...prev, specialRequests: e.target.value }))}
                  placeholder="Any special requirements or requests..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <div className="flex items-center">
                <div className="text-red-500 text-sm mr-2">❌</div>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !selectedService}
            className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
              isSubmitting || !selectedService
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Joining Queue...
              </div>
            ) : (
              'Join Queue'
            )}
          </button>
        </form>

        {/* Current User Info */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Joining as: <span className="font-medium" style={{ color: currentUser.color }}>{currentUser.nickname}</span>
          </p>
        </div>
      </div>
    </div>
  )
} 