import React from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Try to report to error handler if available
    try {
      const errorHandler = (window as any).__errorHandler;
      if (errorHandler) {
        errorHandler(error, `React Error Boundary: ${errorInfo.componentStack?.split('\n')[0] || 'Unknown component'}`);
      }
    } catch {
      // Ignore if error handler not available
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0f1a] p-8">
          <div className="max-w-2xl w-full bg-slate-900/90 border border-red-500/30 rounded-xl p-8 shadow-2xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertCircle className="h-6 w-6 text-red-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-red-400 mb-2">Something went wrong</h2>
                <p className="text-slate-300 mb-4">
                  {this.state.error?.message || 'An unexpected error occurred. Please try reloading the page.'}
                </p>
                
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className="text-sm text-slate-400 cursor-pointer hover:text-slate-300 mb-2">
                      Technical Details (Click to expand)
                    </summary>
                    <div className="mt-2 p-4 bg-slate-800/50 rounded-lg border border-white/5">
                      <div className="text-xs font-mono text-slate-400 whitespace-pre-wrap break-all">
                        <div className="mb-2">
                          <strong className="text-slate-300">Error:</strong> {this.state.error?.stack}
                        </div>
                        {this.state.errorInfo.componentStack && (
                          <div>
                            <strong className="text-slate-300">Component Stack:</strong>
                            <pre className="mt-1 text-slate-400">{this.state.errorInfo.componentStack}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </details>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="bg-blue-500 hover:bg-blue-600"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = '/login';
                }}
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
