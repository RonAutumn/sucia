// Service Queue Manager - Complete queue management system
import { 
  ServiceType, 
  QueueEntry, 
  QueueStatus, 
  QueuePreferences, 
  QueuePriority,
  QueueStats,
  ServiceCapacity,
  QueueConfiguration
} from '../types/queue'

const STORAGE_KEYS = {
  QUEUES: 'service_queues',
  SERVICES: 'service_types',
  CONFIG: 'queue_config',
  STATS: 'queue_stats'
} as const

const DEFAULT_SERVICES: ServiceType[] = [
  {
    id: 'haircut',
    name: 'Haircut',
    description: 'Professional haircut and styling',
    estimatedDuration: 30,
    maxCapacity: 3,
    isActive: true,
    color: '#FF6B6B',
    icon: '✂️',
    category: 'grooming'
  },
  {
    id: 'massage',
    name: 'Massage',
    description: 'Relaxing therapeutic massage',
    estimatedDuration: 60,
    maxCapacity: 2,
    isActive: true,
    color: '#4ECDC4',
    icon: '💆',
    category: 'wellness'
  },
  {
    id: 'consultation',
    name: 'Consultation',
    description: 'Personal consultation session',
    estimatedDuration: 15,
    maxCapacity: 1,
    isActive: true,
    color: '#45B7D1',
    icon: '💬',
    category: 'advisory'
  },
  {
    id: 'manicure',
    name: 'Manicure',
    description: 'Professional nail care and styling',
    estimatedDuration: 45,
    maxCapacity: 2,
    isActive: true,
    color: '#96CEB4',
    icon: '💅',
    category: 'beauty'
  }
]

const DEFAULT_CONFIG: QueueConfiguration = {
  maxQueueLength: 50,
  autoProgressEnabled: true,
  notificationsEnabled: true,
  estimationAlgorithm: 'simple',
  allowSkipping: true,
  allowPriority: true,
  requirePreferences: false
}

class QueueManagerClass {
  private queues = new Map<string, QueueEntry[]>()
  private services = new Map<string, ServiceType>()
  private config: QueueConfiguration = DEFAULT_CONFIG
  private eventListeners = {
    queueUpdated: [] as ((serviceId: string, queue: QueueEntry[]) => void)[],
    positionChanged: [] as ((entryId: string, newPosition: number) => void)[],
    statusChanged: [] as ((entryId: string, newStatus: QueueStatus) => void)[]
  }
  private updateInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadFromStorage()
    this.startPeriodicUpdates()
    this.setupBeforeUnloadHandler()
  }

  // Queue Operations
  async joinQueue(
    userId: string, 
    serviceId: string, 
    preferences?: QueuePreferences,
    priority: QueuePriority = 'normal'
  ): Promise<QueueEntry> {
    const service = this.services.get(serviceId)
    if (!service || !service.isActive) {
      throw new Error('Service not available')
    }

    // Check if user is already in any queue
    const existingEntry = await this.getUserQueueEntry(userId)
    if (existingEntry) {
      throw new Error('User is already in a queue')
    }

    const queue = this.queues.get(serviceId) || []
    
    // Check queue capacity
    if (queue.length >= this.config.maxQueueLength) {
      throw new Error('Queue is full')
    }

    const entryId = this.generateEntryId()
    const position = this.calculateNewPosition(queue, priority)
    const estimatedWaitTime = this.calculateWaitTime(serviceId, position)

    const entry: QueueEntry = {
      id: entryId,
      userId,
      userNickname: await this.getUserNickname(userId),
      serviceId,
      serviceName: service.name,
      position,
      estimatedWaitTime,
      joinedAt: Date.now(),
      status: 'waiting',
      preferences,
      priority,
      notes: ''
    }

    // Insert at calculated position
    queue.splice(position - 1, 0, entry)
    
    // Update positions for entries after the inserted one
    this.updateQueuePositions(queue)
    
    this.queues.set(serviceId, queue)
    this.saveToStorage()
    
    this.emitQueueUpdated(serviceId, queue)
    this.emitPositionChanged(entryId, position)

    return entry
  }

  async leaveQueue(entryId: string): Promise<boolean> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entryIndex = queue.findIndex(entry => entry.id === entryId)
      if (entryIndex !== -1) {
        const entry = queue[entryIndex]
        queue.splice(entryIndex, 1)
        
        // Update positions for remaining entries
        this.updateQueuePositions(queue)
        
        this.queues.set(serviceId, queue)
        this.saveToStorage()
        
        this.emitQueueUpdated(serviceId, queue)
        this.emitStatusChanged(entryId, 'cancelled')
        
        return true
      }
    }
    return false
  }

  async getQueuePosition(entryId: string): Promise<number | null> {
    for (const queue of this.queues.values()) {
      const entry = queue.find(e => e.id === entryId)
      if (entry) {
        return entry.position
      }
    }
    return null
  }

  async getEstimatedWaitTime(entryId: string): Promise<number | null> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entry = queue.find(e => e.id === entryId)
      if (entry) {
        return this.calculateWaitTime(serviceId, entry.position)
      }
    }
    return null
  }

  // Queue Viewing
  async getQueueForService(serviceId: string): Promise<QueueEntry[]> {
    return [...(this.queues.get(serviceId) || [])]
  }

  async getAllQueues(): Promise<Map<string, QueueEntry[]>> {
    const result = new Map<string, QueueEntry[]>()
    for (const [serviceId, queue] of this.queues.entries()) {
      result.set(serviceId, [...queue])
    }
    return result
  }

  async getUserQueueEntry(userId: string): Promise<QueueEntry | null> {
    for (const queue of this.queues.values()) {
      const entry = queue.find(e => e.userId === userId && e.status !== 'completed' && e.status !== 'cancelled')
      if (entry) {
        return entry
      }
    }
    return null
  }

  // Staff Operations
  async callNextInQueue(serviceId: string): Promise<QueueEntry | null> {
    const queue = this.queues.get(serviceId) || []
    const nextEntry = queue.find(entry => entry.status === 'waiting')
    
    if (nextEntry) {
      nextEntry.status = 'called'
      this.saveToStorage()
      this.emitStatusChanged(nextEntry.id, 'called')
      this.emitQueueUpdated(serviceId, queue)
      return nextEntry
    }
    
    return null
  }

  async markServiceStarted(entryId: string): Promise<boolean> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entry = queue.find(e => e.id === entryId)
      if (entry && entry.status === 'called') {
        entry.status = 'in-service'
        this.saveToStorage()
        this.emitStatusChanged(entryId, 'in-service')
        this.emitQueueUpdated(serviceId, queue)
        return true
      }
    }
    return false
  }

  async markServiceCompleted(entryId: string): Promise<boolean> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entryIndex = queue.findIndex(e => e.id === entryId)
      if (entryIndex !== -1) {
        const entry = queue[entryIndex]
        entry.status = 'completed'
        
        // Remove completed entry from active queue
        queue.splice(entryIndex, 1)
        
        // Update positions for remaining entries
        this.updateQueuePositions(queue)
        
        this.queues.set(serviceId, queue)
        this.saveToStorage()
        
        this.emitStatusChanged(entryId, 'completed')
        this.emitQueueUpdated(serviceId, queue)
        
        // Auto-progress if enabled
        if (this.config.autoProgressEnabled) {
          setTimeout(() => this.callNextInQueue(serviceId), 1000)
        }
        
        return true
      }
    }
    return false
  }

  async skipQueueEntry(entryId: string, reason?: string): Promise<boolean> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entry = queue.find(e => e.id === entryId)
      if (entry && entry.status === 'waiting') {
        entry.status = 'skipped'
        entry.notes = reason || 'Skipped by staff'
        
        // Move to end of queue
        const entryIndex = queue.indexOf(entry)
        queue.splice(entryIndex, 1)
        queue.push(entry)
        
        // Update positions
        this.updateQueuePositions(queue)
        
        // Reset status to waiting
        entry.status = 'waiting'
        
        this.saveToStorage()
        this.emitQueueUpdated(serviceId, queue)
        this.emitPositionChanged(entryId, entry.position)
        
        return true
      }
    }
    return false
  }

  async adjustQueuePosition(entryId: string, newPosition: number): Promise<boolean> {
    for (const [serviceId, queue] of this.queues.entries()) {
      const entryIndex = queue.findIndex(e => e.id === entryId)
      if (entryIndex !== -1) {
        const entry = queue[entryIndex]
        
        // Remove from current position
        queue.splice(entryIndex, 1)
        
        // Insert at new position (1-based to 0-based)
        const insertIndex = Math.max(0, Math.min(newPosition - 1, queue.length))
        queue.splice(insertIndex, 0, entry)
        
        // Update all positions
        this.updateQueuePositions(queue)
        
        this.saveToStorage()
        this.emitQueueUpdated(serviceId, queue)
        this.emitPositionChanged(entryId, entry.position)
        
        return true
      }
    }
    return false
  }

  // Service Management
  async getServiceTypes(): Promise<ServiceType[]> {
    return Array.from(this.services.values()).filter(service => service.isActive)
  }

  async updateServiceCapacity(serviceId: string, capacity: number): Promise<boolean> {
    const service = this.services.get(serviceId)
    if (service) {
      service.maxCapacity = capacity
      this.saveToStorage()
      return true
    }
    return false
  }

  async getQueueStats(serviceId?: string): Promise<QueueStats> {
    if (serviceId) {
      return this.calculateServiceStats(serviceId)
    } else {
      return this.calculateOverallStats()
    }
  }

  // Event Management
  onQueueUpdated(callback: (serviceId: string, queue: QueueEntry[]) => void): () => void {
    this.eventListeners.queueUpdated.push(callback)
    return () => {
      const index = this.eventListeners.queueUpdated.indexOf(callback)
      if (index > -1) {
        this.eventListeners.queueUpdated.splice(index, 1)
      }
    }
  }

  onPositionChanged(callback: (entryId: string, newPosition: number) => void): () => void {
    this.eventListeners.positionChanged.push(callback)
    return () => {
      const index = this.eventListeners.positionChanged.indexOf(callback)
      if (index > -1) {
        this.eventListeners.positionChanged.splice(index, 1)
      }
    }
  }

  onStatusChanged(callback: (entryId: string, newStatus: QueueStatus) => void): () => void {
    this.eventListeners.statusChanged.push(callback)
    return () => {
      const index = this.eventListeners.statusChanged.indexOf(callback)
      if (index > -1) {
        this.eventListeners.statusChanged.splice(index, 1)
      }
    }
  }

  // Private Helper Methods
  private generateEntryId(): string {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async getUserNickname(userId: string): Promise<string> {
    // Integration with guest user system
    try {
      const { getGuestUserManager } = await import('./guestUserManager')
      const guestManager = getGuestUserManager()
      const user = guestManager.getUser(userId)
      return user?.nickname || `User ${userId.slice(-4)}`
    } catch {
      return `User ${userId.slice(-4)}`
    }
  }

  private calculateNewPosition(queue: QueueEntry[], priority: QueuePriority): number {
    if (!this.config.allowPriority || priority === 'normal') {
      return queue.length + 1
    }

    // Priority insertion logic
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 }
    const entryPriority = priorityOrder[priority]

    for (let i = 0; i < queue.length; i++) {
      const queueEntryPriority = priorityOrder[queue[i].priority || 'normal']
      if (entryPriority > queueEntryPriority) {
        return i + 1
      }
    }

    return queue.length + 1
  }

  private calculateWaitTime(serviceId: string, position: number): number {
    const service = this.services.get(serviceId)
    if (!service) return 0

    const queue = this.queues.get(serviceId) || []
    const inServiceCount = queue.filter(e => e.status === 'in-service').length
    const availableCapacity = Math.max(1, service.maxCapacity - inServiceCount)
    
    // Simple estimation: (position - 1) / capacity * duration
    const estimatedWait = Math.ceil((position - 1) / availableCapacity) * service.estimatedDuration
    
    return Math.max(0, estimatedWait)
  }

  private updateQueuePositions(queue: QueueEntry[]): void {
    queue.forEach((entry, index) => {
      const oldPosition = entry.position
      entry.position = index + 1
      entry.estimatedWaitTime = this.calculateWaitTime(entry.serviceId, entry.position)
      
      if (oldPosition !== entry.position) {
        this.emitPositionChanged(entry.id, entry.position)
      }
    })
  }

  private calculateServiceStats(serviceId: string): QueueStats {
    const queue = this.queues.get(serviceId) || []
    const service = this.services.get(serviceId)
    
    return {
      totalInQueue: queue.filter(e => e.status === 'waiting').length,
      averageWaitTime: queue.reduce((sum, e) => sum + e.estimatedWaitTime, 0) / Math.max(1, queue.length),
      servicesCompleted: 0, // Would track from historical data
      currentlyServing: queue.filter(e => e.status === 'in-service').length,
      estimatedProcessingRate: service ? 60 / service.estimatedDuration : 0
    }
  }

  private calculateOverallStats(): QueueStats {
    let totalInQueue = 0
    let totalWaitTime = 0
    let totalEntries = 0
    let currentlyServing = 0

    for (const queue of this.queues.values()) {
      totalInQueue += queue.filter(e => e.status === 'waiting').length
      currentlyServing += queue.filter(e => e.status === 'in-service').length
      totalWaitTime += queue.reduce((sum, e) => sum + e.estimatedWaitTime, 0)
      totalEntries += queue.length
    }

    return {
      totalInQueue,
      averageWaitTime: totalEntries > 0 ? totalWaitTime / totalEntries : 0,
      servicesCompleted: 0,
      currentlyServing,
      estimatedProcessingRate: 0
    }
  }

  private startPeriodicUpdates(): void {
    this.updateInterval = setInterval(() => {
      this.updateWaitTimes()
    }, 60000) // Update every minute
  }

  private updateWaitTimes(): void {
    let hasUpdates = false

    for (const [serviceId, queue] of this.queues.entries()) {
      for (const entry of queue) {
        const newWaitTime = this.calculateWaitTime(serviceId, entry.position)
        if (entry.estimatedWaitTime !== newWaitTime) {
          entry.estimatedWaitTime = newWaitTime
          hasUpdates = true
        }
      }
      
      if (hasUpdates) {
        this.emitQueueUpdated(serviceId, queue)
      }
    }

    if (hasUpdates) {
      this.saveToStorage()
    }
  }

  private setupBeforeUnloadHandler(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage()
      })
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window === 'undefined') return

      // Load services
      const servicesData = localStorage.getItem(STORAGE_KEYS.SERVICES)
      if (servicesData) {
        const services: ServiceType[] = JSON.parse(servicesData)
        services.forEach(service => {
          this.services.set(service.id, service)
        })
      } else {
        // Initialize with default services
        DEFAULT_SERVICES.forEach(service => {
          this.services.set(service.id, service)
        })
        this.saveToStorage()
      }

      // Load queues
      const queuesData = localStorage.getItem(STORAGE_KEYS.QUEUES)
      if (queuesData) {
        const queuesArray: [string, QueueEntry[]][] = JSON.parse(queuesData)
        queuesArray.forEach(([serviceId, queue]) => {
          this.queues.set(serviceId, queue)
        })
      }

      // Load config
      const configData = localStorage.getItem(STORAGE_KEYS.CONFIG)
      if (configData) {
        this.config = { ...DEFAULT_CONFIG, ...JSON.parse(configData) }
      }
    } catch (error) {
      console.error('Failed to load queue data from storage:', error)
    }
  }

  private saveToStorage(): void {
    try {
      if (typeof window === 'undefined') return

      // Save services
      const servicesArray = Array.from(this.services.values())
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(servicesArray))

      // Save queues
      const queuesArray = Array.from(this.queues.entries())
      localStorage.setItem(STORAGE_KEYS.QUEUES, JSON.stringify(queuesArray))

      // Save config
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config))
    } catch (error) {
      console.error('Failed to save queue data to storage:', error)
    }
  }

  private emitQueueUpdated(serviceId: string, queue: QueueEntry[]): void {
    this.eventListeners.queueUpdated.forEach(callback => {
      try {
        callback(serviceId, [...queue])
      } catch (error) {
        console.error('Error in queueUpdated callback:', error)
      }
    })
  }

  private emitPositionChanged(entryId: string, newPosition: number): void {
    this.eventListeners.positionChanged.forEach(callback => {
      try {
        callback(entryId, newPosition)
      } catch (error) {
        console.error('Error in positionChanged callback:', error)
      }
    })
  }

  private emitStatusChanged(entryId: string, newStatus: QueueStatus): void {
    this.eventListeners.statusChanged.forEach(callback => {
      try {
        callback(entryId, newStatus)
      } catch (error) {
        console.error('Error in statusChanged callback:', error)
      }
    })
  }

  // Cleanup
  destroy(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.queues.clear()
    this.services.clear()
    this.eventListeners.queueUpdated = []
    this.eventListeners.positionChanged = []
    this.eventListeners.statusChanged = []
  }
}

// Singleton instance
let queueManagerInstance: QueueManagerClass | null = null

export function getQueueManager(): QueueManagerClass {
  if (!queueManagerInstance) {
    queueManagerInstance = new QueueManagerClass()
  }
  return queueManagerInstance
}

export function destroyQueueManager(): void {
  if (queueManagerInstance) {
    queueManagerInstance.destroy()
    queueManagerInstance = null
  }
}

export type { QueueManagerClass }
export default getQueueManager 