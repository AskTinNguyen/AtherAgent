import { useAuth } from '@/components/providers/supabase-provider'
import { Component, ErrorInfo, ReactNode } from 'react'
import { toast } from 'sonner'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  retryCount: number
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // 1 second

export class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    retryCount: 0
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      retryCount: 0
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Auth error caught:', error, errorInfo)
  }

  private handleRetry = async () => {
    if (this.state.retryCount >= MAX_RETRIES) {
      toast.error('Maximum retry attempts reached. Please try again later.')
      return
    }

    this.setState(
      prevState => ({
        retryCount: prevState.retryCount + 1
      }),
      () => {
        setTimeout(() => {
          this.setState({
            hasError: false,
            error: null
          })
        }, RETRY_DELAY)
      }
    )
  }

  private handleSignIn = () => {
    // Access the auth context through a child component
    const AuthErrorContent = () => {
      const { setShowSignInModal } = useAuth()
      return (
        <button
          onClick={() => setShowSignInModal(true)}
          className="text-primary hover:underline"
        >
          Sign in
        </button>
      )
    }

    return <AuthErrorContent />
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[200px] p-4">
            <p className="text-muted-foreground mb-4">
              {this.state.error?.message || 'An authentication error occurred'}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={this.handleRetry}
                className="text-sm text-primary hover:underline"
                disabled={this.state.retryCount >= MAX_RETRIES}
              >
                {this.state.retryCount >= MAX_RETRIES
                  ? 'Max retries reached'
                  : 'Try again'}
              </button>
              <this.handleSignIn />
            </div>
            {this.state.retryCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Retry attempt {this.state.retryCount} of {MAX_RETRIES}
              </p>
            )}
          </div>
        )
      )
    }

    return this.props.children
  }
} 