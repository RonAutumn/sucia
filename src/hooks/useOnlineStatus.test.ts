import { renderHook, act } from '@testing-library/react';
import { useOnlineStatus } from './useOnlineStatus';

// Mock navigator.onLine
const mockNavigator = {
  onLine: true,
};

Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true,
});

// Mock addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  value: mockAddEventListener,
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: mockRemoveEventListener,
  writable: true,
});

describe('useOnlineStatus', () => {
  beforeEach(() => {
    mockNavigator.onLine = true;
    mockAddEventListener.mockClear();
    mockRemoveEventListener.mockClear();
  });

  describe('Initial State', () => {
    test('returns true when navigator.onLine is true', () => {
      mockNavigator.onLine = true;
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(true);
    });

    test('returns false when navigator.onLine is false', () => {
      mockNavigator.onLine = false;
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(false);
    });

    test('defaults to true in server environment', () => {
      const originalWindow = window;
      const originalNavigator = window.navigator;
      
      // Remove both window and navigator to simulate server environment
      delete (global as any).window;
      delete (global as any).navigator;
      
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(true);
      
      // Restore window and navigator
      (global as any).window = originalWindow;
      (global as any).navigator = originalNavigator;
    });
  });

  describe('Event Listeners', () => {
    test('registers online and offline event listeners on mount', () => {
      renderHook(() => useOnlineStatus());
      
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);
    });

    test('removes event listeners on unmount', () => {
      const { unmount } = renderHook(() => useOnlineStatus());
      
      unmount();
      
      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
    });

    test('does not register listeners in server environment', () => {
      const originalWindow = window;
      const originalNavigator = window.navigator;
      
      // Remove both window and navigator to simulate server environment
      delete (global as any).window;
      delete (global as any).navigator;
      
      renderHook(() => useOnlineStatus());
      
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      // Restore window and navigator
      (global as any).window = originalWindow;
      (global as any).navigator = originalNavigator;
    });
  });

  describe('Online/Offline Events', () => {
    test('updates to true when online event is fired', () => {
      mockNavigator.onLine = false;
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(false);
      
      // Get the online event handler
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      
      if (onlineHandler) {
        act(() => {
          onlineHandler();
        });
      }
      
      expect(result.current).toBe(true);
    });

    test('updates to false when offline event is fired', () => {
      mockNavigator.onLine = true;
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(true);
      
      // Get the offline event handler
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      if (offlineHandler) {
        act(() => {
          offlineHandler();
        });
      }
      
      expect(result.current).toBe(false);
    });

    test('handles multiple online/offline transitions', () => {
      const { result } = renderHook(() => useOnlineStatus());
      
      // Get event handlers
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1];
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1];
      
      // Initial state should be true
      expect(result.current).toBe(true);
      
      // Go offline
      if (offlineHandler) {
        act(() => {
          offlineHandler();
        });
      }
      expect(result.current).toBe(false);
      
      // Go back online
      if (onlineHandler) {
        act(() => {
          onlineHandler();
        });
      }
      expect(result.current).toBe(true);
      
      // Go offline again
      if (offlineHandler) {
        act(() => {
          offlineHandler();
        });
      }
      expect(result.current).toBe(false);
    });
  });

  describe('Navigator State Sync', () => {
    test('syncs with navigator.onLine on mount', () => {
      mockNavigator.onLine = false;
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(false);
    });

    test('reflects current navigator.onLine state when initially mounted', () => {
      mockNavigator.onLine = true;
      const { result: result1 } = renderHook(() => useOnlineStatus());
      expect(result1.current).toBe(true);
      
      mockNavigator.onLine = false;
      const { result: result2 } = renderHook(() => useOnlineStatus());
      expect(result2.current).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    test('handles missing navigator gracefully', () => {
      const originalNavigator = window.navigator;
      delete (window as any).navigator;
      
      const { result } = renderHook(() => useOnlineStatus());
      
      expect(result.current).toBe(true);
      expect(mockAddEventListener).not.toHaveBeenCalled();
      
      // Restore navigator
      window.navigator = originalNavigator;
    });

    test('handles missing window gracefully', () => {
      const originalWindow = window;
      const originalNavigator = window.navigator;
      
      delete (global as any).window;
      delete (global as any).navigator;
      
      expect(() => {
        renderHook(() => useOnlineStatus());
      }).not.toThrow();
      
      // Restore window and navigator
      (global as any).window = originalWindow;
      (global as any).navigator = originalNavigator;
    });
  });
}); 