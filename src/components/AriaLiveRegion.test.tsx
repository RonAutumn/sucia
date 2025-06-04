import React from 'react';
import { render, screen } from '@testing-library/react';
import AriaLiveRegion from './AriaLiveRegion';

describe('AriaLiveRegion', () => {
  test('renders with default props', () => {
    render(<AriaLiveRegion announcement="Test announcement" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    expect(liveRegion).toHaveClass('sr-only');
    expect(liveRegion).toHaveTextContent('Test announcement');
  });

  test('renders with assertive politeness', () => {
    render(<AriaLiveRegion announcement="Urgent message" politeness="assertive" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'assertive');
  });

  test('renders with atomic false', () => {
    render(<AriaLiveRegion announcement="Test" atomic={false} />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'false');
  });

  test('updates announcement text', () => {
    const { rerender } = render(<AriaLiveRegion announcement="First message" />);
    
    expect(screen.getByText('First message')).toBeInTheDocument();
    
    rerender(<AriaLiveRegion announcement="Second message" />);
    expect(screen.getByText('Second message')).toBeInTheDocument();
    expect(screen.queryByText('First message')).not.toBeInTheDocument();
  });

  test('renders empty announcement', () => {
    render(<AriaLiveRegion announcement="" />);
    
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toBeEmptyDOMElement();
  });
}); 