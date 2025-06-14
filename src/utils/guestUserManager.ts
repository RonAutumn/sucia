// Guest User Manager - Simple user system without authentication
import { GuestUser, GuestUserSession, NicknameValidationResult } from '../types/guestUser'

const STORAGE_KEYS = {
  USERS: 'guest_users',
  CURRENT_USER: 'current_guest_user',
  SESSION: 'guest_session'
} as const

const USER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
  '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
  '#10AC84', '#EE5A24', '#0ABDE3', '#3742FA', '#2F3542'
] as const

class GuestUserManagerClass {
  private users = new Map<string, GuestUser>()
  private currentUser: GuestUser | null = null
  private session: GuestUserSession | null = null
  private eventListeners = {
    userJoined: [] as ((user: GuestUser) => void)[],
    userLeft: [] as ((userId: string) => void)[],
    userListUpdated: [] as ((users: GuestUser[]) => void)[]
  }
  private activityCheckInterval: NodeJS.Timeout | null = null
  private readonly ACTIVITY_TIMEOUT = 5 * 60 * 1000 // 5 minutes

  constructor() {
    this.loadFromStorage()
    this.startActivityCheck()
    this.setupBeforeUnloadHandler()
  }

  // User management
  async createUser(nickname: string): Promise<GuestUser> {
    const validation = this.validateNickname(nickname)
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid nickname')
    }

    const userId = this.generateUserId()
    const sessionId = this.generateSessionId()
    const color = this.assignUserColor()

    const user: GuestUser = {
      id: userId,
      nickname: nickname.trim(),
      joinedAt: Date.now(),
      lastSeen: Date.now(),
      isActive: true,
      sessionId,
      color
    }

    const session: GuestUserSession = {
      sessionId,
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      isValid: true
    }

    this.users.set(userId, user)
    this.currentUser = user
    this.session = session
    
    this.saveToStorage()
    this.emitUserJoined(user)
    this.emitUserListUpdated()

    return user
  }

  getUser(userId: string): GuestUser | null {
    return this.users.get(userId) || null
  }

  getAllUsers(): GuestUser[] {
    return Array.from(this.users.values())
  }

  getActiveUsers(): GuestUser[] {
    const now = Date.now()
    return Array.from(this.users.values()).filter(user => 
      user.isActive && (now - user.lastSeen) < this.ACTIVITY_TIMEOUT
    )
  }

  updateUserActivity(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      user.lastSeen = Date.now()
      user.isActive = true
      this.users.set(userId, user)
      
      if (this.session && this.session.userId === userId) {
        this.session.lastActivity = Date.now()
      }
      
      this.saveToStorage()
    }
  }

  removeUser(userId: string): void {
    const user = this.users.get(userId)
    if (user) {
      this.users.delete(userId)
      
      if (this.currentUser?.id === userId) {
        this.currentUser = null
        this.session = null
      }
      
      this.saveToStorage()
      this.emitUserLeft(userId)
      this.emitUserListUpdated()
    }
  }

  // Session management
  getCurrentUser(): GuestUser | null {
    return this.currentUser
  }

  setCurrentUser(user: GuestUser): void {
    this.currentUser = user
    this.updateUserActivity(user.id)
    this.saveToStorage()
  }

  clearCurrentUser(): void {
    if (this.currentUser) {
      this.removeUser(this.currentUser.id)
    }
    this.currentUser = null
    this.session = null
    this.saveToStorage()
  }

  // Event management
  onUserJoined(callback: (user: GuestUser) => void): () => void {
    this.eventListeners.userJoined.push(callback)
    return () => {
      const index = this.eventListeners.userJoined.indexOf(callback)
      if (index > -1) {
        this.eventListeners.userJoined.splice(index, 1)
      }
    }
  }

  onUserLeft(callback: (userId: string) => void): () => void {
    this.eventListeners.userLeft.push(callback)
    return () => {
      const index = this.eventListeners.userLeft.indexOf(callback)
      if (index > -1) {
        this.eventListeners.userLeft.splice(index, 1)
      }
    }
  }

  onUserListUpdated(callback: (users: GuestUser[]) => void): () => void {
    this.eventListeners.userListUpdated.push(callback)
    return () => {
      const index = this.eventListeners.userListUpdated.indexOf(callback)
      if (index > -1) {
        this.eventListeners.userListUpdated.splice(index, 1)
      }
    }
  }

  // Nickname validation
  validateNickname(nickname: string): NicknameValidationResult {
    const trimmed = nickname.trim()
    
    if (!trimmed) {
      return { isValid: false, error: 'Nickname cannot be empty' }
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'Nickname must be at least 2 characters long' }
    }
    
    if (trimmed.length > 20) {
      return { isValid: false, error: 'Nickname must be 20 characters or less' }
    }
    
    if (!/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
      return { 
        isValid: false, 
        error: 'Nickname can only contain letters, numbers, spaces, underscores, and hyphens' 
      }
    }
    
    // Check if nickname is already taken
    const existing = Array.from(this.users.values()).find(
      user => user.nickname.toLowerCase() === trimmed.toLowerCase() && user.isActive
    )
    
    if (existing) {
      return { 
        isValid: false, 
        error: 'Nickname is already taken',
        suggestion: this.generateNicknameSuggestion(trimmed)
      }
    }
    
    return { isValid: true }
  }

  // Private helper methods
  private generateUserId(): string {
    return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private assignUserColor(): string {
    const usedColors = new Set(
      Array.from(this.users.values())
        .filter(user => user.isActive)
        .map(user => user.color)
    )
    
    const availableColors = USER_COLORS.filter(color => !usedColors.has(color))
    
    if (availableColors.length > 0) {
      return availableColors[Math.floor(Math.random() * availableColors.length)]
    }
    
    // If all colors are used, pick a random one
    return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
  }

  private generateNicknameSuggestion(nickname: string): string {
    const base = nickname.replace(/\d+$/, '') // Remove trailing numbers
    let counter = 1
    
    while (counter <= 99) {
      const suggestion = `${base}${counter}`
      const validation = this.validateNickname(suggestion)
      if (validation.isValid) {
        return suggestion
      }
      counter++
    }
    
    // Fallback to random suffix
    return `${base}_${Math.random().toString(36).substr(2, 4)}`
  }

  private startActivityCheck(): void {
    this.activityCheckInterval = setInterval(() => {
      this.checkUserActivity()
    }, 30000) // Check every 30 seconds
  }

  private checkUserActivity(): void {
    const now = Date.now()
    let hasChanges = false
    
    for (const [userId, user] of this.users.entries()) {
      if (user.isActive && (now - user.lastSeen) > this.ACTIVITY_TIMEOUT) {
        user.isActive = false
        this.users.set(userId, user)
        hasChanges = true
      }
    }
    
    if (hasChanges) {
      this.saveToStorage()
      this.emitUserListUpdated()
    }
  }

  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.currentUser) {
          this.currentUser.isActive = false
          this.saveToStorage()
        }
      })
      
      // Handle page visibility changes (mobile browsers)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.currentUser) {
          this.currentUser.isActive = false
          this.saveToStorage()
        } else if (document.visibilityState === 'visible' && this.currentUser) {
          this.updateUserActivity(this.currentUser.id)
        }
      })
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return
      
      // Load users
      const usersData = localStorage.getItem(STORAGE_KEYS.USERS)
      if (usersData) {
        const userArray: GuestUser[] = JSON.parse(usersData)
        userArray.forEach(user => {
          this.users.set(user.id, user)
        })
      }
      
      // Load current user
      const currentUserData = localStorage.getItem(STORAGE_KEYS.CURRENT_USER)
      if (currentUserData) {
        this.currentUser = JSON.parse(currentUserData)
      }
      
      // Load session
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION)
      if (sessionData) {
        this.session = JSON.parse(sessionData)
      }
      
      // Validate current session
      if (this.currentUser && this.session) {
        const now = Date.now()
        if (now - this.session.lastActivity > this.ACTIVITY_TIMEOUT) {
          // Session expired
          this.clearCurrentUser()
        } else {
          // Update activity
          this.updateUserActivity(this.currentUser.id)
        }
      }
    } catch (error) {
      console.error('Failed to load guest user data from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return
      
      // Save users
      const userArray = Array.from(this.users.values())
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(userArray))
      
      // Save current user
      if (this.currentUser) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser))
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER)
      }
      
      // Save session
      if (this.session) {
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(this.session))
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION)
      }
    } catch (error) {
      console.error('Failed to save guest user data to storage:', error)
    }
  }

  private emitUserJoined(user: GuestUser): void {
    this.eventListeners.userJoined.forEach(callback => {
      try {
        callback(user)
      } catch (error) {
        console.error('Error in userJoined callback:', error)
      }
    })
  }

  private emitUserLeft(userId: string): void {
    this.eventListeners.userLeft.forEach(callback => {
      try {
        callback(userId)
      } catch (error) {
        console.error('Error in userLeft callback:', error)
      }
    })
  }

  private emitUserListUpdated(): void {
    const users = this.getAllUsers()
    this.eventListeners.userListUpdated.forEach(callback => {
      try {
        callback(users)
      } catch (error) {
        console.error('Error in userListUpdated callback:', error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    if (this.activityCheckInterval) {
      clearInterval(this.activityCheckInterval)
      this.activityCheckInterval = null
    }
    
    this.users.clear()
    this.currentUser = null
    this.session = null
    this.eventListeners.userJoined = []
    this.eventListeners.userLeft = []
    this.eventListeners.userListUpdated = []
  }
}

// Singleton instance
let guestUserManagerInstance: GuestUserManagerClass | null = null

export function getGuestUserManager(): GuestUserManagerClass {
  if (!guestUserManagerInstance) {
    guestUserManagerInstance = new GuestUserManagerClass()
  }
  return guestUserManagerInstance
}

export function destroyGuestUserManager(): void {
  if (guestUserManagerInstance) {
    guestUserManagerInstance.destroy()
    guestUserManagerInstance = null
  }
}

export type { GuestUserManagerClass }
export default getGuestUserManager 