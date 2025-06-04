import React from 'react';
import { render, screen } from '@testing-library/react';
import CheckInCounter from './CheckInCounter';

describe('CheckInCounter', () => {
  test('renders check-in status with correct counts', () => {
    render(<CheckInCounter checkedInCount={5} totalCount={10} />);
    
    expect(screen.getByText('Check-in Status')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('/ 10 checked in')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  test('handles zero total count', () => {
    render(<CheckInCounter checkedInCount={0} totalCount={0} />);
    
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('/ 0 checked in')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('applies correct color classes based on percentage', () => {
    const { rerender } = render(<CheckInCounter checkedInCount={8} totalCount={10} />);
    expect(document.querySelector('.bg-green-50')).toBeInTheDocument();

    rerender(<CheckInCounter checkedInCount={6} totalCount={10} />);
    expect(document.querySelector('.bg-blue-50')).toBeInTheDocument();

    rerender(<CheckInCounter checkedInCount={3} totalCount={10} />);
    expect(document.querySelector('.bg-yellow-50')).toBeInTheDocument();

    rerender(<CheckInCounter checkedInCount={1} totalCount={10} />);
    expect(document.querySelector('.bg-gray-50')).toBeInTheDocument();
  });

  test('accepts and applies custom className', () => {
    render(<CheckInCounter checkedInCount={5} totalCount={10} className="custom-class" />);
    expect(document.querySelector('.custom-class')).toBeInTheDocument();
  });
}); 