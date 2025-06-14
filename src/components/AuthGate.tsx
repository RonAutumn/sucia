import React, { useState, useEffect } from 'react';
import AuthModal from './AuthModal';
import { hasValidToken, createAuthToken, storeAuthToken, refreshTokenIfNeeded } from '../utils/authToken';
import { canAttemptAuth } from '../utils/authLockout';
import { handleLogin, addSessionListener } from '../utils/sessionManager';

interface AuthGateProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  onAuthSuccess?: () => void;
  onAuthFailure?: () => void;
}

// Environment variable keys to check for admin password
const ADMIN_PASSWORD_KEYS = [
  'REACT_APP_ADMIN_PASSWORD',
  'VITE_ADMIN_PASSWORD',
  'ADMIN_PASSWORD'
];

// Fallback password (should be changed in production)
const FALLBACK_PASSWORD = 'admin123';

/**
 * Gets the admin password from environment variables
 */
function getAdminPassword(): string {
  // Check each possible environment variable
  for (const key of ADMIN_PASSWORD_KEYS) {
    const password = process.env[key];
    if (password && password.trim()) {
      return password.trim();
    }
  }
  
  // Use fallback if no environment variable is set
  console.warn('No admin password found in environment variables. Using fallback password.');
  return FALLBACK_PASSWORD;
}

/**
 * Validates a password against the configured admin password
 */
function validatePassword(inputPassword: string): boolean {
  const adminPassword = getAdminPassword();
  return inputPassword === adminPassword;
}

const AuthGate: React.FC<AuthGateProps> = ({
  children,
  title = "Admin Access Required",
  description = "Please enter the admin password to access this area.",
  onAuthSuccess,
  onAuthFailure
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check authentication status on mount and periodically
  useEffect(() => {
    const checkAuth = () => {
      const hasValid = hasValidToken();
      setIsAuthenticated(hasValid);
      
      if (!hasValid && canAttemptAuth()) {
        setShowModal(true);
      } else if (!hasValid && !canAttemptAuth()) {
        // User is locked out, show modal but it will be disabled
        setShowModal(true);
      }
      
      setIsInitialized(true);
    };

    // Initial check
    checkAuth();

    // Refresh token if needed
    refreshTokenIfNeeded();

    // Set up periodic token validation (every 30 seconds)
    const interval = setInterval(() => {
      const stillValid = hasValidToken();
      if (!stillValid && isAuthenticated) {
        // Token expired, require re-authentication
        setIsAuthenticated(false);
        setShowModal(true);
      } else if (stillValid && !isAuthenticated) {
        // Token became valid (maybe refreshed), update state
        setIsAuthenticated(true);
        setShowModal(false);
      }
      
      // Refresh token if needed
      refreshTokenIfNeeded();
    }, 30000);

    // Listen for session events from other tabs
    const removeSessionListener = addSessionListener((event) => {
      switch (event.type) {
        case 'login':
          // Another tab logged in, check our auth status
          const hasValid = hasValidToken();
          if (hasValid && !isAuthenticated) {
            setIsAuthenticated(true);
            setShowModal(false);
          }
          break;
        case 'logout':
          // Another tab logged out, update our state
          setIsAuthenticated(false);
          setShowModal(true);
          break;
        case 'session_expired':
          // Session expired, require re-authentication
          setIsAuthenticated(false);
          setShowModal(true);
          break;
      }
    });

    return () => {
      clearInterval(interval);
      removeSessionListener();
    };
  }, [isAuthenticated]);

  // Handle authentication attempt
  const handleAuthenticate = async (password: string): Promise<boolean> => {
    // Simulate small delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const isValid = validatePassword(password);
    
    if (isValid) {
      // Create and store new token
      const token = createAuthToken();
      storeAuthToken(token);
      
      // Update state
      setIsAuthenticated(true);
      setShowModal(false);
      
      // Broadcast login event to other tabs
      handleLogin();
      
      // Call success callback
      if (onAuthSuccess) {
        onAuthSuccess();
      }
      
      return true;
    } else {
      // Call failure callback
      if (onAuthFailure) {
        onAuthFailure();
      }
      
      return false;
    }
  };

  // Handle modal close (if allowed)
  const handleModalClose = () => {
    // Only allow closing if user can't attempt auth (is locked out)
    // or if there's no valid token and they can attempt auth
    if (!canAttemptAuth()) {
      setShowModal(false);
    }
    // If they can attempt auth but aren't authenticated, keep modal open
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50 dark:bg-neutral-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 dark:border-primary-400"></div>
        <span className="ml-4 text-lg text-neutral-700 dark:text-neutral-300">Checking authentication...</span>
      </div>
    );
  }

  // If authenticated, render children
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // If not authenticated, show modal and optionally a backdrop
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
      {/* Background content (optional) */}
      <div className="text-center p-8">
        <div className="max-w-md mx-auto">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900 rounded-full">
              <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">Secure Access</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-4">
              This area requires authentication to access.
            </p>
            {!canAttemptAuth() && (
              <div className="bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 rounded-md p-4">
                <p className="text-error-800 dark:text-error-300 text-sm">
                  Account temporarily locked due to multiple failed attempts.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showModal}
        onAuthenticate={handleAuthenticate}
        onClose={!canAttemptAuth() ? handleModalClose : undefined}
        title={title}
        description={description}
      />
    </div>
  );
};

export default AuthGate; 