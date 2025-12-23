"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI
 */
class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log error details in development only
        if (process.env.NODE_ENV === 'development') {
            console.error("ErrorBoundary caught an error:", error, errorInfo);
        }
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    public render() {
        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-background p-4">
                    <div className="max-w-md w-full space-y-6 text-center">
                        <div className="space-y-2">
                            <h1 className="text-3xl font-bold text-foreground">Oops!</h1>
                            <h2 className="text-xl text-muted-foreground">
                                Something went wrong
                            </h2>
                        </div>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-left">
                                <p className="text-sm font-mono text-red-600 dark:text-red-400 break-words">
                                    {this.state.error.message}
                                </p>
                            </div>
                        )}

                        <div className="space-y-3">
                            <p className="text-muted-foreground">
                                We apologize for the inconvenience. Please try again.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    onClick={this.handleReset}
                                    variant="default"
                                    className="w-full sm:w-auto"
                                >
                                    Try Again
                                </Button>

                                <Button
                                    onClick={() => window.location.href = '/'}
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    Go to Home
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
