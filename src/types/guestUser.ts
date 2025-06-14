// Guest User Types - Simple user system without authentication

export interface GuestUser {
  id: string
  nickname: string
  joinedAt: number
  lastSeen: number
  isActive: boolean
  sessionId: string
  color?: string // For visual distinction on TV display
}

export interface GuestUserSession {
  sessionId: string
  userId: string
  createdAt: number
  lastActivity: number
  isValid: boolean
}

export interface GuestUserManager {
  // User management
  createUser: (nickname: string) => Promise<GuestUser>
  getUser: (userId: string) => GuestUser | null
  getAllUsers: () => GuestUser[]
  getActiveUsers: () => GuestUser[]
  updateUserActivity: (userId: string) => void
  removeUser: (userId: string) => void
  
  // Session management
  getCurrentUser: () => GuestUser | null
  setCurrentUser: (user: GuestUser) => void
  clearCurrentUser: () => void
  
  // Events
  onUserJoined: (callback: (user: GuestUser) => void) => () => void
  onUserLeft: (callback: (userId: string) => void) => () => void
  onUserListUpdated: (callback: (users: GuestUser[]) => void) => () => void
}

export interface NicknameValidationResult {
  isValid: boolean
  error?: string
  suggestion?: string
}

export interface TVDisplayUser {
  id: string
  nickname: string
  color: string
  isActive: boolean
  joinedAt: number
  displayOrder: number
} 