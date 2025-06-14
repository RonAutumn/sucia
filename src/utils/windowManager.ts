// WindowManager - Core system for managing multiple browser windows with cross-window communication
// Supports game windows, admin interfaces, and multi-window gaming sessions

export interface WindowConfig {
  url: string
  name: string
  features?: WindowFeatures
  data?: Record<string, any>
}

export interface WindowFeatures {
  width?: number
  height?: number
  left?: number
  top?: number
  resizable?: boolean
  scrollbars?: boolean
  toolbar?: boolean
  menubar?: boolean
  location?: boolean
  directories?: boolean
  status?: boolean
  copyhistory?: boolean
}

export interface ManagedWindow {
  id: string
  name: string
  window: Window
  url: string
  config: WindowConfig
  isAlive: boolean
  lastPing: number
  createdAt: number
  data: Record<string, any>
}

export interface WindowMessage {
  type: string
  windowId: string
  targetWindowId?: string
  payload: any
  timestamp: number
  messageId: string
}

export interface WindowManagerEvents {
  windowOpened: (window: ManagedWindow) => void
  windowClosed: (windowId: string) => void
  windowFocused: (windowId: string) => void
  messageReceived: (message: WindowMessage) => void
  connectionLost: (windowId: string) => void
  connectionRestored: (windowId: string) => void
}

export class WindowManager {
  private windows = new Map<string, ManagedWindow>()
  private messageHandlers = new Map<string, ((message: WindowMessage) => void)[]>()
  private eventListeners: Partial<WindowManagerEvents> = {}
  private heartbeatInterval: NodeJS.Timeout | null = null
  private readonly HEARTBEAT_INTERVAL = 5000 // 5 seconds
  private readonly CONNECTION_TIMEOUT = 15000 // 15 seconds
  private readonly STORAGE_KEY = 'window_manager_state'
  private sharedWorker: SharedWorker | null = null
  private isMainWindow: boolean = true

  constructor() {
    this.initializeMessageListener()
    this.initializeBeforeUnloadHandler()
    this.initializeSharedWorker()
    this.startHeartbeat()
    this.restoreWindowRegistry()
  }

  // Initialize PostMessage API listener for cross-window communication
  private initializeMessageListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      if (!this.isValidMessage(event.data)) {
        return
      }

      const message: WindowMessage = event.data
      
      // Update window registry if it's a heartbeat
      if (message.type === 'heartbeat') {
        this.updateWindowHeartbeat(message.windowId)
        return
      }

      // Handle window registration
      if (message.type === 'window_register') {
        this.handleWindowRegistration(message, event.source as Window)
        return
      }

      // Dispatch message to handlers
      this.dispatchMessage(message)
      
      // Emit event
      if (this.eventListeners.messageReceived) {
        this.eventListeners.messageReceived(message)
      }
    })
  }

  // Initialize beforeunload handler for cleanup
  private initializeBeforeUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.cleanup()
    })

    // Also handle visibility change for mobile browsers
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        this.notifyWindowsBeforeUnload()
      }
    })
  }

  // Initialize SharedWorker for state synchronization (with fallback)
  private initializeSharedWorker(): void {
    try {
      if ('SharedWorker' in window) {
        // Create a simple SharedWorker script as a blob
        const workerScript = `
          const connections = [];
          const windowStates = new Map();
          
          self.addEventListener('connect', (event) => {
            const port = event.ports[0];
            connections.push(port);
            
            port.addEventListener('message', (e) => {
              const { type, windowId, data } = e.data;
              
              if (type === 'register') {
                windowStates.set(windowId, data);
                // Broadcast to all connections
                connections.forEach(conn => {
                  if (conn !== port) {
                    conn.postMessage({ type: 'window_registered', windowId, data });
                  }
                });
              } else if (type === 'unregister') {
                windowStates.delete(windowId);
                connections.forEach(conn => {
                  if (conn !== port) {
                    conn.postMessage({ type: 'window_unregistered', windowId });
                  }
                });
              } else if (type === 'get_state') {
                port.postMessage({ type: 'state', data: Object.fromEntries(windowStates) });
              }
            });
            
            port.start();
          });
        `
        
        const blob = new Blob([workerScript], { type: 'application/javascript' })
        const workerUrl = URL.createObjectURL(blob)
        
        this.sharedWorker = new SharedWorker(workerUrl)
        this.sharedWorker.port.start()
        
        // Listen for SharedWorker messages
        this.sharedWorker.port.addEventListener('message', (event) => {
          this.handleSharedWorkerMessage(event.data)
        })
        
        console.log('WindowManager: SharedWorker initialized')
      } else {
        console.log('WindowManager: SharedWorker not supported, using LocalStorage fallback')
        this.initializeLocalStorageFallback()
      }
    } catch (error) {
      console.warn('WindowManager: Failed to initialize SharedWorker, using LocalStorage fallback:', error)
      this.initializeLocalStorageFallback()
    }
  }

  // LocalStorage fallback for SharedWorker
  private initializeLocalStorageFallback(): void {
    // Listen for storage changes from other windows
    window.addEventListener('storage', (event) => {
      if (event.key === this.STORAGE_KEY && event.newValue) {
        try {
          const state = JSON.parse(event.newValue)
          this.syncWithStoredState(state)
        } catch (error) {
          console.error('WindowManager: Failed to parse stored state:', error)
        }
      }
    })
  }

  // Start heartbeat system to check window health
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.checkWindowHealth()
      this.broadcastHeartbeat()
    }, this.HEARTBEAT_INTERVAL)
  }

  // Open a new managed window
  public openWindow(config: WindowConfig): Promise<ManagedWindow> {
    return new Promise((resolve, reject) => {
      try {
        const windowId = this.generateWindowId()
        const features = this.buildWindowFeatures(config.features)
        
        // Calculate window position if not specified
        const positioning = this.calculateWindowPosition(config.features)
        const finalFeatures = { ...features, ...positioning }
        
        const newWindow = window.open(
          config.url,
          config.name || windowId,
          this.formatWindowFeatures(finalFeatures)
        )

        if (!newWindow) {
          reject(new Error('Failed to open window. Pop-up blocked or invalid configuration.'))
          return
        }

        const managedWindow: ManagedWindow = {
          id: windowId,
          name: config.name || windowId,
          window: newWindow,
          url: config.url,
          config,
          isAlive: true,
          lastPing: Date.now(),
          createdAt: Date.now(),
          data: config.data || {}
        }

        this.windows.set(windowId, managedWindow)

        // Wait for window to load before resolving
        const checkLoaded = () => {
          if (newWindow.closed) {
            this.windows.delete(windowId)
            reject(new Error('Window was closed before it could be registered'))
            return
          }

          try {
            // Try to access the window's document to check if it's loaded
            if (newWindow.document && newWindow.document.readyState === 'complete') {
              this.initializeNewWindow(managedWindow)
              this.saveWindowRegistry()
              
              if (this.eventListeners.windowOpened) {
                this.eventListeners.windowOpened(managedWindow)
              }
              
              resolve(managedWindow)
            } else {
              setTimeout(checkLoaded, 100)
            }
          } catch (error) {
            // Cross-origin restrictions - wait a bit more
            setTimeout(checkLoaded, 100)
          }
        }

        checkLoaded()

      } catch (error) {
        reject(error)
      }
    })
  }

  // Initialize a newly opened window
  private initializeNewWindow(managedWindow: ManagedWindow): void {
    const { window: win, id } = managedWindow

    try {
      // Send registration message to the new window
      win.postMessage({
        type: 'window_initialize',
        windowId: id,
        parentWindowId: this.getMainWindowId(),
        config: managedWindow.config,
        timestamp: Date.now(),
        messageId: this.generateMessageId()
      }, '*')

      // Set up focus listener
      win.addEventListener('focus', () => {
        if (this.eventListeners.windowFocused) {
          this.eventListeners.windowFocused(id)
        }
      })

    } catch (error) {
      console.warn(`WindowManager: Could not initialize window ${id}:`, error)
    }
  }

  // Send message to specific window
  public sendMessage(windowId: string, type: string, payload: any): boolean {
    const window = this.windows.get(windowId)
    if (!window || !window.isAlive || window.window.closed) {
      return false
    }

    const message: WindowMessage = {
      type,
      windowId: this.getMainWindowId(),
      targetWindowId: windowId,
      payload,
      timestamp: Date.now(),
      messageId: this.generateMessageId()
    }

    try {
      window.window.postMessage(message, '*')
      return true
    } catch (error) {
      console.error(`WindowManager: Failed to send message to window ${windowId}:`, error)
      this.markWindowDead(windowId)
      return false
    }
  }

  // Broadcast message to all windows
  public broadcastMessage(type: string, payload: any, excludeWindowId?: string): number {
    let sentCount = 0
    
    for (const [windowId, window] of this.windows) {
      if (excludeWindowId && windowId === excludeWindowId) {
        continue
      }
      
      if (this.sendMessage(windowId, type, payload)) {
        sentCount++
      }
    }
    
    return sentCount
  }

  // Register message handler
  public onMessage(type: string, handler: (message: WindowMessage) => void): () => void {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, [])
    }
    
    this.messageHandlers.get(type)!.push(handler)
    
    // Return cleanup function
    return () => {
      const handlers = this.messageHandlers.get(type)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
      }
    }
  }

  // Register event listener
  public addEventListener<K extends keyof WindowManagerEvents>(
    event: K,
    listener: WindowManagerEvents[K]
  ): void {
    this.eventListeners[event] = listener
  }

  // Get window by ID
  public getWindow(windowId: string): ManagedWindow | undefined {
    return this.windows.get(windowId)
  }

  // Get all windows
  public getAllWindows(): ManagedWindow[] {
    return Array.from(this.windows.values())
  }

  // Get alive windows only
  public getAliveWindows(): ManagedWindow[] {
    return this.getAllWindows().filter(w => w.isAlive && !w.window.closed)
  }

  // Close specific window
  public closeWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (!window) {
      return false
    }

    try {
      if (!window.window.closed) {
        window.window.close()
      }
    } catch (error) {
      console.error(`WindowManager: Error closing window ${windowId}:`, error)
    }

    this.handleWindowClosed(windowId)
    return true
  }

  // Close all windows
  public closeAllWindows(): void {
    const windowIds = Array.from(this.windows.keys())
    windowIds.forEach(id => this.closeWindow(id))
  }

  // Focus specific window
  public focusWindow(windowId: string): boolean {
    const window = this.windows.get(windowId)
    if (!window || !window.isAlive || window.window.closed) {
      return false
    }

    try {
      window.window.focus()
      return true
    } catch (error) {
      console.error(`WindowManager: Error focusing window ${windowId}:`, error)
      return false
    }
  }

  // Private helper methods

  private generateWindowId(): string {
    return `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getMainWindowId(): string {
    return 'main_window'
  }

  private buildWindowFeatures(features?: WindowFeatures): WindowFeatures {
    return {
      width: 1200,
      height: 800,
      resizable: true,
      scrollbars: true,
      toolbar: false,
      menubar: false,
      location: false,
      directories: false,
      status: false,
      copyhistory: false,
      ...features
    }
  }

  private calculateWindowPosition(features?: WindowFeatures): { left: number; top: number } {
    if (features?.left !== undefined && features?.top !== undefined) {
      return { left: features.left, top: features.top }
    }

    // Auto-position windows with slight offset
    const openWindowsCount = this.windows.size
    const offset = openWindowsCount * 30

    const screenWidth = window.screen.availWidth
    const screenHeight = window.screen.availHeight
    const windowWidth = features?.width || 1200
    const windowHeight = features?.height || 800

    const left = Math.max(0, (screenWidth - windowWidth) / 2 + offset)
    const top = Math.max(0, (screenHeight - windowHeight) / 2 + offset)

    return { left, top }
  }

  private formatWindowFeatures(features: WindowFeatures): string {
    return Object.entries(features)
      .map(([key, value]) => `${key}=${value}`)
      .join(',')
  }

  private isValidMessage(data: any): data is WindowMessage {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.type === 'string' &&
      typeof data.windowId === 'string' &&
      typeof data.timestamp === 'number' &&
      typeof data.messageId === 'string'
    )
  }

  private dispatchMessage(message: WindowMessage): void {
    const handlers = this.messageHandlers.get(message.type)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(message)
        } catch (error) {
          console.error(`WindowManager: Error in message handler for ${message.type}:`, error)
        }
      })
    }
  }

  private updateWindowHeartbeat(windowId: string): void {
    const window = this.windows.get(windowId)
    if (window) {
      window.lastPing = Date.now()
      if (!window.isAlive) {
        window.isAlive = true
        if (this.eventListeners.connectionRestored) {
          this.eventListeners.connectionRestored(windowId)
        }
      }
    }
  }

  private handleWindowRegistration(message: WindowMessage, source: Window): void {
    // Handle registration from child windows
    console.log('WindowManager: Received window registration:', message)
  }

  private checkWindowHealth(): void {
    const now = Date.now()
    
    for (const [windowId, window] of this.windows) {
      // Check if window is closed
      if (window.window.closed) {
        this.handleWindowClosed(windowId)
        continue
      }

      // Check heartbeat timeout
      if (now - window.lastPing > this.CONNECTION_TIMEOUT) {
        if (window.isAlive) {
          window.isAlive = false
          if (this.eventListeners.connectionLost) {
            this.eventListeners.connectionLost(windowId)
          }
        }
      }
    }
  }

  private broadcastHeartbeat(): void {
    this.broadcastMessage('heartbeat', { timestamp: Date.now() })
  }

  private markWindowDead(windowId: string): void {
    const window = this.windows.get(windowId)
    if (window && window.isAlive) {
      window.isAlive = false
      if (this.eventListeners.connectionLost) {
        this.eventListeners.connectionLost(windowId)
      }
    }
  }

  private handleWindowClosed(windowId: string): void {
    this.windows.delete(windowId)
    this.saveWindowRegistry()
    
    if (this.eventListeners.windowClosed) {
      this.eventListeners.windowClosed(windowId)
    }
  }

  private handleSharedWorkerMessage(data: any): void {
    // Handle messages from SharedWorker
    console.log('WindowManager: SharedWorker message:', data)
  }

  private syncWithStoredState(state: any): void {
    // Sync with state from localStorage
    console.log('WindowManager: Syncing with stored state:', state)
  }

  private saveWindowRegistry(): void {
    try {
      const registry = Array.from(this.windows.entries()).map(([id, window]) => ({
        id,
        name: window.name,
        url: window.url,
        isAlive: window.isAlive,
        createdAt: window.createdAt,
        data: window.data
      }))

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(registry))

      // Also send to SharedWorker if available
      if (this.sharedWorker) {
        this.sharedWorker.port.postMessage({
          type: 'register',
          windowId: this.getMainWindowId(),
          data: registry
        })
      }
    } catch (error) {
      console.error('WindowManager: Failed to save window registry:', error)
    }
  }

  private restoreWindowRegistry(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const registry = JSON.parse(stored)
        console.log('WindowManager: Restored window registry:', registry)
        // Note: We don't restore actual windows, just the registry data
      }
    } catch (error) {
      console.error('WindowManager: Failed to restore window registry:', error)
    }
  }

  private notifyWindowsBeforeUnload(): void {
    this.broadcastMessage('main_window_unloading', {
      timestamp: Date.now()
    })
  }

  private cleanup(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Notify windows that main window is closing
    this.notifyWindowsBeforeUnload()

    // Close all managed windows
    this.closeAllWindows()

    // Clean up SharedWorker
    if (this.sharedWorker) {
      this.sharedWorker.port.postMessage({
        type: 'unregister',
        windowId: this.getMainWindowId()
      })
    }
  }

  // Public utility methods

  public getWindowCount(): number {
    return this.windows.size
  }

  public getAliveWindowCount(): number {
    return this.getAliveWindows().length
  }

  public isWindowAlive(windowId: string): boolean {
    const window = this.windows.get(windowId)
    return window ? window.isAlive && !window.window.closed : false
  }

  // Destroy the window manager
  public destroy(): void {
    this.cleanup()
    this.windows.clear()
    this.messageHandlers.clear()
    this.eventListeners = {}
  }
}

// Singleton instance
let windowManagerInstance: WindowManager | null = null

export function getWindowManager(): WindowManager {
  if (!windowManagerInstance) {
    windowManagerInstance = new WindowManager()
  }
  return windowManagerInstance
}

export function destroyWindowManager(): void {
  if (windowManagerInstance) {
    windowManagerInstance.destroy()
    windowManagerInstance = null
  }
} 