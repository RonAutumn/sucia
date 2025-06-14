import React from 'react'
import '../styles/globals.css'
import type { AppProps } from 'next/app'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import NotificationProvider from '../src/components/providers/NotificationProvider'
import { ThemeProvider } from '../src/components/providers/ThemeProvider'
import PerformanceMonitor, { ResourcePrefetcher } from '../src/components/PerformanceMonitor'
import ErrorBoundary from '../src/components/ErrorBoundary'

// Loading component for route transitions
function LoadingComponent() {
  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-900 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">Loading...</p>
      </div>
    </div>
  )
}

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = React.useState(false)

  // Handle route change loading states
  useEffect(() => {
    const handleStart = (url: string) => {
      setIsLoading(true)
    }
    const handleComplete = (url: string) => {
      setIsLoading(false)
    }

    router.events.on('routeChangeStart', handleStart)
    router.events.on('routeChangeComplete', handleComplete)
    router.events.on('routeChangeError', handleComplete)

    return () => {
      router.events.off('routeChangeStart', handleStart)
      router.events.off('routeChangeComplete', handleComplete)
      router.events.off('routeChangeError', handleComplete)
    }
  }, [router])

  // Prefetch critical routes on app load
  useEffect(() => {
    const prefetchRoutes = ['/checkins', '/games', '/dashboard']
    prefetchRoutes.forEach(route => {
      router.prefetch(route).catch(err => {
        console.warn(`Failed to prefetch ${route}:`, err)
      })
    })
  }, [router])

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationProvider>
          {/* Performance monitoring for production */}
          <PerformanceMonitor enabled={process.env.NODE_ENV === 'production'} />
          
          {/* Resource prefetching */}
          <ResourcePrefetcher />
          
          {/* Loading state overlay */}
          {isLoading && <LoadingComponent />}
          
          {/* Main application component */}
          <Component {...pageProps} />
        </NotificationProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
} 