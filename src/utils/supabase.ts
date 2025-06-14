import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if Supabase is configured
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Create a mock client for demo mode
const createMockClient = () => ({
  from: (table: string) => ({
    select: (query: string = '*', options?: any) => Promise.resolve({ 
      data: [], 
      error: { message: 'Demo mode - Supabase not configured', code: 'DEMO_MODE' },
      count: 0 
    }),
    insert: (data: any) => Promise.resolve({ data: null, error: { message: 'Demo mode', code: 'DEMO_MODE' } }),
    update: (data: any) => Promise.resolve({ data: null, error: { message: 'Demo mode', code: 'DEMO_MODE' } }),
    delete: () => Promise.resolve({ data: null, error: { message: 'Demo mode', code: 'DEMO_MODE' } }),
    eq: function(column: string, value: any) { return this },
    gte: function(column: string, value: any) { return this },
    limit: function(count: number) { return this }
  }),
  channel: (name: string) => ({
    on: (event: string, options: any, callback: Function) => ({ subscribe: (cb?: Function) => 'DEMO' }),
    subscribe: (callback?: Function) => {
      if (callback) callback('CHANNEL_ERROR')
      return { unsubscribe: () => {} }
    },
    unsubscribe: () => {}
  }),
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Demo mode' } }),
    signOut: () => Promise.resolve({ error: null })
  }
})

// Create and export the Supabase client or mock
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createMockClient() as any

// Export types for TypeScript support
export type { User, Session } from '@supabase/supabase-js'

// Export configuration status
export const supabaseConfig = {
  isConfigured: isSupabaseConfigured,
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  mode: isSupabaseConfigured ? 'database' : 'demo'
} 