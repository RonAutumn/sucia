import { supabase } from './supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Types for demo features
export interface GameLobby {
  id: string
  name: string
  status: 'waiting' | 'active' | 'finished'
  players: number
  maxPlayers: number
  createdAt: string
}

export interface ServiceQueue {
  id: string
  serviceName: string
  currentPosition: number
  totalInQueue: number
  estimatedWait: number
  status: 'waiting' | 'called' | 'served'
}

export interface CheckInEvent {
  id: string
  guestName: string
  eventId: string
  checkedInAt: string
  status: 'checked-in' | 'checked-out'
}

// Callback types for real-time updates
export type GameLobbyCallback = (lobby: GameLobby) => void
export type ServiceQueueCallback = (queue: ServiceQueue) => void
export type CheckInCallback = (checkIn: CheckInEvent) => void

class RealtimeManager {
  private channels: Map<string, RealtimeChannel> = new Map()
  private isConnected = false

  /**
   * Initialize connection to Supabase Realtime
   */
  async connect(): Promise<boolean> {
    try {
      // Create a general status channel to test connectivity
      const statusChannel = supabase.channel('demo_status')
      
      statusChannel
        .on('presence', { event: 'sync' }, () => {
          this.isConnected = true
        })
        .subscribe()

      this.channels.set('status', statusChannel)
      this.isConnected = true
      return true
    } catch (error) {
      console.error('Failed to connect to Supabase Realtime:', error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Subscribe to game lobby updates
   */
  subscribeToGameLobbies(callback: GameLobbyCallback): () => void {
    const channelName = 'game_lobbies'
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_lobbies'
        },
        (payload: any) => {
          // Handle different types of changes
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const lobby = payload.new as GameLobby
            callback(lobby)
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelName)
  }

  /**
   * Subscribe to service queue updates
   */
  subscribeToServiceQueue(callback: ServiceQueueCallback): () => void {
    const channelName = 'service_queue'
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_queue'
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const queueItem = payload.new as ServiceQueue
            callback(queueItem)
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelName)
  }

  /**
   * Subscribe to check-in events
   */
  subscribeToCheckIns(callback: CheckInCallback): () => void {
    const channelName = 'check_ins'
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'check_ins'
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const checkIn = payload.new as CheckInEvent
            callback(checkIn)
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelName)
  }

  /**
   * Subscribe to custom demo events (for showcasing real-time features)
   */
  subscribeToDemoEvents(
    eventType: 'game' | 'service' | 'checkin',
    callback: (data: any) => void
  ): () => void {
    const channelName = `demo_${eventType}_events`
    
    // Remove existing channel if it exists
    this.unsubscribe(channelName)

    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: `demo_${eventType}` }, (payload: any) => {
        callback(payload.payload)
      })
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => this.unsubscribe(channelName)
  }

  /**
   * Broadcast a demo event (for testing real-time features)
   */
  async broadcastDemoEvent(
    eventType: 'game' | 'service' | 'checkin',
    data: any
  ): Promise<void> {
    const channelName = `demo_${eventType}_events`
    const channel = this.channels.get(channelName)
    
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event: `demo_${eventType}`,
        payload: data
      })
    }
  }

  /**
   * Unsubscribe from a specific channel
   */
  unsubscribe(channelName: string): void {
    const channel = this.channels.get(channelName)
    if (channel) {
      supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  /**
   * Disconnect all channels
   */
  disconnectAll(): void {
    this.channels.forEach((channel, name) => {
      supabase.removeChannel(channel)
    })
    this.channels.clear()
    this.isConnected = false
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected
  }

  /**
   * Get active channels count
   */
  getActiveChannelsCount(): number {
    return this.channels.size
  }

  /**
   * Get list of active channel names
   */
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys())
  }
}

// Create and export a singleton instance
export const realtimeManager = new RealtimeManager()

// Export utility functions for React hooks
export const useGameLobbies = (callback: GameLobbyCallback) => {
  return realtimeManager.subscribeToGameLobbies(callback)
}

export const useServiceQueue = (callback: ServiceQueueCallback) => {
  return realtimeManager.subscribeToServiceQueue(callback)
}

export const useCheckIns = (callback: CheckInCallback) => {
  return realtimeManager.subscribeToCheckIns(callback)
} 