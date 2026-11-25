import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  resetKey?: any;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    const msg = String(error?.message || '');
    if (
      /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(
        msg,
      ) &&
      typeof window !== 'undefined'
    ) {
      try {
        const last = Number(sessionStorage.getItem('sv_chunk_reload_at') || '0');
        if (Date.now() - last > 15_000) {
          sessionStorage.setItem('sv_chunk_reload_at', String(Date.now()));
          window.location.reload();
        }
      } catch {
        window.location.reload();
      }
    }
  }

  componentDidUpdate(prevProps: Props) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleRetry = () => {
    const msg = String(this.state.error?.message || '');
    if (
      /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(
        msg,
      )
    ) {
      window.location.reload();
      return;
    }
    this.setState({ hasError: false, error: null });
  };
  render() {
    if (this.state.hasError) {
      const msg = String(this.state.error?.message || '');
      const isChunkError =
        /failed to fetch dynamically imported module|importing a module script failed|chunkloaderror|loading chunk/i.test(
          msg,
        );
      if (isChunkError) {
        return (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center', fontFamily: 'Inter, sans-serif' }}>
            <h2 style={{ color: '#2D3E36', marginBottom: '0.5rem' }}>Updating to the latest version…</h2>
            <p style={{ color: '#5F6F67', marginBottom: '1.25rem' }}>
              A fresh update was just published. Reload the page to load the newest content.
            </p>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.6rem 1.25rem',
                backgroundColor: '#546C60',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Refresh Now
            </button>
          </div>
        );
      }
      return (
        <div style={{ padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: '#d32f2f' }}>Something went wrong.</h2>
          <p style={{ color: '#555' }}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
          <button
            onClick={this.handleRetry}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
