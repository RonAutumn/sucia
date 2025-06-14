import { supabase } from './supabase'

// Simple test interface for demo purposes
export interface DemoTestResult {
  success: boolean
  message: string
  details?: any
}

/**
 * Test basic Supabase connectivity
 */
export async function testSupabaseConnection(): Promise<DemoTestResult> {
  try {
    // Try to get the Supabase client status
    const { data, error } = await supabase.from('_health_check').select('*').limit(1)
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table not found, which is expected
      return {
        success: false,
        message: 'Supabase connection failed',
        details: error
      }
    }
    
    return {
      success: true,
      message: 'Supabase client initialized successfully',
      details: { connectionStatus: 'ready' }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Supabase',
      details: error
    }
  }
}

/**
 * Test real-time capabilities
 */
export async function testRealtimeConnection(): Promise<DemoTestResult> {
  try {
    // Test realtime subscription setup (without actually subscribing)
    const channel = supabase.channel('test_channel')
    
    return {
      success: true,
      message: 'Realtime channel creation successful',
      details: { channelState: channel.state }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Realtime connection test failed',
      details: error
    }
  }
}

/**
 * Run all connectivity tests
 */
export async function runDemoConnectivityTests(): Promise<DemoTestResult[]> {
  const results: DemoTestResult[] = []
  
  // Test basic connection
  const connectionTest = await testSupabaseConnection()
  results.push({
    ...connectionTest,
    message: `Database Connection: ${connectionTest.message}`
  })
  
  // Test realtime
  const realtimeTest = await testRealtimeConnection()
  results.push({
    ...realtimeTest,
    message: `Realtime Features: ${realtimeTest.message}`
  })
  
  return results
}

/**
 * Check if environment variables are configured
 */
export function checkEnvironmentConfig(): DemoTestResult {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
    return {
      success: false,
      message: 'Supabase URL not configured. Please update your .env.local file.',
      details: { missing: 'NEXT_PUBLIC_SUPABASE_URL' }
    }
  }
  
  if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
    return {
      success: false,
      message: 'Supabase anon key not configured. Please update your .env.local file.',
      details: { missing: 'NEXT_PUBLIC_SUPABASE_ANON_KEY' }
    }
  }
  
  return {
    success: true,
    message: 'Environment variables configured correctly',
    details: { 
      urlConfigured: !!supabaseUrl,
      keyConfigured: !!supabaseKey
    }
  }
} 