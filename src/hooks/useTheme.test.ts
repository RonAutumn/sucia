import { renderHook, act } from '@testing-library/react';
import { useTheme } from './useTheme';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock matchMedia
const mockMatchMedia = jest.fn();

// Mock document.documentElement
const mockDocumentElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
  },
};

describe('useTheme', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    // Setup matchMedia mock
    Object.defineProperty(window, 'matchMedia', {
      value: mockMatchMedia,
      writable: true,
    });

    // Setup document.documentElement mock
    Object.defineProperty(document, 'documentElement', {
      value: mockDocumentElement,
      writable: true,
    });

    // Default matchMedia implementation
    mockMatchMedia.mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));
  });

  describe('initialization', () => {
    it('should default to light theme when no stored value exists and system prefers light', () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockMatchMedia.mockImplementation((query) => ({
        matches: false, // System prefers light
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');
      expect(localStorageMock.getItem).toHaveBeenCalledWith('sucia-theme');
    });

    it('should use stored theme preference', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('should fallback to system preference when no stored value exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      mockMatchMedia.mockImplementation((query) => ({
        matches: true, // System prefers dark
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('dark');
    });

    it('should apply correct DOM classes on initialization', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      renderHook(() => useTheme());

      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
    });
  });

  describe('theme switching', () => {
    it('should update theme and localStorage when setTheme is called', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sucia-theme', 'dark');
      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
    });

    it('should toggle theme correctly', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sucia-theme', 'dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sucia-theme', 'light');
    });
  });

  describe('system preference changes', () => {
    it('should listen for system preference changes when no stored preference exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      const addEventListener = jest.fn();
      const removeEventListener = jest.fn();

      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener,
        removeEventListener,
        dispatchEvent: jest.fn(),
      }));

      const { unmount } = renderHook(() => useTheme());

      expect(addEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();

      expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should not update theme on system change when stored preference exists', () => {
      localStorageMock.getItem.mockReturnValue('light');
      let changeHandler: ((e: MediaQueryListEvent) => void) | null = null;

      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn((_, handler) => {
          changeHandler = handler;
        }),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light');

      // Simulate system preference change
      if (changeHandler) {
        act(() => {
          changeHandler({ matches: true } as MediaQueryListEvent);
        });
      }

      // Theme should not change because stored preference exists
      expect(result.current.theme).toBe('light');
    });
  });

  describe('DOM class management', () => {
    it('should apply light theme classes correctly', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('light');
      });

      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('light');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('dark');
    });

    it('should apply dark theme classes correctly', () => {
      localStorageMock.getItem.mockReturnValue('light');

      const { result } = renderHook(() => useTheme());

      act(() => {
        result.current.setTheme('dark');
      });

      expect(mockDocumentElement.classList.add).toHaveBeenCalledWith('dark');
      expect(mockDocumentElement.classList.remove).toHaveBeenCalledWith('light');
    });
  });

  describe('edge cases', () => {
    it('should handle invalid stored values gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-theme');
      mockMatchMedia.mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light'); // Should default to light
    });

    it('should handle missing matchMedia gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null);
      // Remove matchMedia
      delete (window as any).matchMedia;

      const { result } = renderHook(() => useTheme());

      expect(result.current.theme).toBe('light'); // Should default to light
    });
  });
}); 