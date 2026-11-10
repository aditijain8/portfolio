import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '../ui/Button'

interface State {
  failed: boolean
}

/** Catches render errors so one broken section never blanks the whole site. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error.message, info.componentStack)
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    if (this.state.failed && prev.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="container-page grid min-h-[60vh] place-items-center text-center">
        <div>
          <h1 className="font-display text-5xl">Something broke</h1>
          <p className="mx-auto mt-4 max-w-md text-muted">An unexpected error occurred while rendering this page.</p>
          <Button className="mt-8" onClick={() => window.location.reload()}>
            Reload page
          </Button>
        </div>
      </div>
    )
  }
}
