// Authentication Token Management System
// Handles token generation, validation, storage, and cleanup with 24-hour expiration

interface AuthToken {
  token: string;
  issuedAt: number;
  expiresAt: number;
  sessionId: string;
}

interface StoredAuthData {
  authToken: AuthToken;
  lastActivity: number;
}

// Configuration constants
const TOKEN_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_KEY = 'sucia_auth_token';
const SESSION_STORAGE_KEY = 'sucia_session_id';

/**
 * Generates a simple encoded token with timestamp and session info
 */
function generateSecureToken(): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  const sessionPart = Math.random().toString(36).substring(2, 10);
  
  // Simple encoding (not cryptographically secure, but provides basic obfuscation)
  const tokenData = `${timestamp}:${randomPart}:${sessionPart}`;
  return btoa(tokenData).replace(/[+=]/g, ''); // Base64 encode and clean
}

/**
 * Generates a unique session ID
 */
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Creates a new authentication token with expiration
 */
export function createAuthToken(): AuthToken {
  const now = Date.now();
  const sessionId = generateSessionId();
  
  return {
    token: generateSecureToken(),
    issuedAt: now,
    expiresAt: now + TOKEN_DURATION,
    sessionId
  };
}

/**
 * Stores authentication token in localStorage
 */
export function storeAuthToken(authToken: AuthToken): void {
  try {
    const authData: StoredAuthData = {
      authToken,
      lastActivity: Date.now()
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
    sessionStorage.setItem(SESSION_STORAGE_KEY, authToken.sessionId);
  } catch (error) {
    console.error('Failed to store auth token:', error);
    throw new Error('Unable to store authentication data');
  }
}

/**
 * Retrieves authentication token from localStorage
 */
export function getStoredAuthToken(): AuthToken | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const authData: StoredAuthData = JSON.parse(stored);
    return authData.authToken;
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    clearAuthToken(); // Clear corrupted data
    return null;
  }
}

/**
 * Validates if a token is still valid (not expired)
 */
export function isTokenValid(token: AuthToken | null): boolean {
  if (!token) return false;
  
  const now = Date.now();
  return now < token.expiresAt && now >= token.issuedAt;
}

/**
 * Checks if current stored token is valid
 */
export function hasValidToken(): boolean {
  const token = getStoredAuthToken();
  return isTokenValid(token);
}

/**
 * Updates last activity timestamp for session management
 */
export function updateLastActivity(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    
    const authData: StoredAuthData = JSON.parse(stored);
    authData.lastActivity = Date.now();
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error('Failed to update last activity:', error);
  }
}

/**
 * Gets time remaining until token expires (in milliseconds)
 */
export function getTokenTimeRemaining(): number {
  const token = getStoredAuthToken();
  if (!token) return 0;
  
  return Math.max(0, token.expiresAt - Date.now());
}

/**
 * Gets formatted time remaining string
 */
export function getFormattedTimeRemaining(): string {
  const remaining = getTokenTimeRemaining();
  if (remaining === 0) return 'Expired';
  
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Refreshes token if it's close to expiration (within 1 hour)
 */
export function refreshTokenIfNeeded(): AuthToken | null {
  const token = getStoredAuthToken();
  if (!token) return null;
  
  const timeRemaining = getTokenTimeRemaining();
  const oneHour = 60 * 60 * 1000;
  
  // Refresh if less than 1 hour remaining
  if (timeRemaining > 0 && timeRemaining < oneHour) {
    const newToken = createAuthToken();
    storeAuthToken(newToken);
    return newToken;
  }
  
  return token;
}

/**
 * Clears all authentication data from storage
 */
export function clearAuthToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
}

/**
 * Gets current session ID
 */
export function getCurrentSessionId(): string | null {
  try {
    return sessionStorage.getItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to get session ID:', error);
    return null;
  }
}

/**
 * Validates if current session matches stored token
 */
export function isSessionValid(): boolean {
  const currentSessionId = getCurrentSessionId();
  const token = getStoredAuthToken();
  
  if (!currentSessionId || !token) return false;
  
  return currentSessionId === token.sessionId && isTokenValid(token);
}

/**
 * Cleanup expired tokens automatically
 */
export function cleanupExpiredTokens(): void {
  const token = getStoredAuthToken();
  if (token && !isTokenValid(token)) {
    clearAuthToken();
  }
}

// Auto-cleanup on module load
cleanupExpiredTokens(); 