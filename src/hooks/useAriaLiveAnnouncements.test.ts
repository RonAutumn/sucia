import { renderHook, act } from '@testing-library/react';
import { useAriaLiveAnnouncements } from './useAriaLiveAnnouncements';

// Mock setTimeout and clearTimeout
jest.useFakeTimers();

describe('useAriaLiveAnnouncements', () => {
  afterEach(() => {
    jest.clearAllTimers();
  });

  test('initializes with empty announcement', () => {
    const { result } = renderHook(() => useAriaLiveAnnouncements());
    
    expect(result.current.announcement).toBe('');
  });

  test('announces a message after timeout', () => {
    const { result } = renderHook(() => useAriaLiveAnnouncements());
    
    act(() => {
      result.current.announce('Test message');
    });

    // Initially announcement should be cleared
    expect(result.current.announcement).toBe('');

    // Fast-forward the timer
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.announcement).toBe('Test message');
  });

  test('clears announcement', () => {
    const { result } = renderHook(() => useAriaLiveAnnouncements());
    
    act(() => {
      result.current.announce('Test message');
      jest.advanceTimersByTime(100);
    });

    expect(result.current.announcement).toBe('Test message');

    act(() => {
      result.current.clearAnnouncement();
    });

    expect(result.current.announcement).toBe('');
  });

  test('replaces previous announcement', () => {
    const { result } = renderHook(() => useAriaLiveAnnouncements());
    
    act(() => {
      result.current.announce('First message');
      jest.advanceTimersByTime(100);
    });

    expect(result.current.announcement).toBe('First message');

    act(() => {
      result.current.announce('Second message');
    });

    // Should clear first
    expect(result.current.announcement).toBe('');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(result.current.announcement).toBe('Second message');
  });

  test('handles multiple rapid announcements', () => {
    const { result } = renderHook(() => useAriaLiveAnnouncements());
    
    act(() => {
      result.current.announce('Message 1');
      result.current.announce('Message 2');
      result.current.announce('Message 3');
    });

    // Should be cleared during the announcement process
    expect(result.current.announcement).toBe('');

    act(() => {
      jest.advanceTimersByTime(100);
    });

    // Should show the last message
    expect(result.current.announcement).toBe('Message 3');
  });
}); 