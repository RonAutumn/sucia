import React, { useState, useEffect } from 'react'
import { supabase, supabaseConfig } from '../../utils/supabase'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'

interface ConnectionTestResult {
  hasCredentials: boolean
  canConnect: boolean
  error?: string
  timestamp: string
}

export default function SupabaseConnectionTest() {
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runConnectionTest = async () => {
    setIsLoading(true)
    const timestamp = new Date().toLocaleTimeString()
    
    try {
      // Check environment variables
      const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
      const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      const hasCredentials = hasUrl && hasKey

      console.log('Environment check:', {
        hasUrl,
        hasKey,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        isConfigured: supabaseConfig.isConfigured,
        mode: supabaseConfig.mode
      })

      if (!hasCredentials) {
        setTestResult({
          hasCredentials: false,
          canConnect: false,
          error: 'Missing environment variables',
          timestamp
        })
        return
      }

      // Test actual connection
      const { data, error } = await supabase
        .from('games')
        .select('count(*)')
        .limit(1)

      if (error && error.code !== 'DEMO_MODE') {
        setTestResult({
          hasCredentials: true,
          canConnect: false,
          error: error.message,
          timestamp
        })
      } else {
        setTestResult({
          hasCredentials: true,
          canConnect: !error || error.code !== 'DEMO_MODE',
          timestamp
        })
      }
    } catch (err) {
      setTestResult({
        hasCredentials: true,
        canConnect: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    runConnectionTest()
  }, [])

  const getStatusIcon = () => {
    if (isLoading) return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />
    if (!testResult) return <Clock className="w-5 h-5 text-gray-500" />
    if (!testResult.hasCredentials) return <AlertTriangle className="w-5 h-5 text-orange-500" />
    if (!testResult.canConnect) return <XCircle className="w-5 h-5 text-red-500" />
    return <CheckCircle className="w-5 h-5 text-green-500" />
  }

  const getStatusMessage = () => {
    if (isLoading) return 'Testing connection...'
    if (!testResult) return 'No test results'
    if (!testResult.hasCredentials) return 'Environment variables missing'
    if (!testResult.canConnect) return `Connection failed: ${testResult.error}`
    return 'Connected successfully!'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Supabase Connection Test
        </h3>
        <button
          onClick={runConnectionTest}
          disabled={isLoading}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium disabled:opacity-50"
        >
          Test Again
        </button>
      </div>

      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {getStatusMessage()}
          </span>
        </div>

        {/* Environment Variables */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Environment Variables
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-gray-600 dark:text-gray-400">
                NEXT_PUBLIC_SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <XCircle className="w-3 h-3 text-red-500" />
              )}
              <span className="text-gray-600 dark:text-gray-400">
                NEXT_PUBLIC_SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}
              </span>
            </div>
          </div>
        </div>

        {/* Configuration Status */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            Configuration Status
          </h4>
          <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
            <div>Mode: <span className="font-mono">{supabaseConfig.mode}</span></div>
            <div>Is Configured: <span className="font-mono">{supabaseConfig.isConfigured.toString()}</span></div>
            <div>Has URL: <span className="font-mono">{supabaseConfig.hasUrl.toString()}</span></div>
            <div>Has Key: <span className="font-mono">{supabaseConfig.hasKey.toString()}</span></div>
          </div>
        </div>

        {/* Test Result Details */}
        {testResult && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
              Test Result ({testResult.timestamp})
            </h4>
            <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div>Has Credentials: <span className="font-mono">{testResult.hasCredentials.toString()}</span></div>
              <div>Can Connect: <span className="font-mono">{testResult.canConnect.toString()}</span></div>
              {testResult.error && (
                <div>Error: <span className="font-mono text-red-600 dark:text-red-400">{testResult.error}</span></div>
              )}
            </div>
          </div>
        )}

        {/* Instructions */}
        {testResult && !testResult.hasCredentials && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
              Setup Instructions
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
              Create a `.env.local` file in your project root with:
            </p>
            <div className="text-xs font-mono text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-800 p-2 rounded border">
              NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co<br/>
              NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
            </div>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
              Then restart your dev server with `npm run dev`
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 