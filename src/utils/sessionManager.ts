// Session Manager for Cross-Tab Session Persistence
// Handles session synchronization across browser tabs and windows

import { hasValidToken, clearAuthToken, getStoredAuthToken, getTokenTimeRemaining } from './authToken';
import { clearLockout } from './authLockout';

// Event types for session management
export type SessionEvent = 'login' | 'logout' | 'token_refresh' | 'session_expired';

interface SessionEventDetail {
  type: SessionEvent;
  timestamp: number;
  sessionId?: string;
}

// Storage key for session events
const SESSION_EVENT_KEY = 'sucia_session_event';

// Session event listeners
const sessionListeners = new Set<(event: SessionEventDetail) => void>();

/**
 * Broadcasts a session event to all tabs
 */
export function broadcastSessionEvent(type: SessionEvent): void {
  const event: SessionEventDetail = {
    type,
    timestamp: Date.now(),
    sessionId: getStoredAuthToken()?.sessionId
  };

  try {
    // Use localStorage to communicate between tabs
    localStorage.setItem(SESSION_EVENT_KEY, JSON.stringify(event));
    
    // Remove immediately to trigger storage event
    localStorage.removeItem(SESSION_EVENT_KEY);
  } catch (error) {
    console.error('Failed to broadcast session event:', error);
  }

  // Notify local listeners
  sessionListeners.forEach(listener => {
    try {
      listener(event);
    } catch (error) {
      console.error('Error in session event listener:', error);
    }
  });
}

/**
 * Adds a listener for session events across tabs
 */
export function addSessionListener(listener: (event: SessionEventDetail) => void): () => void {
  sessionListeners.add(listener);

  // Return cleanup function
  return () => {
    sessionListeners.delete(listener);
  };
}

/**
 * Handles localStorage changes from other tabs
 */
function handleStorageChange(event: StorageEvent): void {
  if (event.key === SESSION_EVENT_KEY && event.newValue) {
    try {
      const sessionEvent: SessionEventDetail = JSON.parse(event.newValue);
      
      // Notify listeners
      sessionListeners.forEach(listener => {
        try {
          listener(sessionEvent);
        } catch (error) {
          console.error('Error in session event listener:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse session event:', error);
    }
  }
}

/**
 * Initializes session management
 */
export function initializeSessionManager(): () => void {
  // Listen for storage events (cross-tab communication)
  window.addEventListener('storage', handleStorageChange);

  // Set up periodic session validation
  const validationInterval = setInterval(() => {
    const wasValid = hasValidToken();
    
    if (!wasValid) {
      // Session expired, broadcast event
      broadcastSessionEvent('session_expired');
    }
  }, 30000); // Check every 30 seconds

  // Cleanup function
  return () => {
    window.removeEventListener('storage', handleStorageChange);
    clearInterval(validationInterval);
    sessionListeners.clear();
  };
}

/**
 * Handles user login across tabs
 */
export function handleLogin(): void {
  broadcastSessionEvent('login');
}

/**
 * Handles user logout across tabs
 */
export function handleLogout(): void {
  // Clear authentication data
  clearAuthToken();
  clearLockout();
  
  // Broadcast logout event
  broadcastSessionEvent('logout');
}

/**
 * Handles token refresh across tabs
 */
export function handleTokenRefresh(): void {
  broadcastSessionEvent('token_refresh');
}

/**
 * Gets current session status
 */
export interface SessionStatus {
  isAuthenticated: boolean;
  timeRemaining: number;
  sessionId: string | null;
  lastActivity: Date | null;
}

export function getSessionStatus(): SessionStatus {
  const token = getStoredAuthToken();
  const isAuthenticated = hasValidToken();
  const timeRemaining = getTokenTimeRemaining();
  
  return {
    isAuthenticated,
    timeRemaining,
    sessionId: token?.sessionId || null,
    lastActivity: token ? new Date(token.issuedAt) : null
  };
}

/**
 * Hook-like function for React components to use session management
 */
export function useSessionManager(onSessionEvent?: (event: SessionEventDetail) => void) {
  if (typeof window === 'undefined') return { cleanup: () => {} };

  // Add listener if provided
  const cleanup = onSessionEvent ? addSessionListener(onSessionEvent) : () => {};

  return { cleanup };
}

/**
 * Validates session on page visibility change
 */
export function initializeVisibilitySessionValidation(): () => void {
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      // Page became visible, validate session
      const isValid = hasValidToken();
      
      if (!isValid) {
        // Session invalid, broadcast event
        broadcastSessionEvent('session_expired');
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
}

/**
 * Emergency session cleanup (for security)
 */
export function emergencySessionCleanup(): void {
  try {
    clearAuthToken();
    clearLockout();
    
    // Clear all session storage
    sessionStorage.clear();
    
    // Remove session-related localStorage items
    const sessionKeys = Object.keys(localStorage).filter(key => 
      key.includes('sucia_') || key.includes('session')
    );
    
    sessionKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error(`Failed to remove ${key}:`, error);
      }
    });

    broadcastSessionEvent('logout');
  } catch (error) {
    console.error('Error during emergency session cleanup:', error);
  }
}

// Initialize session manager when module loads
let sessionCleanup: (() => void) | null = null;
let visibilityCleanup: (() => void) | null = null;

if (typeof window !== 'undefined') {
  sessionCleanup = initializeSessionManager();
  visibilityCleanup = initializeVisibilitySessionValidation();
}

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (sessionCleanup) sessionCleanup();
    if (visibilityCleanup) visibilityCleanup();
  });
} 