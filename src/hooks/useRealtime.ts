import { useEffect, useState, useCallback } from 'react'
import {
  realtimeManager,
  GameLobby,
  ServiceQueue,
  CheckInEvent,
  GameLobbyCallback,
  ServiceQueueCallback,
  CheckInCallback
} from '../utils/realtimeManager'

// Hook for real-time connection status
export const useRealtimeConnection = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const connect = useCallback(async () => {
    setIsConnecting(true)
    try {
      const connected = await realtimeManager.connect()
      setIsConnected(connected)
    } catch (error) {
      console.error('Failed to connect to realtime:', error)
      setIsConnected(false)
    } finally {
      setIsConnecting(false)
    }
  }, [])

  const disconnect = useCallback(() => {
    realtimeManager.disconnectAll()
    setIsConnected(false)
  }, [])

  const getStatus = useCallback(() => ({
    isConnected: realtimeManager.getConnectionStatus(),
    activeChannels: realtimeManager.getActiveChannelsCount(),
    channelNames: realtimeManager.getActiveChannels()
  }), [])

  return {
    isConnected,
    isConnecting,
    connect,
    disconnect,
    getStatus
  }
}

// Hook for game lobby real-time updates
export const useRealtimeGameLobbies = () => {
  const [lobbies, setLobbies] = useState<GameLobby[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const handleLobbyUpdate: GameLobbyCallback = (lobby) => {
      setLobbies(prev => {
        // Update existing lobby or add new one
        const existingIndex = prev.findIndex(l => l.id === lobby.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = lobby
          return updated
        } else {
          return [...prev, lobby]
        }
      })
      setLastUpdate(new Date())
    }

    const unsubscribe = realtimeManager.subscribeToGameLobbies(handleLobbyUpdate)

    return () => {
      unsubscribe()
    }
  }, [])

  // Simulate demo data for testing
  const simulateLobbyUpdate = useCallback((lobby: Partial<GameLobby>) => {
    const demoLobby: GameLobby = {
      id: lobby.id || `demo-${Date.now()}`,
      name: lobby.name || 'Demo Game',
      status: lobby.status || 'waiting',
      players: lobby.players || Math.floor(Math.random() * 4) + 1,
      maxPlayers: lobby.maxPlayers || 4,
      createdAt: lobby.createdAt || new Date().toISOString()
    }

    setLobbies(prev => {
      const existingIndex = prev.findIndex(l => l.id === demoLobby.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = demoLobby
        return updated
      } else {
        return [...prev, demoLobby]
      }
    })
    setLastUpdate(new Date())
  }, [])

  return {
    lobbies,
    lastUpdate,
    simulateLobbyUpdate
  }
}

// Hook for service queue real-time updates
export const useRealtimeServiceQueue = () => {
  const [queueItems, setQueueItems] = useState<ServiceQueue[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const handleQueueUpdate: ServiceQueueCallback = (queueItem) => {
      setQueueItems(prev => {
        const existingIndex = prev.findIndex(q => q.id === queueItem.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = queueItem
          return updated
        } else {
          return [...prev, queueItem]
        }
      })
      setLastUpdate(new Date())
    }

    const unsubscribe = realtimeManager.subscribeToServiceQueue(handleQueueUpdate)

    return () => {
      unsubscribe()
    }
  }, [])

  // Simulate demo data for testing
  const simulateQueueUpdate = useCallback((queue: Partial<ServiceQueue>) => {
    const demoQueue: ServiceQueue = {
      id: queue.id || `queue-${Date.now()}`,
      serviceName: queue.serviceName || 'Demo Service',
      currentPosition: queue.currentPosition || Math.floor(Math.random() * 10) + 1,
      totalInQueue: queue.totalInQueue || Math.floor(Math.random() * 20) + 5,
      estimatedWait: queue.estimatedWait || Math.floor(Math.random() * 30) + 5,
      status: queue.status || 'waiting'
    }

    setQueueItems(prev => {
      const existingIndex = prev.findIndex(q => q.id === demoQueue.id)
      if (existingIndex >= 0) {
        const updated = [...prev]
        updated[existingIndex] = demoQueue
        return updated
      } else {
        return [...prev, demoQueue]
      }
    })
    setLastUpdate(new Date())
  }, [])

  return {
    queueItems,
    lastUpdate,
    simulateQueueUpdate
  }
}

// Hook for check-in real-time updates
export const useRealtimeCheckIns = () => {
  const [checkIns, setCheckIns] = useState<CheckInEvent[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const handleCheckInUpdate: CheckInCallback = (checkIn) => {
      setCheckIns(prev => {
        const existingIndex = prev.findIndex(c => c.id === checkIn.id)
        if (existingIndex >= 0) {
          const updated = [...prev]
          updated[existingIndex] = checkIn
          return updated
        } else {
          return [checkIn, ...prev] // Add new check-ins to the top
        }
      })
      setLastUpdate(new Date())
    }

    const unsubscribe = realtimeManager.subscribeToCheckIns(handleCheckInUpdate)

    return () => {
      unsubscribe()
    }
  }, [])

  // Simulate demo data for testing
  const simulateCheckIn = useCallback((checkIn: Partial<CheckInEvent>) => {
    const demoCheckIn: CheckInEvent = {
      id: checkIn.id || `checkin-${Date.now()}`,
      guestName: checkIn.guestName || `Guest ${Math.floor(Math.random() * 100)}`,
      eventId: checkIn.eventId || 'demo-event',
      checkedInAt: checkIn.checkedInAt || new Date().toISOString(),
      status: checkIn.status || 'checked-in'
    }

    setCheckIns(prev => [demoCheckIn, ...prev])
    setLastUpdate(new Date())
  }, [])

  return {
    checkIns,
    lastUpdate,
    simulateCheckIn
  }
}

// Hook for custom demo events
export const useRealtimeDemoEvents = (eventType: 'game' | 'service' | 'checkin') => {
  const [events, setEvents] = useState<any[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const handleDemoEvent = (data: any) => {
      setEvents(prev => [{
        ...data,
        timestamp: new Date().toISOString(),
        id: `${eventType}-${Date.now()}`
      }, ...prev.slice(0, 9)]) // Keep only last 10 events
      setLastUpdate(new Date())
    }

    const unsubscribe = realtimeManager.subscribeToDemoEvents(eventType, handleDemoEvent)

    return () => {
      unsubscribe()
    }
  }, [eventType])

  const broadcastEvent = useCallback(async (data: any) => {
    await realtimeManager.broadcastDemoEvent(eventType, data)
  }, [eventType])

  return {
    events,
    lastUpdate,
    broadcastEvent
  }
} 