import React, { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: string
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error)
      console.error('Error Info:', errorInfo)
    }

    // In production, you would send this to your error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, or custom analytics
      this.logErrorToService(error, errorInfo)
    }

    this.setState({
      error,
      errorInfo: errorInfo.componentStack || undefined
    })
  }

  private logErrorToService = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send error to monitoring service
    try {
      // Example: Sentry error reporting
      // Sentry.captureException(error, { contexts: { react: errorInfo } })

      // Example: Custom analytics endpoint
      fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
          errorInfo: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          url: typeof window !== 'undefined' ? window.location.href : '',
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        }),
      }).catch(fetchError => {
        console.error('Failed to log error to service:', fetchError)
      })
    } catch (loggingError) {
      console.error('Error while logging to service:', loggingError)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-100 dark:bg-error-900/20 rounded-full mb-4">
              <AlertTriangle className="w-6 h-6 text-error-600 dark:text-error-400" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold text-neutral-900 dark:text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-neutral-600 dark:text-neutral-400 mb-6">
                We encountered an unexpected error. Don't worry, our team has been notified and we're working to fix it.
              </p>

              {/* Error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Error Details (Development)
                  </summary>
                  <div className="bg-neutral-100 dark:bg-neutral-700 rounded p-3 text-xs font-mono">
                    <p className="text-error-600 dark:text-error-400 font-bold mb-2">
                      {this.state.error.name}: {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <pre className="whitespace-pre-wrap text-neutral-600 dark:text-neutral-400">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={this.handleRetry}
                  className="flex items-center justify-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors font-medium"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </button>

                <button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center px-4 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white rounded-lg transition-colors font-medium"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </button>

                <button
                  onClick={this.handleReload}
                  className="flex items-center justify-center px-4 py-2 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-750 text-neutral-700 dark:text-white rounded-lg transition-colors font-medium"
                >
                  Reload Page
                </button>
              </div>

              {/* Support contact */}
              <div className="mt-6 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  If this problem persists, please contact{' '}
                  <a 
                    href="mailto:support@sucianyc.com" 
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    support@sucianyc.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by error handler:', error)
      if (errorInfo) console.error('Additional info:', errorInfo)
    }

    // In production, send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      try {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            error: {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
            errorInfo,
            timestamp: new Date().toISOString(),
            url: typeof window !== 'undefined' ? window.location.href : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          }),
        }).catch(fetchError => {
          console.error('Failed to log error:', fetchError)
        })
      } catch (loggingError) {
        console.error('Error while logging:', loggingError)
      }
    }
  }
} 