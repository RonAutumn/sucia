import React, { useState, useEffect } from 'react'
import { 
  Gamepad2, 
  Users, 
  ClipboardList, 
  BarChart3, 
  TrendingUp,
  RefreshCw,
  Clock,
  Bell,
  Settings,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  Zap,
  Monitor,
  Server,
  Database,
  Calendar,
  MapPin,
  Star
} from 'lucide-react'
import toast from 'react-hot-toast'
import MetricCard from './dashboard/MetricCard'

// Types for real-time metrics
interface RealTimeMetrics {
  activeGames: number
  totalGames: number
  queueLength: number
  checkInsToday: number
  averageSessionTime: number
  peakHours: string
}

interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error' | 'success'
  timestamp: Date
  read: boolean
}

const ControlHubDashboard: React.FC = () => {
  // State management
  const [metrics, setMetrics] = useState<RealTimeMetrics>({
    activeGames: 8,
    totalGames: 12,
    queueLength: 3,
    checkInsToday: 47,
    averageSessionTime: 28,
    peakHours: '7-9 PM'
  })

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      title: 'System Update',
      message: 'Real-time metrics are now live',
      type: 'success',
      timestamp: new Date(),
      read: false
    },
    {
      id: '2', 
      title: 'Queue Alert',
      message: 'Service queue is getting long',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false
    }
  ])

  const [isOnline, setIsOnline] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)

  // Real-time data simulation (would connect to Supabase subscriptions in production)
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time metric updates
      setMetrics(prev => ({
        ...prev,
        activeGames: Math.min(prev.totalGames, prev.activeGames + Math.floor(Math.random() * 3) - 1),
        queueLength: Math.max(0, prev.queueLength + Math.floor(Math.random() * 3) - 1),
        checkInsToday: prev.checkInsToday + (Math.random() > 0.8 ? 1 : 0)
      }))
      
      setLastUpdated(new Date())
    }, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('Connection restored')
    }
    
    const handleOffline = () => {
      setIsOnline(false)
      toast.error('Connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Manual refresh function
  const handleRefresh = async () => {
    setIsLoading(true)
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Update metrics with new data
    setMetrics(prev => ({
      ...prev,
      checkInsToday: prev.checkInsToday + Math.floor(Math.random() * 5)
    }))
    
    setLastUpdated(new Date())
    setIsLoading(false)
    toast.success('Dashboard refreshed')
  }

  // Mark notification as read
  const markNotificationRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([])
    toast.success('All notifications cleared')
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="p-6">
      {/* Top Status Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Gaming Platform Control Hub
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Real-time monitoring and management
            </p>
          </div>

          <div className="flex items-center space-x-4">
            {/* Connection Status */}
            <div className="flex items-center space-x-2">
              {isOnline ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Last Updated */}
            <div className="text-right">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Last updated
              </div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                {lastUpdated.toLocaleTimeString()}
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column - Main Metrics */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <MetricCard
              title="Active Games"
              value={`${metrics.activeGames}/${metrics.totalGames}`}
              subtitle={`${metrics.totalGames - metrics.activeGames} available`}
              icon={Gamepad2}
              iconColor="text-blue-600"
              isLoading={isLoading}
              trend={{ 
                value: Math.round(((metrics.activeGames / metrics.totalGames) * 100) - 60), 
                isPositive: metrics.activeGames > 6 
              }}
            />

            <MetricCard
              title="Service Queue"
              value={metrics.queueLength}
              subtitle="Customers waiting"
              icon={ClipboardList}
              iconColor="text-orange-600"
              isLoading={isLoading}
            />

            <MetricCard
              title="Check-ins Today"
              value={metrics.checkInsToday}
              subtitle={`Peak: ${metrics.peakHours}`}
              icon={Users}
              iconColor="text-green-600"
              isLoading={isLoading}
              trend={{ value: 12, isPositive: true }}
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { name: 'Manage Games', icon: Gamepad2, color: 'blue', href: '/games' },
              { name: 'Service Queue', icon: ClipboardList, color: 'orange', href: '/services' },
              { name: 'Check-ins', icon: Users, color: 'green', href: '/checkins' },
              { name: 'Analytics', icon: BarChart3, color: 'purple', href: '/analytics' }
            ].map((action) => (
              <button
                key={action.name}
                className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-all duration-200 p-4 border border-gray-200 dark:border-gray-700 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg bg-${action.color}-100 dark:bg-${action.color}-900`}>
                    <action.icon className={`w-5 h-5 text-${action.color}-600`} />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {action.name}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Performance Overview Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Today's Performance
              </h3>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Live Data</span>
              </div>
            </div>
            
            {/* Simplified chart representation */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="h-20 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2 flex items-end justify-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{ height: '70%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">9 AM</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2 flex items-end justify-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{ height: '45%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">12 PM</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2 flex items-end justify-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{ height: '85%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">3 PM</p>
              </div>
              <div className="text-center">
                <div className="h-20 bg-blue-100 dark:bg-blue-900 rounded-lg mb-2 flex items-end justify-center">
                  <div className="w-8 bg-blue-500 rounded-t" style={{ height: '95%' }}></div>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">6 PM</p>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Peak Hour</p>
                <p className="font-semibold text-gray-900 dark:text-white">7-9 PM</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Avg Session</p>
                <p className="font-semibold text-gray-900 dark:text-white">{metrics.averageSessionTime} min</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400">Satisfaction</p>
                <p className="font-semibold text-green-600">94%</p>
              </div>
            </div>
          </div>

          {/* System Status Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Status
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Server className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">API Server</p>
                  <p className="text-xs text-green-600">Operational</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Database className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Database</p>
                  <p className="text-xs text-green-600">Connected</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <Zap className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Real-time Sync</p>
                  <p className="text-xs text-yellow-600">Minor Lag</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Events Today */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Active Events Today
              </h3>
              <Calendar className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-3">
              {[
                { name: 'Pride Night Celebration', time: '8:00 PM - 12:00 AM', status: 'live', guests: 42 },
                { name: 'Weekend Social', time: '6:00 PM - 10:00 PM', status: 'upcoming', guests: 28 },
                { name: 'Happy Hour', time: '5:00 PM - 7:00 PM', status: 'completed', guests: 35 }
              ].map((event, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      event.status === 'live' ? 'bg-green-500 animate-pulse' :
                      event.status === 'upcoming' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{event.name}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{event.time}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{event.guests}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">guests</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Notifications Panel */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {notifications.length > 0 && (
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
                  No notifications
                </p>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border ${
                      notification.read 
                        ? 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                        : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                        {notification.type === 'warning' && <AlertTriangle className="w-4 h-4 text-yellow-500" />}
                        {notification.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                        {notification.type === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {notification.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      {!notification.read && (
                        <button
                          onClick={() => markNotificationRead(notification.id)}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recent Activity
            </h3>
            <div className="space-y-3">
              {[
                { time: '2 min ago', event: 'New customer checked in', type: 'checkin' },
                { time: '5 min ago', event: 'Game station 3 became available', type: 'game' },
                { time: '8 min ago', event: 'Service request completed', type: 'service' },
                { time: '12 min ago', event: 'Peak hour alert triggered', type: 'alert' }
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'checkin' ? 'bg-green-500' :
                    activity.type === 'game' ? 'bg-blue-500' :
                    activity.type === 'service' ? 'bg-orange-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white">{activity.event}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ControlHubDashboard 