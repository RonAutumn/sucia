// Service Queue Management Types

export interface ServiceType {
  id: string
  name: string
  description: string
  estimatedDuration: number // in minutes
  maxCapacity: number // max concurrent services
  isActive: boolean
  color?: string
  icon?: string
  category?: string
  requirements?: string[]
}

export interface QueueEntry {
  id: string
  userId: string
  userNickname: string
  serviceId: string
  serviceName: string
  position: number
  estimatedWaitTime: number // in minutes
  joinedAt: number
  status: QueueStatus
  preferences?: QueuePreferences
  priority?: QueuePriority
  notes?: string
}

export type QueueStatus = 
  | 'waiting'      // In queue, waiting for service
  | 'called'       // Called for service, should proceed
  | 'in-service'   // Currently being served
  | 'completed'    // Service completed
  | 'cancelled'    // User cancelled or no-show
  | 'skipped'      // Temporarily skipped, moved to end

export type QueuePriority = 'low' | 'normal' | 'high' | 'urgent'

export interface QueuePreferences {
  preferredTime?: string // e.g., "ASAP", "after 3pm"
  specialRequests?: string
  groupSize?: number
  accessibility?: string[]
}

export interface QueueStats {
  totalInQueue: number
  averageWaitTime: number
  servicesCompleted: number
  currentlyServing: number
  estimatedProcessingRate: number // services per hour
}

export interface ServiceCapacity {
  serviceId: string
  currentCapacity: number
  maxCapacity: number
  availableSlots: number
  nextAvailableTime?: number
}

export interface QueueManager {
  // Queue operations
  joinQueue: (userId: string, serviceId: string, preferences?: QueuePreferences) => Promise<QueueEntry>
  leaveQueue: (entryId: string) => Promise<boolean>
  getQueuePosition: (entryId: string) => Promise<number | null>
  getEstimatedWaitTime: (entryId: string) => Promise<number | null>
  
  // Queue viewing
  getQueueForService: (serviceId: string) => Promise<QueueEntry[]>
  getAllQueues: () => Promise<Map<string, QueueEntry[]>>
  getUserQueueEntry: (userId: string) => Promise<QueueEntry | null>
  
  // Staff operations
  callNextInQueue: (serviceId: string) => Promise<QueueEntry | null>
  markServiceStarted: (entryId: string) => Promise<boolean>
  markServiceCompleted: (entryId: string) => Promise<boolean>
  skipQueueEntry: (entryId: string, reason?: string) => Promise<boolean>
  adjustQueuePosition: (entryId: string, newPosition: number) => Promise<boolean>
  
  // Service management
  getServiceTypes: () => Promise<ServiceType[]>
  updateServiceCapacity: (serviceId: string, capacity: number) => Promise<boolean>
  getQueueStats: (serviceId?: string) => Promise<QueueStats>
  
  // Real-time updates
  onQueueUpdated: (callback: (serviceId: string, queue: QueueEntry[]) => void) => () => void
  onPositionChanged: (callback: (entryId: string, newPosition: number) => void) => () => void
  onStatusChanged: (callback: (entryId: string, newStatus: QueueStatus) => void) => () => void
}

export interface QueueSignupData {
  serviceId: string
  preferences?: QueuePreferences
  priority?: QueuePriority
  notes?: string
}

export interface QueueDisplayEntry extends QueueEntry {
  waitTimeFormatted: string
  joinedAtFormatted: string
  isCurrentUser?: boolean
  canSkip?: boolean
  canCancel?: boolean
}

export interface StaffQueueAction {
  type: 'call' | 'start' | 'complete' | 'skip' | 'cancel' | 'adjust-position'
  entryId: string
  data?: any
  reason?: string
}

export interface QueueNotification {
  id: string
  userId: string
  type: 'position-update' | 'called-for-service' | 'service-ready' | 'queue-cancelled'
  title: string
  message: string
  timestamp: number
  read: boolean
  actionRequired?: boolean
  actionUrl?: string
}

export interface QueueConfiguration {
  maxQueueLength: number
  autoProgressEnabled: boolean
  notificationsEnabled: boolean
  estimationAlgorithm: 'simple' | 'historical' | 'ml-based'
  allowSkipping: boolean
  allowPriority: boolean
  requirePreferences: boolean
} 