import React, { createContext, useContext, useEffect, useState } from 'react';

interface ScreenSize {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLandscape: boolean;
  isPortrait: boolean;
}

interface ResponsiveContextType extends ScreenSize {
  touchDevice: boolean;
  isSafeMobile: boolean; // Safe area aware
  bottomSheetSupported: boolean;
}

const ResponsiveContext = createContext<ResponsiveContextType | undefined>(undefined);

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  const [screenSize, setScreenSize] = useState<ScreenSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLandscape: false,
    isPortrait: false,
  });

  const [touchDevice, setTouchDevice] = useState(false);

  useEffect(() => {
    const updateScreenSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const isMobile = width < 768;
      const isTablet = width >= 768 && width < 1024;
      const isDesktop = width >= 1024;
      const isLandscape = width > height;
      const isPortrait = height > width;

      setScreenSize({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        isLandscape,
        isPortrait,
      });
    };

    const detectTouchDevice = () => {
      setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    updateScreenSize();
    detectTouchDevice();

    const handleResize = () => {
      updateScreenSize();
    };

    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(updateScreenSize, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  const contextValue: ResponsiveContextType = {
    ...screenSize,
    touchDevice,
    isSafeMobile: screenSize.isMobile && touchDevice,
    bottomSheetSupported: screenSize.isMobile && touchDevice,
  };

  return (
    <ResponsiveContext.Provider value={contextValue}>
      <div 
        className={`responsive-layout ${className}`}
        style={{
          // CSS custom properties for dynamic styling
          '--screen-width': `${screenSize.width}px`,
          '--screen-height': `${screenSize.height}px`,
          '--safe-area-inset-top': 'env(safe-area-inset-top)',
          '--safe-area-inset-bottom': 'env(safe-area-inset-bottom)',
          '--safe-area-inset-left': 'env(safe-area-inset-left)',
          '--safe-area-inset-right': 'env(safe-area-inset-right)',
        } as React.CSSProperties}
      >
        {children}
        
        {/* Dynamic CSS based on screen size */}
        <style dangerouslySetInnerHTML={{
          __html: `
            .responsive-layout {
              ${screenSize.isMobile ? `
                /* Mobile-specific styles */
                --container-padding: 1rem;
                --button-min-height: 44px;
                --touch-target-size: 44px;
              ` : screenSize.isTablet ? `
                /* Tablet-specific styles */
                --container-padding: 1.5rem;
                --button-min-height: 40px;
                --touch-target-size: 40px;
              ` : `
                /* Desktop-specific styles */
                --container-padding: 2rem;
                --button-min-height: 36px;
                --touch-target-size: 36px;
              `}
            }
            
            /* Mobile-first responsive utilities */
            .mobile-only {
              display: ${screenSize.isMobile ? 'block' : 'none'};
            }
            
            .tablet-only {
              display: ${screenSize.isTablet ? 'block' : 'none'};
            }
            
            .desktop-only {
              display: ${screenSize.isDesktop ? 'block' : 'none'};
            }
            
            .mobile-up {
              display: ${screenSize.isMobile || screenSize.isTablet || screenSize.isDesktop ? 'block' : 'none'};
            }
            
            .tablet-up {
              display: ${screenSize.isTablet || screenSize.isDesktop ? 'block' : 'none'};
            }
            
            /* Touch-friendly styles */
            ${touchDevice ? `
              .touch-target {
                min-height: var(--touch-target-size);
                min-width: var(--touch-target-size);
              }
              
              .button-touch {
                min-height: var(--button-min-height);
                padding: 0.75rem 1.5rem;
              }
              
              /* Larger hit areas for mobile */
              button, .clickable {
                min-height: var(--touch-target-size);
              }
            ` : ''}
            
            /* Safe area support for mobile devices */
            ${screenSize.isMobile ? `
              .safe-top {
                padding-top: calc(var(--safe-area-inset-top, 0px) + 1rem);
              }
              
              .safe-bottom {
                padding-bottom: calc(var(--safe-area-inset-bottom, 0px) + 1rem);
              }
              
              .safe-left {
                padding-left: calc(var(--safe-area-inset-left, 0px) + 1rem);
              }
              
              .safe-right {
                padding-right: calc(var(--safe-area-inset-right, 0px) + 1rem);
              }
              
              .safe-area {
                padding-top: var(--safe-area-inset-top, 0px);
                padding-bottom: var(--safe-area-inset-bottom, 0px);
                padding-left: var(--safe-area-inset-left, 0px);
                padding-right: var(--safe-area-inset-right, 0px);
              }
            ` : ''}
            
            /* Orientation-specific styles */
            ${screenSize.isLandscape && screenSize.isMobile ? `
              .mobile-landscape-hidden {
                display: none;
              }
              
              .mobile-landscape-compact {
                padding: 0.5rem;
              }
            ` : ''}
            
            /* Container queries simulation */
            .container-responsive {
              ${screenSize.width < 640 ? `
                --cols: 1;
                --gap: 0.5rem;
              ` : screenSize.width < 1024 ? `
                --cols: 2;
                --gap: 1rem;
              ` : `
                --cols: 3;
                --gap: 1.5rem;
              `}
            }
            
            /* Grid system for different screen sizes */
            .responsive-grid {
              display: grid;
              gap: var(--gap, 1rem);
              grid-template-columns: repeat(var(--cols, 1), 1fr);
            }
            
            /* Modal positioning for different screen sizes */
            .modal-responsive {
              ${screenSize.isMobile ? `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                border-radius: 1rem 1rem 0 0;
                max-height: 80vh;
              ` : `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                border-radius: 0.5rem;
                max-width: 32rem;
                width: 90%;
              `}
            }
            
            /* Scroll behavior for mobile */
            ${screenSize.isMobile ? `
              .mobile-scroll {
                -webkit-overflow-scrolling: touch;
                scroll-behavior: smooth;
              }
              
              /* Prevent zoom on input focus */
              input, textarea, select {
                font-size: 16px;
              }
            ` : ''}
          `
        }} />
      </div>
    </ResponsiveContext.Provider>
  );
};

export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (context === undefined) {
    throw new Error('useResponsive must be used within a ResponsiveLayout');
  }
  return context;
};

// Utility component for conditional rendering based on screen size
interface ResponsiveShowProps {
  mobile?: boolean;
  tablet?: boolean;
  desktop?: boolean;
  mobileUp?: boolean;
  tabletUp?: boolean;
  children: React.ReactNode;
}

export const ResponsiveShow: React.FC<ResponsiveShowProps> = ({
  mobile = false,
  tablet = false,
  desktop = false,
  mobileUp = false,
  tabletUp = false,
  children,
}) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  const shouldShow = 
    (mobile && isMobile) ||
    (tablet && isTablet) ||
    (desktop && isDesktop) ||
    (mobileUp && (isMobile || isTablet || isDesktop)) ||
    (tabletUp && (isTablet || isDesktop));

  return shouldShow ? <>{children}</> : null;
};

// Utility component for responsive containers
interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  enableSafeArea?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  enableSafeArea = false,
  maxWidth = 'lg',
}) => {
  const { isMobile } = useResponsive();

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={`
        w-full mx-auto px-4
        ${maxWidthClasses[maxWidth]}
        ${enableSafeArea && isMobile ? 'safe-area' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  );
}; 