import React from 'react';
import { render, screen } from '@testing-library/react';
import OfflineBanner from './OfflineBanner';

describe('OfflineBanner', () => {
  describe('Visibility Control', () => {
    test('renders when isVisible is true', () => {
      render(<OfflineBanner isVisible={true} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Offline; changes will sync when online')).toBeInTheDocument();
    });

    test('does not render when isVisible is false', () => {
      render(<OfflineBanner isVisible={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.queryByText('Offline; changes will sync when online')).not.toBeInTheDocument();
    });

    test('toggles visibility correctly', () => {
      const { rerender } = render(<OfflineBanner isVisible={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      
      rerender(<OfflineBanner isVisible={true} />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      
      rerender(<OfflineBanner isVisible={false} />);
      
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Content and Messaging', () => {
    test('displays default message when no custom message provided', () => {
      render(<OfflineBanner isVisible={true} />);
      
      expect(screen.getByText('Offline; changes will sync when online')).toBeInTheDocument();
    });

    test('displays custom message when provided', () => {
      const customMessage = 'Connection lost. Attempting to reconnect...';
      render(<OfflineBanner isVisible={true} message={customMessage} />);
      
      expect(screen.getByText(customMessage)).toBeInTheDocument();
      expect(screen.queryByText('Offline; changes will sync when online')).not.toBeInTheDocument();
    });

    test('displays empty message when provided', () => {
      render(<OfflineBanner isVisible={true} message="" />);
      
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.queryByText('Offline; changes will sync when online')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility Features', () => {
    test('has proper ARIA attributes', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveAttribute('aria-live', 'assertive');
      expect(banner).toHaveAttribute('aria-atomic', 'true');
    });

    test('uses alert role for screen readers', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toBeInTheDocument();
    });

    test('icons are hidden from screen readers', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const svgElements = screen.getByRole('alert').querySelectorAll('svg');
      svgElements.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Styling and Layout', () => {
    test('has correct default styling classes', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass('fixed', 'top-0', 'left-0', 'right-0', 'z-50');
      expect(banner).toHaveClass('bg-yellow-600', 'text-white');
      expect(banner).toHaveClass('transform', 'transition-transform', 'duration-300');
    });

    test('applies custom className when provided', () => {
      const customClass = 'custom-banner-style';
      render(<OfflineBanner isVisible={true} className={customClass} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass(customClass);
    });

    test('combines default and custom classNames', () => {
      const customClass = 'border-2 border-red-500';
      render(<OfflineBanner isVisible={true} className={customClass} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass('fixed', 'top-0', 'bg-yellow-600');
      expect(banner).toHaveClass('border-2', 'border-red-500');
    });

    test('has proper positioning and z-index for overlay', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass('fixed', 'z-50');
    });
  });

  describe('Content Structure', () => {
    test('renders warning icon', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const warningIcon = banner.querySelector('svg:first-child');
      expect(warningIcon).toBeInTheDocument();
      expect(warningIcon).toHaveClass('text-yellow-200');
    });

    test('renders network/wifi icon', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const networkIcon = banner.querySelector('svg:last-child');
      expect(networkIcon).toBeInTheDocument();
      expect(networkIcon).toHaveClass('text-yellow-200');
    });

    test('centers content properly', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const contentContainer = banner.querySelector('.flex.items-center.justify-center');
      expect(contentContainer).toBeInTheDocument();
      expect(contentContainer).toHaveClass('max-w-7xl', 'mx-auto');
    });

    test('message has proper styling', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const message = screen.getByText('Offline; changes will sync when online');
      expect(message).toHaveClass('text-sm', 'font-medium', 'text-center');
    });
  });

  describe('Icon Accessibility', () => {
    test('all icons have aria-hidden attribute', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const allSvgs = banner.querySelectorAll('svg');
      
      expect(allSvgs).toHaveLength(2);
      allSvgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    test('icons do not interfere with screen reader text', () => {
      render(<OfflineBanner isVisible={true} />);
      
      // The alert should only contain the text message for screen readers
      const banner = screen.getByRole('alert');
      expect(banner).toHaveTextContent('Offline; changes will sync when online');
      
      // Icons should be decorative only
      const svgs = banner.querySelectorAll('svg');
      svgs.forEach(svg => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Responsive Design', () => {
    test('has responsive container with max-width', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const container = banner.querySelector('.max-w-7xl');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('mx-auto');
    });

    test('has proper padding for mobile and desktop', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass('px-4', 'py-3');
    });

    test('icons are properly sized and spaced', () => {
      render(<OfflineBanner isVisible={true} />);
      
      const banner = screen.getByRole('alert');
      const firstIcon = banner.querySelector('svg:first-child');
      const lastIcon = banner.querySelector('svg:last-child');
      
      expect(firstIcon).toHaveClass('h-5', 'w-5', 'mr-3', 'flex-shrink-0');
      expect(lastIcon).toHaveClass('h-5', 'w-5', 'ml-3', 'flex-shrink-0');
    });
  });

  describe('Edge Cases', () => {
    test('handles very long custom messages', () => {
      const longMessage = 'This is a very long offline message that might wrap to multiple lines on smaller screens and should still be properly displayed with good visual hierarchy and readable typography patterns throughout the entire banner component.';
      
      render(<OfflineBanner isVisible={true} message={longMessage} />);
      
      expect(screen.getByText(longMessage)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    test('handles special characters in message', () => {
      const specialMessage = 'Connection lost! @#$%^&*()_+ 🌐 Please check your network.';
      
      render(<OfflineBanner isVisible={true} message={specialMessage} />);
      
      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    test('handles null/undefined className gracefully', () => {
      render(<OfflineBanner isVisible={true} className={undefined} />);
      
      const banner = screen.getByRole('alert');
      expect(banner).toHaveClass('fixed', 'top-0', 'bg-yellow-600');
    });
  });
}); 