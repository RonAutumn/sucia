import { Tables, TablesInsert, TablesUpdate } from './database'

// Database table type aliases for cleaner imports
export type Game = Tables<'games'>
export type GameInsert = TablesInsert<'games'>
export type GameUpdate = TablesUpdate<'games'>

export type Service = Tables<'services'>
export type ServiceInsert = TablesInsert<'services'>
export type ServiceUpdate = TablesUpdate<'services'>

export type ServiceQueue = Tables<'service_queue'>
export type ServiceQueueInsert = TablesInsert<'service_queue'>
export type ServiceQueueUpdate = TablesUpdate<'service_queue'>

export type CheckIn = Tables<'check_ins'>
export type CheckInInsert = TablesInsert<'check_ins'>
export type CheckInUpdate = TablesUpdate<'check_ins'>

export type GameSession = Tables<'game_sessions'>
export type GameSessionInsert = TablesInsert<'game_sessions'>
export type GameSessionUpdate = TablesUpdate<'game_sessions'>

// Union types for status values
export type GameStatus = 'available' | 'in_use' | 'maintenance'
export type ServiceStatus = 'available' | 'busy' | 'offline'
export type QueueStatus = 'waiting' | 'being_served' | 'completed' | 'cancelled'
export type CheckInStatus = 'checked_in' | 'in_progress' | 'completed'
export type SessionStatus = 'active' | 'completed' | 'cancelled'

// Game types
export type GameType = 'VR' | 'Arcade' | 'PC' | 'Console' | 'Mobile' | 'Board'

// Service types
export type ServiceType = 'Food' | 'Support' | 'Rental' | 'Event' | 'Admin' | 'Maintenance'

// Check-in types
export type CheckInType = 'Gaming Session' | 'Walk-in' | 'Tournament' | 'Event' | 'Service'

// Extended interfaces with better typing
export interface GameWithDetails extends Omit<Game, 'status' | 'type'> {
  status: GameStatus
  type: GameType
  isAvailable: boolean
  occupancyRate: number
}

export interface ServiceWithQueue extends Omit<Service, 'status' | 'type'> {
  status: ServiceStatus
  type: ServiceType
  queueLength: number
  averageWaitTime: number
}

export interface QueueEntryWithDetails extends Omit<ServiceQueue, 'status'> {
  status: QueueStatus
  service?: Service
  estimatedWaitTime: number
  timeInQueue: number
}

export interface CheckInWithDetails extends Omit<CheckIn, 'status' | 'check_in_type'> {
  status: CheckInStatus
  check_in_type: CheckInType
  game?: Game
  service?: Service
  timeCheckedIn: number
}

export interface GameSessionWithDetails extends Omit<GameSession, 'status'> {
  status: SessionStatus
  game?: Game
  currentCost: number
  timeRemaining?: number
  isOvertime: boolean
}

// API Response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Error handling
export interface ApiError {
  code: string
  message: string
  details?: any
  timestamp: string
}

// Real-time events
export interface RealtimeEvent<T = any> {
  type: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  schema: string
  old_record?: T
  new_record?: T
  timestamp: string
}

// Dashboard data types
export interface DashboardStats {
  totalGames: number
  availableGames: number
  activeSessionsCount: number
  averageSessionDuration: number
  queueLength: number
  checkInsToday: number
}

export interface GameAnalytics {
  gameId: string
  gameName: string
  totalSessions: number
  averageSessionDuration: number
  utilizationRate: number
  popularityRank: number
}

// Form types
export interface GameForm {
  name: string
  type: GameType
  maxPlayers: number
  location?: string
  description?: string
  imageUrl?: string
}

export interface ServiceForm {
  name: string
  type: ServiceType
  description?: string
  location?: string
  estimatedWaitTime?: number
}

export interface CheckInForm {
  customerName: string
  customerPhone?: string
  checkInType: CheckInType
  gameId?: string
  serviceId?: string
  notes?: string
}

export interface QueueEntryForm {
  serviceId: string
  customerName: string
  customerPhone?: string
  estimatedServiceTime?: number
  notes?: string
}

// Component props types
export interface GameCardProps {
  game: GameWithDetails
  onSelect?: (game: GameWithDetails) => void
  onUpdate?: (game: GameWithDetails) => void
  showDetails?: boolean
  isSelectable?: boolean
}

export interface ServiceCardProps {
  service: ServiceWithQueue
  onSelect?: (service: ServiceWithQueue) => void
  onJoinQueue?: (service: ServiceWithQueue) => void
  showQueue?: boolean
}

export interface QueueItemProps {
  queueEntry: QueueEntryWithDetails
  position: number
  onUpdate?: (entry: QueueEntryWithDetails) => void
  onRemove?: (entryId: string) => void
}

export interface CheckInItemProps {
  checkIn: CheckInWithDetails
  onUpdate?: (checkIn: CheckInWithDetails) => void
  onComplete?: (checkInId: string) => void
}

// Filter and search types
export interface GameFilters {
  type?: GameType[]
  status?: GameStatus[]
  location?: string[]
  maxPlayers?: number
}

export interface ServiceFilters {
  type?: ServiceType[]
  status?: ServiceStatus[]
  location?: string[]
  hasQueue?: boolean
}

export interface SearchOptions {
  query?: string
  sortBy?: 'name' | 'created_at' | 'price' | 'popularity'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

// Notification types
export interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
  actionLabel?: string
}

// User preferences (for demo purposes)
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  notifications: {
    queue: boolean
    gameAvailable: boolean
    sessionReminder: boolean
    maintenance: boolean
  }
  defaultView: 'games' | 'services' | 'dashboard'
  autoRefresh: boolean
  refreshInterval: number
}

// Utility types for forms
export type RequiredField<T, K extends keyof T> = T & Required<Pick<T, K>>
export type OptionalField<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Generic CRUD operations
export interface CrudOperations<T, TInsert = Partial<T>, TUpdate = Partial<T>> {
  create: (data: TInsert) => Promise<ApiResponse<T>>
  read: (id: string) => Promise<ApiResponse<T>>
  update: (id: string, data: TUpdate) => Promise<ApiResponse<T>>
  delete: (id: string) => Promise<ApiResponse<void>>
  list: (options?: SearchOptions) => Promise<PaginatedResponse<T>>
} 