import React, { useState, useEffect, useRef } from 'react';
import { getLockoutStatus, canAttemptAuth, recordFailedAttempt, clearLockout } from '../utils/authLockout';
import type { LockoutStatus } from '../utils/authLockout';

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (password: string) => Promise<boolean>;
  onClose?: () => void;
  title?: string;
  description?: string;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onAuthenticate,
  onClose,
  title = "Authentication Required",
  description = "Please enter your password to access this area."
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutStatus, setLockoutStatus] = useState<LockoutStatus>(() => getLockoutStatus());
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Update lockout status periodically
  useEffect(() => {
    if (!isOpen) return;

    const updateStatus = () => {
      setLockoutStatus(getLockoutStatus());
    };

    // Initial update
    updateStatus();

    // Update every second while locked out
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (isOpen && passwordInputRef.current && canAttemptAuth()) {
      passwordInputRef.current.focus();
    }
  }, [isOpen, lockoutStatus.isLocked]);

  // Keyboard event handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && onClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Trap focus within modal
  useEffect(() => {
    if (!isOpen) return;

    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => document.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!canAttemptAuth()) {
      setError('Account is temporarily locked. Please wait before trying again.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await onAuthenticate(password);
      
      if (isValid) {
        // Success - clear lockout and reset form
        clearLockout();
        setPassword('');
        setError('');
        // Modal will be closed by parent component
      } else {
        // Failed authentication
        recordFailedAttempt();
        setLockoutStatus(getLockoutStatus());
        setPassword('');
        
        const newStatus = getLockoutStatus();
        if (newStatus.isLocked) {
          setError(`Too many failed attempts. Account locked for ${newStatus.lockoutTimeRemaining}.`);
        } else {
          setError(`Invalid password. ${newStatus.remainingAttempts} attempt${newStatus.remainingAttempts !== 1 ? 's' : ''} remaining.`);
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setError('An error occurred during authentication. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    if (error && !lockoutStatus.isLocked) {
      setError(''); // Clear error when user starts typing (unless locked out)
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      aria-describedby="auth-modal-description"
    >
      <div 
        ref={modalRef}
        className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 rounded"
            aria-label="Close authentication modal"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Header */}
        <div className="mb-6">
          <h2 id="auth-modal-title" className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
            {title}
          </h2>
          <p id="auth-modal-description" className="text-neutral-600 dark:text-neutral-400">
            {description}
          </p>
        </div>

        {/* Lockout status display */}
        {lockoutStatus.isLocked && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-red-800 font-medium">Account Temporarily Locked</span>
            </div>
            <p className="text-red-700 mt-1">
              Too many failed attempts. Please wait {lockoutStatus.lockoutTimeRemaining} before trying again.
            </p>
          </div>
        )}

        {/* Authentication form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              ref={passwordInputRef}
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading || lockoutStatus.isLocked}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Enter your password"
              autoComplete="current-password"
              aria-describedby={error ? "password-error" : undefined}
            />
          </div>

          {/* Error message */}
          {error && (
            <div id="password-error" className="text-red-600 text-sm flex items-start" role="alert">
              <svg className="w-4 h-4 text-red-500 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Attempt counter */}
          {!lockoutStatus.isLocked && lockoutStatus.remainingAttempts < 3 && lockoutStatus.remainingAttempts > 0 && (
            <div className="text-amber-600 text-sm flex items-center">
              <svg className="w-4 h-4 text-amber-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>
                {lockoutStatus.remainingAttempts} attempt{lockoutStatus.remainingAttempts !== 1 ? 's' : ''} remaining
              </span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading || lockoutStatus.isLocked || !password.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Authenticating...
              </span>
            ) : lockoutStatus.isLocked ? (
              'Account Locked'
            ) : (
              'Authenticate'
            )}
          </button>
        </form>

        {/* Additional info */}
        {!lockoutStatus.isLocked && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-500">
              Secure access to protected areas
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal; 