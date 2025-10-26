import { notificationManager } from './notificationManager'

export interface AppError {
  message: string
  code?: string
  statusCode?: number
  details?: any
}

export class CustomError extends Error {
  code?: string
  statusCode?: number
  details?: any

  constructor(message: string, code?: string, statusCode?: number, details?: any) {
    super(message)
    this.name = 'CustomError'
    this.code = code
    this.statusCode = statusCode
    this.details = details
  }
}

export const handleError = (error: any, operation: string) => {
  console.error(`${operation} error:`, error);

  // Check if this is a 304 Not Modified response that should be treated as success
  if (
    error?.statusCode === 304 ||
    error?.status === 304 ||
    (error?.message &&
      (error.message.includes("304") || error.message.includes("Not Modified")))
  ) {
    return { success: true, cached: true };
  }

  let message = "An unexpected error occurred";

  if (error?.message) {
    message = error.message;
  } else if (typeof error === "string") {
    message = error;
  } else if (error?.error_description) {
    message = error.error_description;
  }

  // Make error messages more user-friendly
  const userFriendlyMessages: Record<string, string> = {
    "Invalid login credentials": "Invalid email or password. Please try again.",
    "User already exists":
      "An account with this email already exists. Please sign in instead.",
    "Email not confirmed":
      "Please check your email and click the confirmation link.",
    "Too many requests":
      "Too many attempts. Please wait a moment and try again.",
    "Network error":
      "Connection error. Please check your internet connection and try again.",
    "Failed to fetch":
      "Unable to connect to the server. Please try again later.",
  };

  const friendlyMessage = userFriendlyMessages[message] || message;

  notificationManager.showError(friendlyMessage);

  return { success: false, error: { message: friendlyMessage } };
};

export const handleSuccess = (message: string) => {
  notificationManager.showSuccess(message);
  return { success: true };
};

export const handleAsyncError = async <T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<T | null> => {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
};

export const withErrorBoundary = <T extends any[], R>(
  fn: (...args: T) => R,
  context?: string
) => {
  return (...args: T): R | null => {
    try {
      return fn(...args);
    } catch (error) {
      handleError(error, context);
      return null;
    }
  };
};

export const logError = (
  error: any,
  context?: string,
  additionalData?: any
): void => {
  const errorLog = {
    timestamp: new Date().toISOString(),
    context: context || "unknown",
    error: {
      message: error?.message || "Unknown error",
      stack: error?.stack,
      code: error?.code,
      statusCode: error?.statusCode,
    },
    additionalData,
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  // In production, you would send this to your logging service
  console.error("Error Log:", errorLog);

  // Example: Send to logging service
  // sendToLoggingService(errorLog)
};

export const createErrorHandler = (context: string) => {
  return (error: any, additionalData?: any) => {
    logError(error, context, additionalData);
    handleError(error, context);
  };
};

// Network error handling
export const handleNetworkError = (error: any): void => {
  // Check if this is a 304 Not Modified response that should be treated as success
  if (
    error?.statusCode === 304 ||
    error?.status === 304 ||
    (error?.message &&
      (error.message.includes("304") || error.message.includes("Not Modified")))
  ) {
    return;
  }

  if (!navigator.onLine) {
    notificationManager.showError("You are offline. Please check your internet connection.");
    return;
  }

  if (error?.code === "NETWORK_ERROR" || error?.message?.includes("fetch")) {
    notificationManager.showNetworkError();
    return;
  }

  handleError(error, "Network");
};

// Validation error handling
export const handleValidationError = (errors: string[]): void => {
  const message = errors.length === 1
    ? errors[0]
    : `Multiple validation errors: ${errors.join(', ')}`

  notificationManager.showError(message)
}

// Rate limiting error handling
export const handleRateLimitError = (): void => {
  notificationManager.showError('Too many requests. Please wait a moment before trying again.')
}

// Permission error handling
export const handlePermissionError = (): void => {
  notificationManager.showError('You do not have permission to perform this action.')
}

// File upload error handling
export const handleFileUploadError = (error: any): void => {
  if (error?.code === 'file-too-large') {
    notificationManager.showError('File is too large. Please choose a smaller file.')
  } else if (error?.code === 'invalid-file-type') {
    notificationManager.showError('Invalid file type. Please choose a supported file format.')
  } else {
    notificationManager.showUploadError('file')
  }
}

// Database error handling
export const handleDatabaseError = (error: any): void => {
  if (error?.code === '23505') { // Unique constraint violation
    notificationManager.showError('This record already exists.')
  } else if (error?.code === '23503') { // Foreign key constraint violation
    notificationManager.showError('Cannot delete this record as it is referenced by other data.')
  } else if (error?.code === '42501') { // Insufficient privilege
    notificationManager.showError('You do not have permission to perform this operation.')
  } else {
    notificationManager.showError('Database error occurred. Please try again.')
  }
}

export default {
  handleError,
  handleAsyncError,
  withErrorBoundary,
  logError,
  createErrorHandler,
  handleNetworkError,
  handleValidationError,
  handleRateLimitError,
  handlePermissionError,
  handleFileUploadError,
  handleDatabaseError,
  CustomError
}
