"use client";

// src/components/shared/error-boundary.tsx

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  RefreshCw, 
  Home,
  Bug,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  errorId?: string;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showErrorDetails?: boolean;
  isolate?: boolean;
}

interface ErrorFallbackProps {
  error?: Error;
  errorInfo?: React.ErrorInfo;
  resetError: () => void;
  errorId?: string;
  showErrorDetails?: boolean;
}

// Generate unique error ID for tracking
const generateErrorId = () => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Main Error Boundary Class Component
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { 
      hasError: true, 
      error,
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = this.state.errorId || generateErrorId();
    
    // Log error for monitoring
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo,
      errorId
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // // Send to error reporting service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.gtag) {
    //   window.gtag('event', 'exception', {
    //     description: error.message,
    //     fatal: false,
    //     error_id: errorId
    //   });
    // }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.resetError}
          errorId={this.state.errorId}
          showErrorDetails={this.props.showErrorDetails}
        />
      );
    }

    return this.props.children;
  }
}

// Default Error Fallback Component
export function DefaultErrorFallback({ 
  error, 
  errorInfo, 
  resetError, 
  errorId,
  showErrorDetails = false 
}: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const errorDetails = React.useMemo(() => {
    if (!error) return '';
    
    return JSON.stringify({
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo?.componentStack,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown'
    }, null, 2);
  }, [error, errorInfo, errorId]);

  const copyErrorDetails = async () => {
    try {
      await navigator.clipboard.writeText(errorDetails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const reportError = () => {
    const subject = `Error Report - ${errorId}`;
    const body = `Please describe what you were doing when this error occurred:\n\n\n\nError Details:\n${errorDetails}`;
    const mailtoUrl = `mailto:support@flowwager.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl);
  };

  const refreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const goHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <AlertTriangle className="h-16 w-16 text-destructive" />
                <div className="absolute -top-1 -right-1">
                  <Badge variant="destructive" className="h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs">
                    !
                  </Badge>
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Oops! Something went wrong
              </h1>
              <p className="text-muted-foreground">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </p>
              {errorId && (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-muted-foreground">Error ID:</span>
                  <Badge variant="outline" className="font-mono text-xs">
                    {errorId}
                  </Badge>
                </div>
              )}
            </div>

            {/* Quick Error Info */}
            {error && (
              <div className="bg-muted p-4 rounded-lg text-left">
                <p className="text-sm font-medium text-foreground mb-1">
                  Error Message:
                </p>
                <p className="text-sm text-muted-foreground font-mono break-words">
                  {error.message}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={resetError} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </Button>
              
              <Button variant="outline" onClick={refreshPage} className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4" />
                <span>Reload Page</span>
              </Button>
              
              <Button variant="outline" onClick={goHome} className="flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </Button>
            </div>

            {/* Error Details Toggle */}
            {(showErrorDetails || errorDetails) && (
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center space-x-2"
                >
                  {showDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                  <span>{showDetails ? 'Hide' : 'Show'} Error Details</span>
                </Button>

                {showDetails && (
                  <div className="space-y-3">
                    <div className="bg-muted p-4 rounded-lg text-left max-h-64 overflow-auto">
                      <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-words">
                        {errorDetails}
                      </pre>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyErrorDetails}
                        className="flex items-center space-x-2"
                      >
                        <Copy className="h-3 w-3" />
                        <span>{copied ? 'Copied!' : 'Copy Error Details'}</span>
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reportError}
                        className="flex items-center space-x-2"
                      >
                        <Bug className="h-3 w-3" />
                        <span>Report Error</span>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Help Links */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3">
                Need help? Try these resources:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button variant="link" size="sm" asChild>
                  <a href="/help" className="flex items-center space-x-1">
                    <span>Help Center</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="link" size="sm" asChild>
                  <a href="/contact" className="flex items-center space-x-1">
                    <span>Contact Support</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button variant="link" size="sm" asChild>
                  <a href="https://status.flowwager.com" target="_blank" className="flex items-center space-x-1">
                    <span>System Status</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified Error Fallback for smaller components
export function SimpleErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="p-4 text-center space-y-3">
      <AlertTriangle className="h-8 w-8 text-destructive mx-auto" />
      <div>
        <h3 className="font-medium">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">
          {error?.message || "An unexpected error occurred"}
        </p>
      </div>
      <Button size="sm" onClick={resetError}>
        Try Again
      </Button>
    </div>
  );
}

// Network Error Component
export function NetworkErrorFallback({ resetError }: { resetError: () => void }) {
  return (
    <div className="text-center py-8 space-y-4">
      <div className="flex justify-center">
        <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
          <AlertTriangle className="h-6 w-6 text-yellow-600" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium">Connection Error</h3>
        <p className="text-muted-foreground">
          Unable to connect to the Flow network. Please check your connection and try again.
        </p>
      </div>
      <div className="space-x-2">
        <Button onClick={resetError}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Reload Page
        </Button>
      </div>
    </div>
  );
}



// Higher-order component for wrapping components with error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<ErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Component-level error boundary for specific features
export function FeatureErrorBoundary({ 
  children, 
  featureName 
}: { 
  children: React.ReactNode;
  featureName: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="p-4 border border-dashed border-muted-foreground/30 rounded-lg text-center space-y-2">
          <AlertTriangle className="h-6 w-6 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium text-sm">
              {featureName} temporarily unavailable
            </p>
            <p className="text-xs text-muted-foreground">
              {error?.message || "Please try again later"}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={resetError}>
            Retry
          </Button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

// Page-level error boundary
export function PageErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      showErrorDetails={process.env.NODE_ENV === 'development'}
      onError={(error, errorInfo) => {
        // Send to monitoring service
        console.error('Page Error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// Export types for external use
export type { ErrorBoundaryProps, ErrorFallbackProps };