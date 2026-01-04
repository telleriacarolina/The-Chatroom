'use client'

import React, { Component, ReactNode } from 'react'
import { Alert } from './ui/alert'
import { Button } from './ui/button'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Displays a friendly error message and provides a reload button
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details to console
    console.error('Error Boundary caught an error:', error)
    console.error('Error Info:', errorInfo)

    // Report to error tracking service in production
    // This is a hook for integrating error tracking services like Sentry, LogRocket, etc.
    if (process.env.NODE_ENV === 'production') {
      // TODO: Integrate with error tracking service
      // Example with Sentry:
      // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
      
      // Example with LogRocket:
      // LogRocket.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
      
      // For now, we'll just ensure the error is logged
      console.error('Production error captured. Please integrate error tracking service.')
    }
  }

  handleReload = (): void => {
    // Reload the page to recover from the error
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <Alert variant="error" className="mb-4">
              <div className="flex flex-col gap-3">
                <div>
                  <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
                  <p className="text-sm">
                    We encountered an unexpected error. Please try reloading the page.
                  </p>
                </div>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">
                      Error Details
                    </summary>
                    <pre className="mt-2 text-xs overflow-auto p-2 bg-red-100 rounded">
                      {this.state.error.toString()}
                      {this.state.error.stack && `\n\n${this.state.error.stack}`}
                    </pre>
                  </details>
                )}
              </div>
            </Alert>
            <Button
              variant="error"
              onClick={this.handleReload}
              className="w-full"
            >
              Reload Page
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
