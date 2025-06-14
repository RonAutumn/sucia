// Authentication Lockout System
// Tracks failed attempts and implements 3-attempt lockout with 15-minute timeout

interface LockoutData {
  attempts: number;
  lockedUntil: number | null;
  lastAttempt: number;
}

// Configuration constants
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
const LOCKOUT_STORAGE_KEY = 'sucia_auth_lockout';

/**
 * Gets current lockout data from localStorage
 */
function getLockoutData(): LockoutData {
  try {
    const stored = localStorage.getItem(LOCKOUT_STORAGE_KEY);
    if (!stored) {
      return {
        attempts: 0,
        lockedUntil: null,
        lastAttempt: 0
      };
    }
    
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to retrieve lockout data:', error);
    return {
      attempts: 0,
      lockedUntil: null,
      lastAttempt: 0
    };
  }
}

/**
 * Stores lockout data to localStorage
 */
function storeLockoutData(data: LockoutData): void {
  try {
    localStorage.setItem(LOCKOUT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to store lockout data:', error);
  }
}

/**
 * Checks if account is currently locked out
 */
export function isLockedOut(): boolean {
  const data = getLockoutData();
  
  if (!data.lockedUntil) return false;
  
  const now = Date.now();
  if (now >= data.lockedUntil) {
    // Lockout has expired, clear it
    clearLockout();
    return false;
  }
  
  return true;
}

/**
 * Gets remaining lockout time in milliseconds
 */
export function getRemainingLockoutTime(): number {
  const data = getLockoutData();
  
  if (!data.lockedUntil) return 0;
  
  const now = Date.now();
  const remaining = data.lockedUntil - now;
  
  return Math.max(0, remaining);
}

/**
 * Gets formatted remaining lockout time string
 */
export function getFormattedLockoutTime(): string {
  const remaining = getRemainingLockoutTime();
  
  if (remaining === 0) return '';
  
  const minutes = Math.ceil(remaining / (60 * 1000));
  
  if (minutes === 1) return '1 minute';
  return `${minutes} minutes`;
}

/**
 * Records a failed authentication attempt
 */
export function recordFailedAttempt(): void {
  const data = getLockoutData();
  const now = Date.now();
  
  // If already locked out, don't increment attempts
  if (isLockedOut()) return;
  
  data.attempts += 1;
  data.lastAttempt = now;
  
  // If reached max attempts, trigger lockout
  if (data.attempts >= MAX_ATTEMPTS) {
    data.lockedUntil = now + LOCKOUT_DURATION;
  }
  
  storeLockoutData(data);
}

/**
 * Gets current number of failed attempts
 */
export function getFailedAttempts(): number {
  const data = getLockoutData();
  return data.attempts;
}

/**
 * Gets remaining attempts before lockout
 */
export function getRemainingAttempts(): number {
  const data = getLockoutData();
  return Math.max(0, MAX_ATTEMPTS - data.attempts);
}

/**
 * Clears failed attempts and lockout (called on successful authentication)
 */
export function clearLockout(): void {
  try {
    localStorage.removeItem(LOCKOUT_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear lockout data:', error);
  }
}

/**
 * Resets attempt counter while preserving lockout status
 */
export function resetAttempts(): void {
  const data = getLockoutData();
  data.attempts = 0;
  storeLockoutData(data);
}

/**
 * Checks if user can attempt authentication
 */
export function canAttemptAuth(): boolean {
  return !isLockedOut();
}

/**
 * Gets lockout status information for UI display
 */
export interface LockoutStatus {
  isLocked: boolean;
  remainingAttempts: number;
  lockoutTimeRemaining: string;
  lastAttemptTime: Date | null;
  maxAttemptsReached: boolean;
}

export function getLockoutStatus(): LockoutStatus {
  const data = getLockoutData();
  const isLocked = isLockedOut();
  const remainingAttempts = getRemainingAttempts();
  const lockoutTimeRemaining = getFormattedLockoutTime();
  const lastAttemptTime = data.lastAttempt ? new Date(data.lastAttempt) : null;
  const maxAttemptsReached = data.attempts >= MAX_ATTEMPTS;
  
  return {
    isLocked,
    remainingAttempts,
    lockoutTimeRemaining,
    lastAttemptTime,
    maxAttemptsReached
  };
}

/**
 * Forces an immediate lockout (for security purposes)
 */
export function forceLockout(): void {
  const data = getLockoutData();
  const now = Date.now();
  
  data.attempts = MAX_ATTEMPTS;
  data.lockedUntil = now + LOCKOUT_DURATION;
  data.lastAttempt = now;
  
  storeLockoutData(data);
}

/**
 * Gets time since last attempt in milliseconds
 */
export function getTimeSinceLastAttempt(): number {
  const data = getLockoutData();
  if (!data.lastAttempt) return 0;
  
  return Date.now() - data.lastAttempt;
}

/**
 * Checks if lockout data exists (user has attempted authentication before)
 */
export function hasAttemptHistory(): boolean {
  const data = getLockoutData();
  return data.attempts > 0 || data.lastAttempt > 0;
}

/**
 * Automatic cleanup of expired lockouts (called periodically)
 */
export function cleanupExpiredLockouts(): void {
  if (isLockedOut()) return; // Will automatically clear if expired
  
  const data = getLockoutData();
  if (data.lockedUntil && Date.now() >= data.lockedUntil) {
    clearLockout();
  }
}

// Auto-cleanup on module load
cleanupExpiredLockouts(); 