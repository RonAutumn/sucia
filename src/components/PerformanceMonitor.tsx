import { useEffect } from 'react'
import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals'

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
  }
}

interface PerformanceMonitorProps {
  enabled?: boolean
  debug?: boolean
}

// Performance thresholds based on Google's Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // Largest Contentful Paint
  INP: { good: 200, needsImprovement: 500 },   // Interaction to Next Paint
  CLS: { good: 0.1, needsImprovement: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, needsImprovement: 3000 }, // First Contentful Paint
  TTFB: { good: 800, needsImprovement: 1800 }  // Time to First Byte
}

// Send performance data to analytics service
function sendToAnalytics(metric: Metric) {
  // In production, you would send this to your analytics service
  // For now, we'll use console.log for debugging
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Example: Send to Google Analytics 4
    if (window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        event_label: getPerformanceRating(metric),
        non_interaction: true,
      })
    }

    // Example: Send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: getPerformanceRating(metric),
        id: metric.id,
        timestamp: Date.now(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      }),
    }).catch(error => {
      console.error('Failed to send performance metric:', error)
    })
  }
}

// Get performance rating based on thresholds
function getPerformanceRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const threshold = PERFORMANCE_THRESHOLDS[metric.name as keyof typeof PERFORMANCE_THRESHOLDS]
  if (!threshold) return 'good'

  if (metric.value <= threshold.good) return 'good'
  if (metric.value <= threshold.needsImprovement) return 'needs-improvement'
  return 'poor'
}

// Log performance metrics for debugging
function logPerformanceMetric(metric: Metric, debug: boolean) {
  if (!debug) return

  const rating = getPerformanceRating(metric)
  const value = metric.name === 'CLS' ? (metric.value * 1000).toFixed(2) : Math.round(metric.value)
  const unit = metric.name === 'CLS' ? '' : 'ms'

  console.group(`🚀 Performance Metric: ${metric.name}`)
  console.log(`Value: ${value}${unit}`)
  console.log(`Rating: ${rating}`)
  console.log(`ID: ${metric.id}`)
  console.log(`URL: ${window.location.href}`)
  console.groupEnd()

  // Show performance warning for poor metrics
  if (rating === 'poor') {
    console.warn(`⚠️ Poor ${metric.name} performance detected: ${value}${unit}`)
  }
}

// Component to initialize performance monitoring
export default function PerformanceMonitor({ 
  enabled = process.env.NODE_ENV === 'production',
  debug = process.env.NODE_ENV === 'development'
}: PerformanceMonitorProps) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return

    // Collect and report Core Web Vitals
    const handleMetric = (metric: Metric) => {
      logPerformanceMetric(metric, debug)
      sendToAnalytics(metric)
    }

    try {
      // Core Web Vitals
      onCLS(handleMetric)
      onINP(handleMetric)
      onLCP(handleMetric)

      // Other useful metrics
      onFCP(handleMetric)
      onTTFB(handleMetric)

      // Monitor page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Page is being hidden, good time to send any pending metrics
          if (debug) {
            console.log('📊 Page visibility changed to hidden, sending final metrics')
          }
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      // Monitor memory usage (if available)
      if ('memory' in performance && debug) {
        const memInfo = (performance as any).memory
        console.log('💾 Memory Usage:', {
          used: `${Math.round(memInfo.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(memInfo.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024)}MB`
        })
      }

      // Monitor network information (if available)
      if ('connection' in navigator && debug) {
        const connection = (navigator as any).connection
        console.log('🌐 Network Info:', {
          effectiveType: connection.effectiveType,
          downlink: `${connection.downlink}Mbps`,
          rtt: `${connection.rtt}ms`,
          saveData: connection.saveData
        })
      }

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    } catch (error) {
      console.error('Performance monitoring setup failed:', error)
    }
  }, [enabled, debug])

  // This component doesn't render anything
  return null
}

// Hook for accessing performance data in components
export function usePerformanceMonitor() {
  // Provide a simple way to measure component performance
  const measureComponentRender = (componentName: string) => {
    const start = performance.now()
    return () => {
      const end = performance.now()
      const duration = end - start
      if (process.env.NODE_ENV === 'development') {
        console.log(`⏱️ ${componentName} render time: ${duration.toFixed(2)}ms`)
      }
    }
  }

  return { measureComponentRender }
}

// Utility function to prefetch critical resources
export function prefetchCriticalResources() {
  if (typeof window === 'undefined') return

  // Prefetch critical images
  const criticalImages = [
    '/images/sucia-logo.png',
    '/images/sucia-logo-small.png'
  ]

  criticalImages.forEach(src => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = src
    link.as = 'image'
    document.head.appendChild(link)
  })

  // Prefetch critical API routes
  const criticalRoutes = [
    '/api/events',
    '/api/checkins'
  ]

  criticalRoutes.forEach(href => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = href
    document.head.appendChild(link)
  })
}

// Component to handle resource prefetching
export function ResourcePrefetcher() {
  useEffect(() => {
    // Prefetch resources after initial load
    const timer = setTimeout(prefetchCriticalResources, 2000)
    return () => clearTimeout(timer)
  }, [])

  return null
} 