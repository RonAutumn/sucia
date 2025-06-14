import React from 'react'
import { CheckCircle, AlertCircle, XCircle, Clock, PlayCircle } from 'lucide-react'

interface SystemStatusProps {
  status: {
    database: 'connected' | 'disconnected' | 'error' | 'demo'
    realtime: 'connected' | 'disconnected' | 'error' | 'demo'
    services: 'healthy' | 'degraded' | 'error' | 'demo'
  }
  onRefresh?: () => void
}

const statusConfig = {
  connected: {
    icon: CheckCircle,
    color: 'text-success-500 dark:text-success-400',
    bgColor: 'bg-success-500',
    label: 'Connected'
  },
  healthy: {
    icon: CheckCircle,
    color: 'text-success-500 dark:text-success-400',
    bgColor: 'bg-success-500',
    label: 'Healthy'
  },
  disconnected: {
    icon: Clock,
    color: 'text-warning-500 dark:text-warning-400',
    bgColor: 'bg-warning-500',
    label: 'Connecting...'
  },
  degraded: {
    icon: AlertCircle,
    color: 'text-warning-500 dark:text-warning-400',
    bgColor: 'bg-warning-500',
    label: 'Degraded'
  },
  error: {
    icon: XCircle,
    color: 'text-error-500 dark:text-error-400',
    bgColor: 'bg-error-500',
    label: 'Error'
  },
  demo: {
    icon: PlayCircle,
    color: 'text-info-500 dark:text-info-400',
    bgColor: 'bg-info-500',
    label: 'Demo Mode'
  }
}

export default function SystemStatus({ status, onRefresh }: SystemStatusProps) {
  const services = [
    { name: 'Database Connection', status: status.database },
    { name: 'Real-time Updates', status: status.realtime },
    { name: 'Services Health', status: status.services }
  ]

  const isDemoMode = Object.values(status).some(s => s === 'demo')

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm dark:shadow-lg p-6 border border-neutral-200 dark:border-neutral-700 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-white transition-colors">
            System Status
          </h3>
          {isDemoMode && (
            <p className="text-sm text-info-600 dark:text-info-400 mt-1 transition-colors">
              Running in demo mode - Connect Supabase for live data
            </p>
          )}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="text-sm text-info-600 hover:text-info-700 dark:text-info-400 dark:hover:text-info-300 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-info-50 dark:hover:bg-info-900/20"
          >
            Refresh
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {services.map((service) => {
          const config = statusConfig[service.status as keyof typeof statusConfig]
          const Icon = config.icon

          return (
            <div key={service.name} className="flex items-center space-x-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 transition-all duration-200 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <div className="flex-shrink-0">
                <div className={`w-3 h-3 ${config.bgColor} rounded-full ${service.status === 'demo' ? 'animate-pulse' : ''} shadow-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 dark:text-white transition-colors">
                  {service.name}
                </p>
                <div className="flex items-center space-x-1">
                  <Icon className={`w-4 h-4 ${config.color} transition-colors`} />
                  <span className={`text-xs ${config.color} font-medium transition-colors`}>
                    {config.label}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {isDemoMode && (
        <div className="mt-4 p-4 bg-info-50 dark:bg-info-900/20 rounded-lg border border-info-200 dark:border-info-800/50 transition-all duration-200">
          <div className="flex items-start space-x-3">
            <PlayCircle className="w-5 h-5 text-info-600 dark:text-info-400 mt-0.5 flex-shrink-0 transition-colors" />
            <div className="flex-1">
              <p className="text-sm font-medium text-info-800 dark:text-info-200 transition-colors">
                Demo Mode Active
              </p>
              <p className="text-xs text-info-700 dark:text-info-300 mt-1 transition-colors">
                To enable live data, create a <code className="bg-info-100 dark:bg-info-800/50 px-1.5 py-0.5 rounded text-xs font-mono border border-info-200 dark:border-info-700">.env.local</code> file with your Supabase credentials:
              </p>
              <div className="mt-3 text-xs font-mono text-info-600 dark:text-info-400 bg-info-100 dark:bg-info-800/30 p-3 rounded-lg border border-info-200 dark:border-info-700 transition-colors">
                NEXT_PUBLIC_SUPABASE_URL=your_supabase_url<br/>
                NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 