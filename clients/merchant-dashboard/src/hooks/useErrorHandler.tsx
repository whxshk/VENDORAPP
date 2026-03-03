import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

export interface AppError {
  id: string;
  message: string;
  type: 'API' | 'Network' | 'Validation' | 'Runtime' | 'Unknown';
  timestamp: Date;
  stack?: string;
  context?: string;
  userMessage: string;
  retryable: boolean;
  statusCode?: number;
}

interface ErrorHandlerState {
  errors: AppError[];
  addError: (error: Error | AppError, context?: string) => void;
  removeError: (id: string) => void;
  clearAll: () => void;
}

const MAX_ERRORS = 10;
const STORAGE_KEY = 'recent_errors';

function getUserFriendlyMessage(error: Error | AppError, type: AppError['type']): string {
  const message = error.message || 'An unexpected error occurred';
  
  if (type === 'Network') {
    return 'Cannot reach the server. Please check your internet connection and ensure the backend service is running.';
  }
  
  if (type === 'API') {
    if (message.includes('401') || message.includes('Unauthorized')) {
      return 'Your session has expired. Please log in again.';
    }
    if (message.includes('403') || message.includes('Forbidden')) {
      return 'You do not have permission to perform this action.';
    }
    if (message.includes('404') || message.includes('Not Found')) {
      return 'The requested resource was not found.';
    }
    if (message.includes('500') || message.includes('Internal Server Error')) {
      return 'A server error occurred. Please try again later or contact support.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long. Please try again.';
    }
    return `API Error: ${message}`;
  }
  
  if (type === 'Validation') {
    return `Validation Error: ${message}`;
  }
  
  return message;
}

function determineErrorType(error: Error | AppError, statusCode?: number): AppError['type'] {
  if ('type' in error) {
    return error.type;
  }
  
  if (statusCode) {
    if (statusCode >= 500) return 'API';
    if (statusCode >= 400) return 'API';
  }
  
  if (error.message?.includes('Network') || error.message?.includes('fetch')) {
    return 'Network';
  }
  
  if (error.message?.includes('validation') || error.message?.includes('required')) {
    return 'Validation';
  }
  
  return 'Runtime';
}

// Create context for error handler
const ErrorHandlerContext = createContext<ErrorHandlerState | null>(null);

// Provider component that manages shared error state
export function ErrorHandlerProvider({ children }: { children: ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>(() => {
    // Load from localStorage on init
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp),
        })).slice(0, MAX_ERRORS);
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  const addError = useCallback((error: Error | AppError, context?: string) => {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const isAppError = 'type' in error && 'userMessage' in error;
    const type = isAppError ? error.type : determineErrorType(error, (error as any).statusCode);
    const userMessage = isAppError ? error.userMessage : getUserFriendlyMessage(error, type);
    
    const appError: AppError = {
      id: errorId,
      message: error.message || 'Unknown error',
      type,
      timestamp: new Date(),
      stack: error.stack,
      context: context || (error as any).context,
      userMessage,
      retryable: type === 'Network' || (type === 'API' && (error as any).statusCode >= 500),
      statusCode: (error as any).statusCode,
    };

    setErrors((prev) => {
      const duplicate = prev.find(
        (existing) =>
          existing.userMessage === appError.userMessage &&
          (existing.context || '') === (appError.context || '') &&
          Date.now() - existing.timestamp.getTime() < 5000,
      );
      if (duplicate) {
        return prev;
      }
      const updated = [appError, ...prev].slice(0, MAX_ERRORS);
      // Store in localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const removeError = useCallback((id: string) => {
    setErrors((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // Ignore storage errors
      }
      return updated;
    });
  }, []);

  const clearAll = useCallback(() => {
    setErrors([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Set up global error handlers
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const error = new Error(event.message);
      error.stack = `${event.filename}:${event.lineno}:${event.colno}`;
      addError(error, `Runtime Error: ${event.filename}`);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error 
        ? event.reason 
        : new Error(String(event.reason));
      addError(error, 'Unhandled Promise Rejection');
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, [addError]);

  const value: ErrorHandlerState = {
    errors,
    addError,
    removeError,
    clearAll,
  };

  return (
    <ErrorHandlerContext.Provider value={value}>
      {children}
    </ErrorHandlerContext.Provider>
  );
}

// Hook to use error handler context
export function useErrorHandlerContext(): ErrorHandlerState {
  const context = useContext(ErrorHandlerContext);
  if (!context) {
    throw new Error('useErrorHandlerContext must be used within ErrorHandlerProvider');
  }
  return context;
}

// Legacy hook for backward compatibility (now uses context)
export function useErrorHandler(): ErrorHandlerState {
  return useErrorHandlerContext();
}
