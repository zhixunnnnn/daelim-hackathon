/**
 * Production-grade error handling utilities
 */

export interface ErrorInfo {
  message: string;
  code?: string;
  context?: Record<string, unknown>;
  timestamp: number;
}

class ErrorHandler {
  private isDevelopment = import.meta.env.DEV;

  /**
   * Log error with context
   */
  logError(error: unknown, context?: Record<string, unknown>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: this.getErrorMessage(error),
      timestamp: Date.now(),
      context,
    };

    if (error instanceof Error) {
      errorInfo.code = error.name;
      errorInfo.message = error.message;
    }

    // In development, log to console
    if (this.isDevelopment) {
      console.error("Error:", errorInfo);
      if (error instanceof Error && error.stack) {
        console.error("Stack trace:", error.stack);
      }
    }

    // In production, you could send to error tracking service
    // Example: Sentry, LogRocket, etc.
    // if (!this.isDevelopment) {
    //   errorTrackingService.captureException(error, { extra: context });
    // }

    return errorInfo;
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    return "An unexpected error occurred";
  }

  /**
   * Handle API errors
   */
  handleApiError(response: Response, context?: Record<string, unknown>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: `API request failed with status ${response.status}`,
      code: `HTTP_${response.status}`,
      timestamp: Date.now(),
      context: {
        ...context,
        status: response.status,
        statusText: response.statusText,
      },
    };

    this.logError(new Error(errorInfo.message), errorInfo.context);
    return errorInfo;
  }

  /**
   * Handle network errors
   */
  handleNetworkError(error: unknown, context?: Record<string, unknown>): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
      timestamp: Date.now(),
      context,
    };

    this.logError(error, errorInfo.context);
    return errorInfo;
  }
}

export const errorHandler = new ErrorHandler();

