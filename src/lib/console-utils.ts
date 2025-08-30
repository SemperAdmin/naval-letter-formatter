// Console utilities to improve debugging experience
'use client';

// Track if console has been configured
let isConfigured = false;

export function configureConsole() {
  if (isConfigured || typeof window === 'undefined') return;
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Filter out known browser extension errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filter out common browser extension errors
    if (
      message.includes('message channel closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('listener indicated an asynchronous response') ||
      message.includes('chrome-extension://') ||
      message.includes('moz-extension://')
    ) {
      return; // Suppress these errors
    }
    
    // Call original console.error for everything else
    originalError.apply(console, args);
  };
  
  // Suppress excessive warnings
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    // Filter out repetitive paragraph numbering warnings
    if (message.includes('Paragraph numbering warnings')) {
      return; // Suppress these warnings
    }
    
    // Call original console.warn for everything else
    originalWarn.apply(console, args);
  };
  
  // Add window error handler for unhandled errors
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    
    // Suppress browser extension related errors
    if (
      message.includes('message channel closed') ||
      message.includes('Extension context invalidated') ||
      message.includes('listener indicated an asynchronous response')
    ) {
      event.preventDefault();
      return false;
    }
  });
  
  // Add unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason || '';
    
    // Suppress browser extension related promise rejections
    if (
      typeof message === 'string' && (
        message.includes('message channel closed') ||
        message.includes('Extension context invalidated') ||
        message.includes('listener indicated an asynchronous response')
      )
    ) {
      event.preventDefault();
      return false;
    }
  });
  
  isConfigured = true;
}

// Utility for development mode console clearing
export function clearConsoleInDev() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    // Clear console on hot reload in development
    console.clear();
  }
}

// Enhanced error reporting for development
export function logError(context: string, error: any) {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error in ${context}`);
    console.error('Error details:', error);
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
    console.groupEnd();
  } else {
    // In production, log minimal error info
    console.error(`Error in ${context}:`, error?.message || error);
  }
}

// Debug logging utility
export function debugLog(context: string, ...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔍 [${context}]`, ...args);
  }
}

// Specific debug utility for user interactions
export function debugUserAction(action: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`👆 User Action: ${action}`, data ? data : '');
  }
}

// Debug utility for form changes
export function debugFormChange(field: string, value: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`📝 Form Change: ${field} =`, value);
  }
}