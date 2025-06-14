import { useState, useEffect, useCallback, useRef } from 'react'
import { getGuestUserManager, GuestUserManagerClass } from '../utils/guestUserManager'
import { GuestUser, NicknameValidationResult } from '../types/guestUser'

export interface UseGuestUserState {
  currentUser: GuestUser | null
  allUsers: GuestUser[]
  activeUsers: GuestUser[]
  isJoined: boolean
  isLoading: boolean
}

export interface UseGuestUserOptions {
  autoUpdate?: boolean
  updateInterval?: number
}

export function useGuestUser(options: UseGuestUserOptions = {}) {
  const { autoUpdate = true, updateInterval = 5000 } = options
  
  const [state, setState] = useState<UseGuestUserState>({
    currentUser: null,
    allUsers: [],
    activeUsers: [],
    isJoined: false,
    isLoading: true
  })

  const managerRef = useRef<GuestUserManagerClass | null>(null)
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize guest user manager
  useEffect(() => {
    managerRef.current = getGuestUserManager()
    updateState()
    
    // Set up event listeners
    const unsubscribers = [
      managerRef.current.onUserJoined((user) => {
        console.log('User joined:', user.nickname)
        updateState()
      }),
      managerRef.current.onUserLeft((userId) => {
        console.log('User left:', userId)
        updateState()
      }),
      managerRef.current.onUserListUpdated(() => {
        updateState()
      })
    ]

    // Start periodic updates if enabled
    if (autoUpdate) {
      updateIntervalRef.current = setInterval(updateState, updateInterval)
    }

    return () => {
      // Cleanup
      unsubscribers.forEach(unsubscribe => unsubscribe())
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [autoUpdate, updateInterval])

  // Update state from manager
  const updateState = useCallback(() => {
    if (!managerRef.current) return

    const manager = managerRef.current
    const currentUser = manager.getCurrentUser()
    
    setState({
      currentUser,
      allUsers: manager.getAllUsers(),
      activeUsers: manager.getActiveUsers(),
      isJoined: !!currentUser,
      isLoading: false
    })

    // Update activity for current user
    if (currentUser) {
      manager.updateUserActivity(currentUser.id)
    }
  }, [])

  // Join as guest user
  const joinAsGuest = useCallback(async (nickname: string): Promise<{ success: boolean; error?: string; user?: GuestUser }> => {
    if (!managerRef.current) {
      return { success: false, error: 'Guest user manager not initialized' }
    }

    try {
      const user = await managerRef.current.createUser(nickname)
      updateState()
      return { success: true, user }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to join'
      return { success: false, error: errorMessage }
    }
  }, [updateState])

  // Leave current session
  const leaveSession = useCallback(() => {
    if (!managerRef.current) return

    managerRef.current.clearCurrentUser()
    updateState()
  }, [updateState])

  // Validate nickname
  const validateNickname = useCallback((nickname: string): NicknameValidationResult => {
    if (!managerRef.current) {
      return { isValid: false, error: 'Guest user manager not initialized' }
    }

    return managerRef.current.validateNickname(nickname)
  }, [])

  // Update current user activity
  const updateActivity = useCallback(() => {
    if (!managerRef.current || !state.currentUser) return

    managerRef.current.updateUserActivity(state.currentUser.id)
  }, [state.currentUser])

  // Get user by ID
  const getUser = useCallback((userId: string): GuestUser | null => {
    if (!managerRef.current) return null
    return managerRef.current.getUser(userId)
  }, [])

  // Force refresh
  const refresh = useCallback(() => {
    updateState()
  }, [updateState])

  return {
    // State
    ...state,
    
    // Actions
    joinAsGuest,
    leaveSession,
    validateNickname,
    updateActivity,
    getUser,
    refresh,
    
    // Utils
    manager: managerRef.current
  }
}

// Hook for just checking if user is joined (lightweight)
export function useIsGuestUserJoined(): boolean {
  const [isJoined, setIsJoined] = useState(false)
  
  useEffect(() => {
    const manager = getGuestUserManager()
    const currentUser = manager.getCurrentUser()
    setIsJoined(!!currentUser)
    
    const unsubscribeJoined = manager.onUserJoined(() => setIsJoined(true))
    const unsubscribeLeft = manager.onUserLeft(() => {
      const user = manager.getCurrentUser()
      setIsJoined(!!user)
    })
    
    return () => {
      unsubscribeJoined()
      unsubscribeLeft()
    }
  }, [])
  
  return isJoined
}

// Hook for current user only
export function useCurrentGuestUser(): GuestUser | null {
  const [currentUser, setCurrentUser] = useState<GuestUser | null>(null)
  
  useEffect(() => {
    const manager = getGuestUserManager()
    setCurrentUser(manager.getCurrentUser())
    
    const unsubscribeJoined = manager.onUserJoined((user) => {
      const current = manager.getCurrentUser()
      setCurrentUser(current)
    })
    
    const unsubscribeLeft = manager.onUserLeft(() => {
      const current = manager.getCurrentUser()
      setCurrentUser(current)
    })
    
    return () => {
      unsubscribeJoined()
      unsubscribeLeft()
    }
  }, [])
  
  return currentUser
}

// Hook for active users list (for TV display)
export function useActiveGuestUsers() {
  const [activeUsers, setActiveUsers] = useState<GuestUser[]>([])
  
  useEffect(() => {
    const manager = getGuestUserManager()
    setActiveUsers(manager.getActiveUsers())
    
    const unsubscribe = manager.onUserListUpdated(() => {
      setActiveUsers(manager.getActiveUsers())
    })
    
    // Also update every 10 seconds to catch activity timeouts
    const interval = setInterval(() => {
      setActiveUsers(manager.getActiveUsers())
    }, 10000)
    
    return () => {
      unsubscribe()
      clearInterval(interval)
    }
  }, [])
  
  return activeUsers
} 