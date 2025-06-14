import { useEffect, useRef, useState, useCallback } from 'react'
import { 
  getWindowManager, 
  WindowManager, 
  WindowConfig, 
  ManagedWindow, 
  WindowMessage,
  WindowManagerEvents 
} from '../utils/windowManager'

export interface UseWindowManagerOptions {
  autoStart?: boolean
  onWindowOpened?: (window: ManagedWindow) => void
  onWindowClosed?: (windowId: string) => void
  onWindowFocused?: (windowId: string) => void
  onMessageReceived?: (message: WindowMessage) => void
  onConnectionLost?: (windowId: string) => void
  onConnectionRestored?: (windowId: string) => void
}

export interface WindowManagerState {
  windows: ManagedWindow[]
  windowCount: number
  aliveWindowCount: number
  isInitialized: boolean
}

export function useWindowManager(options: UseWindowManagerOptions = {}) {
  const [state, setState] = useState<WindowManagerState>({
    windows: [],
    windowCount: 0,
    aliveWindowCount: 0,
    isInitialized: false
  })

  const windowManagerRef = useRef<WindowManager | null>(null)
  const messageHandlersRef = useRef<Map<string, () => void>>(new Map())

  // Initialize WindowManager
  useEffect(() => {
    if (options.autoStart !== false) {
      windowManagerRef.current = getWindowManager()
      setState(prev => ({ ...prev, isInitialized: true }))

      // Set up event listeners
      const manager = windowManagerRef.current

      if (options.onWindowOpened) {
        manager.addEventListener('windowOpened', options.onWindowOpened)
      }
      if (options.onWindowClosed) {
        manager.addEventListener('windowClosed', options.onWindowClosed)
      }
      if (options.onWindowFocused) {
        manager.addEventListener('windowFocused', options.onWindowFocused)
      }
      if (options.onMessageReceived) {
        manager.addEventListener('messageReceived', options.onMessageReceived)
      }
      if (options.onConnectionLost) {
        manager.addEventListener('connectionLost', options.onConnectionLost)
      }
      if (options.onConnectionRestored) {
        manager.addEventListener('connectionRestored', options.onConnectionRestored)
      }

      updateState()
    }

    return () => {
      // Cleanup message handlers
      messageHandlersRef.current.forEach(cleanup => cleanup())
      messageHandlersRef.current.clear()
    }
  }, [options.autoStart])

  // Update state from WindowManager
  const updateState = useCallback(() => {
    if (windowManagerRef.current) {
      const manager = windowManagerRef.current
      setState({
        windows: manager.getAllWindows(),
        windowCount: manager.getWindowCount(),
        aliveWindowCount: manager.getAliveWindowCount(),
        isInitialized: true
      })
    }
  }, [])

  // Set up periodic state updates
  useEffect(() => {
    if (!windowManagerRef.current) return

    const interval = setInterval(updateState, 1000) // Update every second
    return () => clearInterval(interval)
  }, [updateState])

  // Open a new window
  const openWindow = useCallback(async (config: WindowConfig): Promise<ManagedWindow | null> => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return null
    }

    try {
      const managedWindow = await windowManagerRef.current.openWindow(config)
      updateState()
      return managedWindow
    } catch (error) {
      console.error('Failed to open window:', error)
      return null
    }
  }, [updateState])

  // Close a window
  const closeWindow = useCallback((windowId: string): boolean => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return false
    }

    const result = windowManagerRef.current.closeWindow(windowId)
    updateState()
    return result
  }, [updateState])

  // Close all windows
  const closeAllWindows = useCallback((): void => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return
    }

    windowManagerRef.current.closeAllWindows()
    updateState()
  }, [updateState])

  // Focus a window
  const focusWindow = useCallback((windowId: string): boolean => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return false
    }

    return windowManagerRef.current.focusWindow(windowId)
  }, [])

  // Send message to a specific window
  const sendMessage = useCallback((windowId: string, type: string, payload: any): boolean => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return false
    }

    return windowManagerRef.current.sendMessage(windowId, type, payload)
  }, [])

  // Broadcast message to all windows
  const broadcastMessage = useCallback((type: string, payload: any, excludeWindowId?: string): number => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return 0
    }

    return windowManagerRef.current.broadcastMessage(type, payload, excludeWindowId)
  }, [])

  // Register message handler
  const onMessage = useCallback((type: string, handler: (message: WindowMessage) => void): void => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return
    }

    // Clean up existing handler for this type if exists
    const existingCleanup = messageHandlersRef.current.get(type)
    if (existingCleanup) {
      existingCleanup()
    }

    // Register new handler
    const cleanup = windowManagerRef.current.onMessage(type, handler)
    messageHandlersRef.current.set(type, cleanup)
  }, [])

  // Remove message handler
  const offMessage = useCallback((type: string): void => {
    const cleanup = messageHandlersRef.current.get(type)
    if (cleanup) {
      cleanup()
      messageHandlersRef.current.delete(type)
    }
  }, [])

  // Get window by ID
  const getWindow = useCallback((windowId: string): ManagedWindow | undefined => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return undefined
    }

    return windowManagerRef.current.getWindow(windowId)
  }, [])

  // Check if window is alive
  const isWindowAlive = useCallback((windowId: string): boolean => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return false
    }

    return windowManagerRef.current.isWindowAlive(windowId)
  }, [])

  // Get alive windows only
  const getAliveWindows = useCallback((): ManagedWindow[] => {
    if (!windowManagerRef.current) {
      console.warn('WindowManager not initialized')
      return []
    }

    return windowManagerRef.current.getAliveWindows()
  }, [])

  return {
    // State
    ...state,
    
    // Window management
    openWindow,
    closeWindow,
    closeAllWindows,
    focusWindow,
    
    // Messaging
    sendMessage,
    broadcastMessage,
    onMessage,
    offMessage,
    
    // Utilities
    getWindow,
    isWindowAlive,
    getAliveWindows,
    updateState,
    
    // Direct access to manager (for advanced use cases)
    windowManager: windowManagerRef.current
  }
}

// Hook for simple window opening with common patterns
export function useSimpleWindow() {
  const { openWindow, closeWindow, focusWindow } = useWindowManager()

  const openGameWindow = useCallback((gameId: string, gameData?: any) => {
    return openWindow({
      url: `/game/${gameId}`,
      name: `game_${gameId}`,
      features: {
        width: 1000,
        height: 700,
        resizable: true,
        scrollbars: false
      },
      data: { gameId, ...gameData }
    })
  }, [openWindow])

  const openAdminWindow = useCallback((section: string = 'dashboard') => {
    return openWindow({
      url: `/admin/${section}`,
      name: `admin_${section}`,
      features: {
        width: 1400,
        height: 900,
        resizable: true,
        scrollbars: true
      },
      data: { section, isAdmin: true }
    })
  }, [openWindow])

  const openPopupWindow = useCallback((url: string, name: string, width = 800, height = 600) => {
    return openWindow({
      url,
      name,
      features: {
        width,
        height,
        resizable: false,
        scrollbars: true,
        toolbar: false,
        menubar: false,
        location: false
      }
    })
  }, [openWindow])

  return {
    openGameWindow,
    openAdminWindow,
    openPopupWindow,
    closeWindow,
    focusWindow
  }
}

// Hook for window messaging patterns
export function useWindowMessaging() {
  const { sendMessage, broadcastMessage, onMessage, offMessage } = useWindowManager()

  const sendGameUpdate = useCallback((windowId: string, gameState: any) => {
    return sendMessage(windowId, 'game_update', gameState)
  }, [sendMessage])

  const sendPlayerAction = useCallback((windowId: string, action: any) => {
    return sendMessage(windowId, 'player_action', action)
  }, [sendMessage])

  const broadcastSystemMessage = useCallback((message: string, priority: 'low' | 'medium' | 'high' = 'medium') => {
    return broadcastMessage('system_message', { message, priority, timestamp: Date.now() })
  }, [broadcastMessage])

  const broadcastGameEvent = useCallback((event: any) => {
    return broadcastMessage('game_event', event)
  }, [broadcastMessage])

  // Set up common message handlers
  useEffect(() => {
    onMessage('system_message', (message) => {
      console.log('System message:', message.payload)
    })

    onMessage('game_event', (message) => {
      console.log('Game event:', message.payload)
    })

    return () => {
      offMessage('system_message')
      offMessage('game_event')
    }
  }, [onMessage, offMessage])

  return {
    sendGameUpdate,
    sendPlayerAction,
    broadcastSystemMessage,
    broadcastGameEvent,
    sendMessage,
    broadcastMessage,
    onMessage,
    offMessage
  }
} 