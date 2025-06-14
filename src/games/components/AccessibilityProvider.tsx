import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

interface AccessibilityContextType {
  announceToScreenReader: (message: string, priority?: 'polite' | 'assertive') => void;
  setFocusTrap: (element: HTMLElement | null) => void;
  clearFocusTrap: () => void;
  isReducedMotion: boolean;
  isHighContrast: boolean;
  increasedTextSize: boolean;
  setIncreasedTextSize: (increased: boolean) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [increasedTextSize, setIncreasedTextSize] = useState(false);
  const [focusTrapElement, setFocusTrapElement] = useState<HTMLElement | null>(null);
  
  const screenReaderRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  // Detect user preferences
  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    // Check for high contrast mode
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    setIsHighContrast(contrastQuery.matches);
    
    const handleContrastChange = (e: MediaQueryListEvent) => setIsHighContrast(e.matches);
    contrastQuery.addEventListener('change', handleContrastChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      contrastQuery.removeEventListener('change', handleContrastChange);
    };
  }, []);

  // Handle focus trap
  useEffect(() => {
    if (!focusTrapElement) return;

    previousActiveElement.current = document.activeElement;
    
    const focusableElements = focusTrapElement.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        clearFocusTrap();
      }
    };

    focusTrapElement.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Focus first element
    firstElement?.focus();

    return () => {
      focusTrapElement.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [focusTrapElement]);

  const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!screenReaderRef.current) return;

    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    screenReaderRef.current.appendChild(announcement);

    // Clean up after announcement
    setTimeout(() => {
      if (screenReaderRef.current?.contains(announcement)) {
        screenReaderRef.current.removeChild(announcement);
      }
    }, 1000);
  };

  const setFocusTrap = (element: HTMLElement | null) => {
    setFocusTrapElement(element);
  };

  const clearFocusTrap = () => {
    setFocusTrapElement(null);
    
    // Restore focus to previous element
    if (previousActiveElement.current instanceof HTMLElement) {
      previousActiveElement.current.focus();
    }
    previousActiveElement.current = null;
  };

  const contextValue: AccessibilityContextType = {
    announceToScreenReader,
    setFocusTrap,
    clearFocusTrap,
    isReducedMotion,
    isHighContrast,
    increasedTextSize,
    setIncreasedTextSize,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
      
      {/* Screen reader announcement region */}
      <div 
        ref={screenReaderRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />
      
      {/* Accessibility styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          .focus-visible:focus {
            outline: 2px solid #3b82f6;
            outline-offset: 2px;
          }
          
          @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
              scroll-behavior: auto !important;
            }
          }
          
          @media (prefers-contrast: high) {
            .bg-primary-600 {
              background-color: #000 !important;
            }
            
            .text-neutral-600 {
              color: #000 !important;
            }
            
            .border-neutral-200 {
              border-color: #000 !important;
            }
          }
          
          ${increasedTextSize ? `
            .text-xs { font-size: 0.875rem !important; }
            .text-sm { font-size: 1rem !important; }
            .text-base { font-size: 1.25rem !important; }
            .text-lg { font-size: 1.5rem !important; }
            .text-xl { font-size: 1.875rem !important; }
          ` : ''}
        `
      }} />
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = () => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}; 