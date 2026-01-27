import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { useErrorHandler } from './hooks/useErrorHandler';
import { setErrorHandler } from './api/client';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
      onError: (error: any) => {
        // React Query errors are handled here
        console.error('React Query Error:', error);
      },
    },
    mutations: {
      onError: (error: any) => {
        // React Query mutation errors are handled here
        console.error('React Query Mutation Error:', error);
      },
    },
  },
});

// Error Handler Provider Component
function ErrorHandlerProvider({ children }: { children: React.ReactNode }) {
  const { addError } = useErrorHandler();

  React.useEffect(() => {
    // Set the error handler for API client
    setErrorHandler((error: Error, context?: string) => {
      addError(error, context);
    });
  }, [addError]);

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ErrorHandlerProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <ErrorDisplay />
        </QueryClientProvider>
      </ErrorHandlerProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
