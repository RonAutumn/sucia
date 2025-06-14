import { useState, useEffect, useCallback, useRef } from 'react'
import { getQueueManager, QueueManagerClass } from '../utils/queueManager'
import { 
  QueueEntry, 
  ServiceType, 
  QueueStatus, 
  QueuePreferences, 
  QueuePriority,
  QueueStats,
  QueueSignupData
} from '../types/queue'
import { useCurrentGuestUser } from './useGuestUser'

export interface UseQueueState {
  services: ServiceType[]
  allQueues: Map<string, QueueEntry[]>
  userQueueEntry: QueueEntry | null
  isInQueue: boolean
  isLoading: boolean
  stats: QueueStats | null
}

export interface UseQueueOptions {
  autoUpdate?: boolean
  updateInterval?: number
  serviceId?: string // For service-specific hooks
}

// Main queue hook
export function useQueue(options: UseQueueOptions = {}) {
  const { autoUpdate = true, updateInterval = 5000, serviceId } = options
  const currentUser = useCurrentGuestUser()
  
  const [state, setState] = useState<UseQueueState>({
    services: [],
    allQueues: new Map(),
    userQueueEntry: null,
    isInQueue: false,
    isLoading: true,
    stats: null
  })

  const managerRef = useRef<QueueManagerClass | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize queue manager
  useEffect(() => {
    managerRef.current = getQueueManager()
    updateState()
    
    // Set up event listeners
    const unsubscribers = [
      managerRef.current.onQueueUpdated((updatedServiceId, queue) => {
        console.log('Queue updated:', updatedServiceId, queue.length)
        updateState()
      }),
      managerRef.current.onPositionChanged((entryId, newPosition) => {
        console.log('Position changed:', entryId, newPosition)
        updateState()
      }),
      managerRef.current.onStatusChanged((entryId, newStatus) => {
        console.log('Status changed:', entryId, newStatus)
        updateState()
      })
    ]

    // Start periodic updates if enabled
    if (autoUpdate) {
      updateIntervalRef.current = setInterval(updateState, updateInterval)
    }

    return () => {
      // Cleanup
      unsubscribers.forEach(unsubscribe => unsubscribe())
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [autoUpdate, updateInterval])

  // Update state from manager
  const updateState = useCallback(async () => {
    if (!managerRef.current) return

    try {
      const manager = managerRef.current
      const [services, allQueues, userEntry, stats] = await Promise.all([
        manager.getServiceTypes(),
        manager.getAllQueues(),
        currentUser ? manager.getUserQueueEntry(currentUser.id) : Promise.resolve(null),
        serviceId ? manager.getQueueStats(serviceId) : manager.getQueueStats()
      ])

      setState({
        services,
        allQueues,
        userQueueEntry: userEntry,
        isInQueue: !!userEntry,
        isLoading: false,
        stats
      })
    } catch (error) {
      console.error('Failed to update queue state:', error)
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [currentUser, serviceId])

  // Join queue
  const joinQueue = useCallback(async (signupData: QueueSignupData): Promise<{ success: boolean; error?: string; entry?: QueueEntry }> => {
    if (!managerRef.current || !currentUser) {
      return { success: false, error: 'Not authenticated or queue manager not available' }
    }

    try {
      const entry = await managerRef.current.joinQueue(
        currentUser.id,
        signupData.serviceId,
        signupData.preferences,
        signupData.priority
      )
      
      updateState()
      return { success: true, entry }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join queue'
      return { success: false, error: errorMessage }
    }
  }, [currentUser, updateState])

  // Leave queue
  const leaveQueue = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!managerRef.current || !state.userQueueEntry) {
      return { success: false, error: 'Not in queue or queue manager not available' }
    }

    try {
      const success = await managerRef.current.leaveQueue(state.userQueueEntry.id)
      if (success) {
        updateState()
        return { success: true }
      } else {
        return { success: false, error: 'Failed to leave queue' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to leave queue'
      return { success: false, error: errorMessage }
    }
  }, [state.userQueueEntry, updateState])

  // Get queue for specific service
  const getServiceQueue = useCallback(async (serviceId: string): Promise<QueueEntry[]> => {
    if (!managerRef.current) return []
    return managerRef.current.getQueueForService(serviceId)
  }, [])

  // Get user's position and wait time
  const getUserPosition = useCallback(async (): Promise<{ position: number | null; waitTime: number | null }> => {
    if (!managerRef.current || !state.userQueueEntry) {
      return { position: null, waitTime: null }
    }

    try {
      const [position, waitTime] = await Promise.all([
        managerRef.current.getQueuePosition(state.userQueueEntry.id),
        managerRef.current.getEstimatedWaitTime(state.userQueueEntry.id)
      ])
      
      return { position, waitTime }
    } catch (error) {
      console.error('Failed to get user position:', error)
      return { position: null, waitTime: null }
    }
  }, [state.userQueueEntry])

  // Force refresh
  const refresh = useCallback(() => {
    updateState()
  }, [updateState])

  return {
    // State
    ...state,
    
    // Actions
    joinQueue,
    leaveQueue,
    getServiceQueue,
    getUserPosition,
    refresh,
    
    // Utils
    manager: managerRef.current
  }
}

// Hook for service-specific queue
export function useServiceQueue(serviceId: string) {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [service, setService] = useState<ServiceType | null>(null)
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const manager = getQueueManager()
    
    const updateServiceQueue = async () => {
      try {
        const [serviceQueue, services, serviceStats] = await Promise.all([
          manager.getQueueForService(serviceId),
          manager.getServiceTypes(),
          manager.getQueueStats(serviceId)
        ])
        
        setQueue(serviceQueue)
        setService(services.find(s => s.id === serviceId) || null)
        setStats(serviceStats)
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to update service queue:', error)
        setIsLoading(false)
      }
    }

    updateServiceQueue()

    const unsubscribe = manager.onQueueUpdated((updatedServiceId, updatedQueue) => {
      if (updatedServiceId === serviceId) {
        setQueue([...updatedQueue])
      }
    })

    // Update every 30 seconds
    const interval = setInterval(updateServiceQueue, 30000)

    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [serviceId])

  return { queue, service, stats, isLoading }
}

// Hook for staff queue management
export function useStaffQueue(serviceId?: string) {
  const { allQueues, services, refresh } = useQueue({ serviceId })
  const managerRef = useRef<QueueManagerClass | null>(null)

  useEffect(() => {
    managerRef.current = getQueueManager()
  }, [])

  // Call next in queue
  const callNext = useCallback(async (targetServiceId: string): Promise<{ success: boolean; entry?: QueueEntry; error?: string }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Queue manager not available' }
    }

    try {
      const entry = await managerRef.current.callNextInQueue(targetServiceId)
      if (entry) {
        refresh()
        return { success: true, entry }
      } else {
        return { success: false, error: 'No one in queue' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to call next'
      return { success: false, error: errorMessage }
    }
  }, [refresh])

  // Mark service started
  const markStarted = useCallback(async (entryId: string): Promise<{ success: boolean; error?: string }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Queue manager not available' }
    }

    try {
      const success = await managerRef.current.markServiceStarted(entryId)
      if (success) {
        refresh()
        return { success: true }
      } else {
        return { success: false, error: 'Failed to mark service as started' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark service as started'
      return { success: false, error: errorMessage }
    }
  }, [refresh])

  // Mark service completed
  const markCompleted = useCallback(async (entryId: string): Promise<{ success: boolean; error?: string }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Queue manager not available' }
    }

    try {
      const success = await managerRef.current.markServiceCompleted(entryId)
      if (success) {
        refresh()
        return { success: true }
      } else {
        return { success: false, error: 'Failed to mark service as completed' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark service as completed'
      return { success: false, error: errorMessage }
    }
  }, [refresh])

  // Skip queue entry
  const skipEntry = useCallback(async (entryId: string, reason?: string): Promise<{ success: boolean; error?: string }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Queue manager not available' }
    }

    try {
      const success = await managerRef.current.skipQueueEntry(entryId, reason)
      if (success) {
        refresh()
        return { success: true }
      } else {
        return { success: false, error: 'Failed to skip entry' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to skip entry'
      return { success: false, error: errorMessage }
    }
  }, [refresh])

  // Adjust position
  const adjustPosition = useCallback(async (entryId: string, newPosition: number): Promise<{ success: boolean; error?: string }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Queue manager not available' }
    }

    try {
      const success = await managerRef.current.adjustQueuePosition(entryId, newPosition)
      if (success) {
        refresh()
        return { success: true }
      } else {
        return { success: false, error: 'Failed to adjust position' }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to adjust position'
      return { success: false, error: errorMessage }
    }
  }, [refresh])

  return {
    allQueues,
    services,
    callNext,
    markStarted,
    markCompleted,
    skipEntry,
    adjustPosition,
    refresh
  }
}

// Hook for user's current queue status
export function useUserQueueStatus() {
  const [queueEntry, setQueueEntry] = useState<QueueEntry | null>(null)
  const [position, setPosition] = useState<number | null>(null)
  const [waitTime, setWaitTime] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const currentUser = useCurrentGuestUser()

  useEffect(() => {
    if (!currentUser) {
      setQueueEntry(null)
      setPosition(null)
      setWaitTime(null)
      setIsLoading(false)
      return
    }

    const manager = getQueueManager()
    
    const updateStatus = async () => {
      try {
        const entry = await manager.getUserQueueEntry(currentUser.id)
        setQueueEntry(entry)
        
        if (entry) {
          const [pos, wait] = await Promise.all([
            manager.getQueuePosition(entry.id),
            manager.getEstimatedWaitTime(entry.id)
          ])
          setPosition(pos)
          setWaitTime(wait)
        } else {
          setPosition(null)
          setWaitTime(null)
        }
        
        setIsLoading(false)
      } catch (error) {
        console.error('Failed to update queue status:', error)
        setIsLoading(false)
      }
    }

    updateStatus()

    const unsubscribers = [
      manager.onPositionChanged((entryId, newPosition) => {
        if (queueEntry && entryId === queueEntry.id) {
          setPosition(newPosition)
        }
      }),
      manager.onStatusChanged((entryId, newStatus) => {
        if (queueEntry && entryId === queueEntry.id) {
          updateStatus()
        }
      })
    ]

    // Update every 30 seconds
    const interval = setInterval(updateStatus, 30000)

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe())
      clearInterval(interval)
    }
  }, [currentUser, queueEntry?.id])

  return {
    queueEntry,
    position,
    waitTime,
    isLoading,
    isInQueue: !!queueEntry
  }
} 