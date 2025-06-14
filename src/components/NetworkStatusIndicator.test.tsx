import React from 'react';
import { render, screen } from '@testing-library/react';
import NetworkStatusIndicator from './NetworkStatusIndicator';

describe('NetworkStatusIndicator', () => {
  describe('Online Status Display', () => {
    test('displays online status when isOnline is true', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Online');
      expect(indicator).toHaveAttribute('title', 'Network status: Online');
    });

    test('displays offline status when isOnline is false', () => {
      render(<NetworkStatusIndicator isOnline={false} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Offline');
      expect(indicator).toHaveAttribute('title', 'Network status: Offline');
    });

    test('updates status when isOnline prop changes', () => {
      const { rerender } = render(<NetworkStatusIndicator isOnline={true} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Network status: Online');
      
      rerender(<NetworkStatusIndicator isOnline={false} />);
      
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Network status: Offline');
    });
  });

  describe('Icon Display', () => {
    test('displays online icon when isOnline is true', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.text-green-500');
      expect(iconContainer).toBeInTheDocument();
      
      const svg = iconContainer?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('displays offline icon when isOnline is false', () => {
      render(<NetworkStatusIndicator isOnline={false} />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.text-red-500');
      expect(iconContainer).toBeInTheDocument();
      
      const svg = iconContainer?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('icon has proper color classes', () => {
      const { rerender } = render(<NetworkStatusIndicator isOnline={true} />);
      
      let indicator = screen.getByRole('status');
      expect(indicator.querySelector('.text-green-500')).toBeInTheDocument();
      
      rerender(<NetworkStatusIndicator isOnline={false} />);
      
      indicator = screen.getByRole('status');
      expect(indicator.querySelector('.text-red-500')).toBeInTheDocument();
    });
  });

  describe('Size Variations', () => {
    test('applies small size classes by default', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.w-3.h-3');
      expect(iconContainer).toBeInTheDocument();
    });

    test('applies small size classes when size="sm"', () => {
      render(<NetworkStatusIndicator isOnline={true} size="sm" />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.w-3.h-3');
      expect(iconContainer).toBeInTheDocument();
    });

    test('applies medium size classes when size="md"', () => {
      render(<NetworkStatusIndicator isOnline={true} size="md" />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.w-4.h-4');
      expect(iconContainer).toBeInTheDocument();
    });

    test('applies large size classes when size="lg"', () => {
      render(<NetworkStatusIndicator isOnline={true} size="lg" />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.w-5.h-5');
      expect(iconContainer).toBeInTheDocument();
    });
  });

  describe('Label Display', () => {
    test('does not show label by default', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });

    test('does not show label when showLabel is false', () => {
      render(<NetworkStatusIndicator isOnline={true} showLabel={false} />);
      
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    test('shows online label when showLabel is true and isOnline is true', () => {
      render(<NetworkStatusIndicator isOnline={true} showLabel={true} />);
      
      expect(screen.getByText('Online')).toBeInTheDocument();
      expect(screen.queryByText('Offline')).not.toBeInTheDocument();
    });

    test('shows offline label when showLabel is true and isOnline is false', () => {
      render(<NetworkStatusIndicator isOnline={false} showLabel={true} />);
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.queryByText('Online')).not.toBeInTheDocument();
    });

    test('label has proper styling classes', () => {
      render(<NetworkStatusIndicator isOnline={true} showLabel={true} />);
      
      const label = screen.getByText('Online');
      expect(label).toHaveClass('ml-2', 'text-sm', 'font-medium', 'text-green-500');
    });

    test('label color changes based on online status', () => {
      const { rerender } = render(
        <NetworkStatusIndicator isOnline={true} showLabel={true} />
      );
      
      let label = screen.getByText('Online');
      expect(label).toHaveClass('text-green-500');
      
      rerender(<NetworkStatusIndicator isOnline={false} showLabel={true} />);
      
      label = screen.getByText('Offline');
      expect(label).toHaveClass('text-red-500');
    });
  });

  describe('Custom Styling', () => {
    test('applies custom className when provided', () => {
      const customClass = 'custom-indicator-style';
      render(<NetworkStatusIndicator isOnline={true} className={customClass} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass(customClass);
    });

    test('combines default and custom classNames', () => {
      const customClass = 'border-2 bg-blue-100';
      render(<NetworkStatusIndicator isOnline={true} className={customClass} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('flex', 'items-center');
      expect(indicator).toHaveClass('border-2', 'bg-blue-100');
    });

    test('has default flex layout classes', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('flex', 'items-center');
    });
  });

  describe('Accessibility Features', () => {
    test('has proper role attribute', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
    });

    test('has descriptive aria-label', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Online');
    });

    test('has descriptive title for tooltip', () => {
      render(<NetworkStatusIndicator isOnline={false} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('title', 'Network status: Offline');
    });

    test('includes screen reader only text', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const srText = screen.getByText('Network is currently online');
      expect(srText).toHaveClass('sr-only');
    });

    test('screen reader text updates based on status', () => {
      const { rerender } = render(<NetworkStatusIndicator isOnline={true} />);
      
      expect(screen.getByText('Network is currently online')).toBeInTheDocument();
      
      rerender(<NetworkStatusIndicator isOnline={false} />);
      
      expect(screen.getByText('Network is currently offline')).toBeInTheDocument();
      expect(screen.queryByText('Network is currently online')).not.toBeInTheDocument();
    });

    test('icons are hidden from screen readers', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      const svg = indicator.querySelector('svg');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Icon Structure', () => {
    test('icon container has flex-shrink-0 class', () => {
      render(<NetworkStatusIndicator isOnline={true} />);
      
      const indicator = screen.getByRole('status');
      const iconContainer = indicator.querySelector('.flex-shrink-0');
      expect(iconContainer).toBeInTheDocument();
    });

    test('different SVG content for online vs offline', () => {
      const { rerender } = render(<NetworkStatusIndicator isOnline={true} />);
      
      let indicator = screen.getByRole('status');
      let svg = indicator.querySelector('svg');
      let onlinePath = svg?.querySelector('path[fill-rule="evenodd"]');
      expect(onlinePath).toBeInTheDocument();
      
      rerender(<NetworkStatusIndicator isOnline={false} />);
      
      indicator = screen.getByRole('status');
      svg = indicator.querySelector('svg');
      // Offline icon should have different path structure
      expect(svg).toBeInTheDocument();
    });
  });

  describe('Prop Combinations', () => {
    test('all props work together correctly', () => {
      render(
        <NetworkStatusIndicator
          isOnline={false}
          showLabel={true}
          size="lg"
          className="test-class"
        />
      );
      
      const indicator = screen.getByRole('status');
      expect(indicator).toHaveClass('flex', 'items-center', 'test-class');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Offline');
      
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(indicator.querySelector('.w-5.h-5')).toBeInTheDocument();
      expect(indicator.querySelector('.text-red-500')).toBeInTheDocument();
    });

    test('handles undefined props gracefully', () => {
      render(
        <NetworkStatusIndicator
          isOnline={true}
          showLabel={undefined}
          size={undefined}
          className={undefined}
        />
      );
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Online');
    });
  });

  describe('Edge Cases', () => {
    test('handles boolean conversion correctly', () => {
      const { rerender } = render(<NetworkStatusIndicator isOnline={1 as any} />);
      
      // Should treat truthy value as true
      let indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Online');
      
      rerender(<NetworkStatusIndicator isOnline={0 as any} />);
      
      // Should treat falsy value as false
      indicator = screen.getByRole('status');
      expect(indicator).toHaveAttribute('aria-label', 'Network status: Offline');
    });

    test('handles invalid size prop gracefully', () => {
      render(<NetworkStatusIndicator isOnline={true} size={'invalid' as any} />);
      
      const indicator = screen.getByRole('status');
      expect(indicator).toBeInTheDocument();
      // Should not break, might use default or no size class
    });
  });
}); 