import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'

// Define types for our dashboard metrics
interface DashboardMetrics {
  activeSessionsCount: number
  totalGames: number
  availableGames: number
  queueLength: number
  checkInsToday: number
  averageSessionDuration: number
  peakHours: string
}

interface SystemStatus {
  database: 'connected' | 'disconnected' | 'error' | 'demo'
  realtime: 'connected' | 'disconnected' | 'error' | 'demo'
  services: 'healthy' | 'degraded' | 'error' | 'demo'
}

interface UseDashboardMetricsReturn {
  stats: DashboardMetrics
  systemStatus: SystemStatus
  isLoading: boolean
  error: string | null
  refreshMetrics: () => void
}

// Mock data for demo mode
const mockMetrics: DashboardMetrics = {
  activeSessionsCount: 8,
  totalGames: 12,
  availableGames: 4,
  queueLength: 3,
  checkInsToday: 47,
  averageSessionDuration: 28,
  peakHours: '7-9 PM'
}

export function useDashboardMetrics(): UseDashboardMetricsReturn {
  const [stats, setStats] = useState<DashboardMetrics>(mockMetrics)
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'demo',
    realtime: 'demo',
    services: 'demo'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

  // Initialize Supabase client if configured
  const supabase = isSupabaseConfigured 
    ? createClient(supabaseUrl!, supabaseAnonKey!)
    : null

  // Fetch real-time metrics from Supabase
  const fetchMetrics = useCallback(async () => {
    if (!supabase) {
      // Use demo mode with simulated data
      setStats(prev => ({
        ...prev,
        activeSessionsCount: Math.min(prev.totalGames, prev.activeSessionsCount + Math.floor(Math.random() * 3) - 1),
        queueLength: Math.max(0, prev.queueLength + Math.floor(Math.random() * 3) - 1),
        checkInsToday: prev.checkInsToday + (Math.random() > 0.8 ? 1 : 0)
      }))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Test database connection
      const { error: connectionError } = await supabase
        .from('games')
        .select('count', { count: 'exact', head: true })

      if (connectionError) {
        throw new Error('Database connection failed')
      }

      // Fetch active games
      const { data: activeGames, error: gamesError } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('status', 'active')

      if (gamesError) throw gamesError

      // Fetch total games
      const { count: totalGamesCount, error: totalGamesError } = await supabase
        .from('games')
        .select('*', { count: 'exact', head: true })

      if (totalGamesError) throw totalGamesError

      // Fetch queue length
      const { count: queueCount, error: queueError } = await supabase
        .from('service_queue')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting')

      if (queueError) throw queueError

      // Fetch today's check-ins
      const today = new Date().toISOString().split('T')[0]
      const { count: checkInsCount, error: checkInsError } = await supabase
        .from('guest_checkins')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', `${today}T00:00:00`)

      if (checkInsError) throw checkInsError

      // Calculate average session duration
      const { data: completedSessions, error: sessionsError } = await supabase
        .from('game_sessions')
        .select('started_at, ended_at')
        .not('ended_at', 'is', null)
        .gte('started_at', `${today}T00:00:00`)

      if (sessionsError) throw sessionsError

      const averageSessionDuration = completedSessions?.length > 0
        ? completedSessions.reduce((sum, session) => {
            const duration = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()
            return sum + duration / (1000 * 60) // Convert to minutes
          }, 0) / completedSessions.length
        : 0

      // Update metrics with real data
      setStats({
        activeSessionsCount: activeGames?.length || 0,
        totalGames: totalGamesCount || 12,
        availableGames: (totalGamesCount || 12) - (activeGames?.length || 0),
        queueLength: queueCount || 0,
        checkInsToday: checkInsCount || 0,
        averageSessionDuration: Math.round(averageSessionDuration),
        peakHours: '7-9 PM' // This could be calculated from historical data
      })

      // Update system status
      setSystemStatus({
        database: 'connected',
        realtime: 'connected',
        services: 'healthy'
      })

    } catch (err) {
      console.error('Error fetching dashboard metrics:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics')
      
      // Set system status to error
      setSystemStatus({
        database: 'error',
        realtime: 'error',
        services: 'error'
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // Manual refresh function
  const refreshMetrics = useCallback(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!supabase) return

    // Subscribe to game sessions changes
    const gameSessionsSubscription = supabase
      .channel('game_sessions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'game_sessions' },
        () => {
          fetchMetrics() // Refresh metrics when game sessions change
        }
      )
      .subscribe()

    // Subscribe to check-ins changes
    const checkInsSubscription = supabase
      .channel('checkins_changes')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guest_checkins' },
        () => {
          fetchMetrics() // Refresh metrics when new check-ins occur
        }
      )
      .subscribe()

    // Subscribe to queue changes
    const queueSubscription = supabase
      .channel('queue_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'service_queue' },
        () => {
          fetchMetrics() // Refresh metrics when queue changes
        }
      )
      .subscribe()

    return () => {
      gameSessionsSubscription.unsubscribe()
      checkInsSubscription.unsubscribe()
      queueSubscription.unsubscribe()
    }
  }, [supabase, fetchMetrics])

  // Initial data fetch and periodic updates
  useEffect(() => {
    fetchMetrics()

    // Set up periodic refresh (every 30 seconds)
    const interval = setInterval(() => {
      fetchMetrics()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchMetrics])

  // Simulate real-time updates in demo mode
  useEffect(() => {
    if (isSupabaseConfigured) return

    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        activeSessionsCount: Math.min(prev.totalGames, prev.activeSessionsCount + Math.floor(Math.random() * 3) - 1),
        queueLength: Math.max(0, prev.queueLength + Math.floor(Math.random() * 3) - 1),
        checkInsToday: prev.checkInsToday + (Math.random() > 0.8 ? 1 : 0)
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [isSupabaseConfigured])

  return {
    stats,
    systemStatus,
    isLoading,
    error,
    refreshMetrics
  }
} 