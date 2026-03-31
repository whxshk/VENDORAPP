import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ErrorDisplay } from './components/ErrorDisplay';
import { ErrorHandlerProvider, useErrorHandlerContext } from './hooks/useErrorHandler';
import { ThemeProvider } from './context/ThemeContext';
import { setErrorHandler } from './api/client';
import './index.css';

// Component to initialize error handler for API client
function ErrorHandlerInitializer() {
  const { addError } = useErrorHandlerContext();

  React.useEffect(() => {
    // Set the error handler for API client
    setErrorHandler((error: Error, context?: string) => {
      addError(error, context);
    });
  }, [addError]);

  return null;
}

// Create QueryCache and MutationCache for error handling (v5 compatible)
const queryCache = new QueryCache({
  onError: (error: any) => {
    // React Query errors are handled here
    console.error('React Query Error:', error);
  },
});

const mutationCache = new MutationCache({
  onError: (error: any) => {
    // React Query mutation errors are handled here
    console.error('React Query Mutation Error:', error);
  },
});

const queryClient = new QueryClient({
  queryCache,
  mutationCache,
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <ErrorHandlerProvider>
          <ErrorHandlerInitializer />
          <QueryClientProvider client={queryClient}>
            <App />
            <ErrorDisplay />
          </QueryClientProvider>
        </ErrorHandlerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);
