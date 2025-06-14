import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../hooks/useTheme';

// Mock the useTheme hook
jest.mock('../hooks/useTheme');

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('ThemeToggle', () => {
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels for light mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to dark mode');
      expect(button).toHaveAttribute('title', 'Switch to dark mode');
    });

    it('should have proper ARIA labels for dark mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Switch to light mode');
      expect(button).toHaveAttribute('title', 'Switch to light mode');
    });

    it('should have screen reader text describing current theme', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const srText = screen.getByText(/Current theme: light/);
      expect(srText).toBeInTheDocument();
      expect(srText).toHaveClass('sr-only');
    });

    it('should be focusable and keyboard accessible', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Trigger click with Enter key
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      // Note: The actual keyboard event handling is delegated to the browser,
      // but we can test that the button is properly focusable
    });
  });

  describe('theme switching', () => {
    it('should call toggleTheme when clicked', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks correctly', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockToggleTheme).toHaveBeenCalledTimes(3);
    });
  });

  describe('visual appearance', () => {
    it('should render moon icon when in light mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      // Find SVG elements by their path data (more reliable than role)
      const moonIcon = screen.getByRole('button').querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.646"]');
      const sunIcon = screen.getByRole('button').querySelector('svg path[d*="M12 3v1m0 16v1m9-9h-1M4 12H3"]');
      
      expect(moonIcon).toBeInTheDocument();
      expect(sunIcon).toBeInTheDocument();

      // In light mode, moon icon should be visible (opacity-100) and sun should be hidden (opacity-0)
      const moonSvg = moonIcon?.closest('svg');
      const sunSvg = sunIcon?.closest('svg');
      
      expect(moonSvg).toHaveClass('opacity-100');
      expect(sunSvg).toHaveClass('opacity-0');

      // Check that the icons have proper aria-hidden attributes
      expect(moonSvg).toHaveAttribute('aria-hidden', 'true');
      expect(sunSvg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should render sun icon when in dark mode', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      // Find SVG elements by their path data
      const moonIcon = screen.getByRole('button').querySelector('svg path[d*="M20.354 15.354A9 9 0 018.646 3.646"]');
      const sunIcon = screen.getByRole('button').querySelector('svg path[d*="M12 3v1m0 16v1m9-9h-1M4 12H3"]');
      
      expect(moonIcon).toBeInTheDocument();
      expect(sunIcon).toBeInTheDocument();

      // In dark mode, sun icon should be visible (opacity-100) and moon should be hidden (opacity-0)
      const moonSvg = moonIcon?.closest('svg');
      const sunSvg = sunIcon?.closest('svg');
      
      expect(sunSvg).toHaveClass('opacity-100');
      expect(moonSvg).toHaveClass('opacity-0');

      // Both icons should have proper aria-hidden attributes
      expect(moonSvg).toHaveAttribute('aria-hidden', 'true');
      expect(sunSvg).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have proper CSS classes for styling', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const button = screen.getByRole('button');
      
      // Check for essential styling classes
      expect(button).toHaveClass('relative', 'p-2', 'rounded-lg', 'border');
      expect(button).toHaveClass('transition-all', 'duration-200', 'ease-in-out');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });

  describe('state management', () => {
    it('should reflect current theme state', () => {
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      render(<ThemeToggle />);

      const srText = screen.getByText(/Current theme: dark/);
      expect(srText).toBeInTheDocument();
    });

    it('should update when theme changes', () => {
      const { rerender } = render(<ThemeToggle />);

      // First render with light theme
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      rerender(<ThemeToggle />);

      expect(screen.getByText(/Current theme: light/)).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to dark mode');

      // Second render with dark theme
      mockUseTheme.mockReturnValue({
        theme: 'dark',
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      rerender(<ThemeToggle />);

      expect(screen.getByText(/Current theme: dark/)).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Switch to light mode');
    });
  });

  describe('error handling', () => {
    it('should handle undefined theme gracefully', () => {
      mockUseTheme.mockReturnValue({
        theme: undefined as any, // Simulate error state
        setTheme: jest.fn(),
        toggleTheme: mockToggleTheme,
      });

      // Should not throw error
      expect(() => render(<ThemeToggle />)).not.toThrow();
    });

    it('should handle missing toggleTheme function', () => {
      mockUseTheme.mockReturnValue({
        theme: 'light',
        setTheme: jest.fn(),
        toggleTheme: undefined as any,
      });

      render(<ThemeToggle />);
      const button = screen.getByRole('button');
      
      // Should not throw error when clicked
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });
}); 