'use client'

import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error('ErrorBoundary caught an error:', error)
  }

  render() {
    if (this.state.hasError) {
      console.error('Rendering error state:', this.state.error)
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <h2 className="text-red-800 font-medium">Something went wrong</h2>
          <pre className="text-sm text-red-600 mt-2">
            {this.state.error?.message}
          </pre>
        </div>
      )
    }

    return this.props.children
  }
} 