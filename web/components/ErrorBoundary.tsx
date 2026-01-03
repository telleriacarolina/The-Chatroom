/**
 * Error Boundary must be a Client Component because it uses React lifecycle methods
 * (getDerivedStateFromError, componentDidCatch) and state, which are only available
 * in the client-side environment.
 */
'use client'

import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCcw } from 'lucide-react'

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
            <div className="bg-red-50 border border-red-300 rounded-lg p-6 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-red-900 mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-sm text-red-800">
                    We encountered an unexpected error. Please try reloading the page.
                  </p>
                  {process.env.NODE_ENV === 'development' && this.state.error && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-sm font-medium text-red-900">
                        Error Details
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto p-3 bg-red-100 rounded text-red-900 whitespace-pre-wrap">
                        {this.state.error.toString()}
                        {this.state.error.stack && `\n\n${this.state.error.stack}`}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={this.handleReload}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
