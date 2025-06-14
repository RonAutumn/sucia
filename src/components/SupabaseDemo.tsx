import React, { useState, useEffect } from 'react'
import { 
  checkEnvironmentConfig, 
  runDemoConnectivityTests, 
  DemoTestResult 
} from '../utils/supabaseTest'

const SupabaseDemo: React.FC = () => {
  const [envStatus, setEnvStatus] = useState<DemoTestResult | null>(null)
  const [testResults, setTestResults] = useState<DemoTestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check environment configuration on mount
    const envCheck = checkEnvironmentConfig()
    setEnvStatus(envCheck)
  }, [])

  const runTests = async () => {
    setIsLoading(true)
    try {
      const results = await runDemoConnectivityTests()
      setTestResults(results)
    } catch (error) {
      setTestResults([{
        success: false,
        message: 'Test execution failed',
        details: error
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Supabase Demo Setup
      </h2>
      
      {/* Environment Status */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
          Environment Configuration
        </h3>
        
        {envStatus && (
          <div className={`p-4 rounded-lg border ${
            envStatus.success 
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}>
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                envStatus.success ? 'bg-green-500' : 'bg-red-500'
              }`}></span>
              <span className="font-medium">{envStatus.message}</span>
            </div>
            
            {!envStatus.success && (
              <div className="mt-2 text-sm">
                <p>To configure Supabase:</p>
                <ol className="list-decimal list-inside mt-1 space-y-1">
                  <li>Create a <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">.env.local</code> file in your project root</li>
                  <li>Add your Supabase URL and anon key from your Supabase project dashboard</li>
                  <li>Restart the development server</li>
                </ol>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Connectivity Tests */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Connectivity Tests
          </h3>
          
          <button
            onClick={runTests}
            disabled={!envStatus?.success || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              !envStatus?.success || isLoading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed dark:bg-gray-600 dark:text-gray-400'
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
            }`}
          >
            {isLoading ? 'Testing...' : 'Run Tests'}
          </button>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-3">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.success
                    ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
                    : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
                }`}
              >
                <div className="flex items-center">
                  <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                    result.success ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <span className="font-medium">{result.message}</span>
                </div>
                
                {result.details && (
                  <details className="mt-2">
                    <summary className="text-sm cursor-pointer hover:underline">
                      Show details
                    </summary>
                    <pre className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Demo Features Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-300 mb-2">
          Demo Features Ready
        </h3>
        <p className="text-blue-700 dark:text-blue-400 text-sm">
          Once Supabase is configured, this demo will showcase:
        </p>
        <ul className="list-disc list-inside text-blue-700 dark:text-blue-400 text-sm mt-2 space-y-1">
          <li><strong>Games Platform:</strong> Real-time game lobbies and matching</li>
          <li><strong>Services Queue:</strong> Live queue management and notifications</li>
          <li><strong>Check-in Process:</strong> Real-time guest check-in tracking</li>
          <li><strong>Live Updates:</strong> Cross-device synchronization</li>
        </ul>
      </div>
    </div>
  )
}

export default SupabaseDemo 