import { useState } from 'react';
import { X, AlertCircle, RefreshCw, ChevronDown, ChevronUp, Copy, Trash2 } from 'lucide-react';
import { useErrorHandlerContext, type AppError } from '../hooks/useErrorHandler';
import { Button } from './ui/button';

interface ErrorDisplayProps {
  error: AppError;
  onDismiss: (id: string) => void;
  onRetry?: () => void;
}

function ErrorDisplayItem({ error, onDismiss, onRetry }: ErrorDisplayProps) {
  const [expanded, setExpanded] = useState(false);

  const getErrorIcon = () => {
    switch (error.type) {
      case 'Network':
        return <AlertCircle className="h-5 w-5 text-yellow-400" />;
      case 'API':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'Validation':
        return <AlertCircle className="h-5 w-5 text-orange-400" />;
      default:
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getErrorColor = () => {
    switch (error.type) {
      case 'Network':
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
      case 'API':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'Validation':
        return 'bg-orange-500/10 border-orange-500/30 text-orange-400';
      default:
        return 'bg-red-500/10 border-red-500/30 text-red-400';
    }
  };

  const copyToClipboard = () => {
    const errorText = `Error: ${error.message}\nType: ${error.type}\nContext: ${error.context || 'N/A'}\nStack: ${error.stack || 'N/A'}`;
    navigator.clipboard.writeText(errorText);
  };

  return (
    <div className={`p-4 rounded-lg border ${getErrorColor()} mb-3 animate-in slide-in-from-top-2`}>
      <div className="flex items-start gap-3">
        {getErrorIcon()}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1">
              <div className="font-semibold text-sm mb-1">{error.userMessage}</div>
              {error.context && (
                <div className="text-xs opacity-75 mb-1">Context: {error.context}</div>
              )}
              {error.statusCode && (
                <div className="text-xs opacity-75">Status Code: {error.statusCode}</div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {error.stack && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="h-6 w-6 p-0"
                >
                  {expanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className="h-6 w-6 p-0"
                title="Copy error details"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(error.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {expanded && error.stack && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <div className="text-xs font-mono opacity-75 whitespace-pre-wrap break-all">
                {error.stack}
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2 mt-3">
            {error.retryable && onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-7 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            <div className="text-xs opacity-60">
              {error.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ErrorDisplay() {
  const { errors, removeError, clearAll } = useErrorHandlerContext();
  const [isMinimized, setIsMinimized] = useState(false);

  if (errors.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md w-full">
      <div className="bg-slate-900 border border-white/10 rounded-lg shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="font-semibold text-white text-sm">
              Errors ({errors.length})
            </span>
          </div>
          <div className="flex items-center gap-1">
            {errors.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-7 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
              className="h-7 w-7 p-0"
            >
              {isMinimized ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <div className="max-h-96 overflow-y-auto p-3">
            {errors.map((error) => (
              <ErrorDisplayItem
                key={error.id}
                error={error}
                onDismiss={removeError}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
