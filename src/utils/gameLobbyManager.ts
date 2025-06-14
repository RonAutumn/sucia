// Game Lobby Manager - Complete lobby and room management system
import { 
  GameType, 
  GameRoom, 
  RoomPlayer, 
  CreateRoomData, 
  JoinRoomData, 
  LobbyFilters, 
  LobbyStats,
  GameRoomSettings,
  RoomStatus,
  PlayerStatus,
  GameDifficulty,
  GameCategory
} from '../types/game'
import { getGuestUserManager } from './guestUserManager'

const STORAGE_KEYS = {
  ROOMS: 'game_rooms',
  GAME_TYPES: 'game_types',
  LOBBY_STATS: 'lobby_stats'
} as const

const DEFAULT_GAME_TYPES: GameType[] = [
  {
    id: 'uno',
    name: 'Uno',
    description: 'Classic card game where players meet in person to match colors and numbers',
    minPlayers: 2,
    maxPlayers: 8,
    estimatedDuration: 15,
    difficulty: 'easy',
    category: 'card',
    icon: '🎴',
    color: '#FF6B6B',
    isActive: true,
    isPhysical: true,
    location: 'table',
    rules: [
      'Match the color or number of the top card',
      'Draw cards if you cannot play',
      'Say "Uno" when you have one card left',
      'First player to empty their hand wins'
    ],
    requirements: ['Uno card deck', 'Table or flat surface', 'Meet at agreed location']
  },
  {
    id: 'poker',
    name: 'Texas Hold\'em Poker',
    description: 'Popular poker variant where players meet in person with community cards',
    minPlayers: 2,
    maxPlayers: 6,
    estimatedDuration: 45,
    difficulty: 'medium',
    category: 'card',
    icon: '♠️',
    color: '#4ECDC4',
    isActive: true,
    isPhysical: true,
    location: 'table',
    rules: [
      'Each player gets 2 hole cards',
      '5 community cards are dealt',
      'Make the best 5-card hand',
      'Betting rounds determine the winner'
    ],
    requirements: ['Standard deck of cards', 'Poker chips or betting tokens', 'Table for all players']
  },
  {
    id: 'trivia',
    name: 'Trivia Challenge',
    description: 'Test your knowledge in person across various categories',
    minPlayers: 1,
    maxPlayers: 12,
    estimatedDuration: 20,
    difficulty: 'medium',
    category: 'trivia',
    icon: '🧠',
    color: '#45B7D1',
    isActive: true,
    isPhysical: true,
    location: 'living room',
    rules: [
      'Answer questions from different categories',
      'Points awarded for correct answers',
      'Fastest correct answer gets bonus points',
      'Highest score wins'
    ],
    requirements: ['Trivia questions or app', 'Paper and pens for scoring', 'Comfortable seating area']
  },
  {
    id: 'charades',
    name: 'Charades',
    description: 'Act out words and phrases in person without speaking',
    minPlayers: 4,
    maxPlayers: 10,
    estimatedDuration: 30,
    difficulty: 'easy',
    category: 'party',
    icon: '🎭',
    color: '#96CEB4',
    isActive: true,
    isPhysical: true,
    location: 'living room',
    rules: [
      'Act out the word or phrase without speaking',
      'Team members guess what you\'re acting',
      'Time limit for each round',
      'Team with most correct guesses wins'
    ],
    requirements: ['Charades word cards or app', 'Timer', 'Open space for acting', 'Willingness to perform']
  },
  {
    id: 'chess',
    name: 'Chess',
    description: 'Classic strategy board game played in person',
    minPlayers: 2,
    maxPlayers: 2,
    estimatedDuration: 60,
    difficulty: 'hard',
    category: 'strategy',
    icon: '♟️',
    color: '#FECA57',
    isActive: true,
    isPhysical: true,
    location: 'table',
    rules: [
      'Move pieces according to their rules',
      'Capture opponent pieces',
      'Protect your king from checkmate',
      'Strategic thinking required'
    ],
    requirements: ['Chess board and pieces', 'Chess clock (optional)', 'Quiet table space']
  }
]

const DEFAULT_ROOM_SETTINGS: GameRoomSettings = {
  allowSpectators: true,
  autoStart: false,
  autoStartDelay: 10,
  maxSpectators: 5,
  timeLimit: 60,
  turnTimeLimit: 30
}

class GameLobbyManagerClass {
  private rooms = new Map<string, GameRoom>()
  private gameTypes = new Map<string, GameType>()
  private eventListeners = {
    lobbyUpdated: [] as ((rooms: GameRoom[]) => void)[],
    roomUpdated: [] as ((room: GameRoom) => void)[],
    playerJoined: [] as ((roomId: string, player: RoomPlayer) => void)[],
    playerLeft: [] as ((roomId: string, playerId: string) => void)[],
    gameStarted: [] as ((roomId: string) => void)[]
  }
  private cleanupInterval: NodeJS.Timeout | null = null
  private activityInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadFromStorage()
    this.initializeGameTypes()
    this.startCleanupTimer()
    this.startActivityTimer()
  }

  private loadFromStorage() {
    try {
      const roomsData = localStorage.getItem(STORAGE_KEYS.ROOMS)
      if (roomsData) {
        const rooms = JSON.parse(roomsData) as GameRoom[]
        rooms.forEach(room => {
          this.rooms.set(room.id, room)
        })
      }

      const gameTypesData = localStorage.getItem(STORAGE_KEYS.GAME_TYPES)
      if (gameTypesData) {
        const gameTypes = JSON.parse(gameTypesData) as GameType[]
        gameTypes.forEach(gameType => {
          this.gameTypes.set(gameType.id, gameType)
        })
      }
    } catch (error) {
      console.error('Failed to load lobby data from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      const rooms = Array.from(this.rooms.values())
      localStorage.setItem(STORAGE_KEYS.ROOMS, JSON.stringify(rooms))

      const gameTypes = Array.from(this.gameTypes.values())
      localStorage.setItem(STORAGE_KEYS.GAME_TYPES, JSON.stringify(gameTypes))
    } catch (error) {
      console.error('Failed to save lobby data to storage:', error)
    }
  }

  private initializeGameTypes() {
    if (this.gameTypes.size === 0) {
      DEFAULT_GAME_TYPES.forEach(gameType => {
        this.gameTypes.set(gameType.id, gameType)
      })
      this.saveToStorage()
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private startCleanupTimer() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms()
    }, 60000) // Check every minute
  }

  private startActivityTimer() {
    this.activityInterval = setInterval(() => {
      this.updatePlayerActivity()
    }, 30000) // Update every 30 seconds
  }

  private cleanupInactiveRooms() {
    const now = Date.now()
    const inactiveThreshold = 30 * 60 * 1000 // 30 minutes

    for (const [roomId, room] of this.rooms.entries()) {
      if (now - room.lastActivity > inactiveThreshold && 
          ['waiting', 'starting'].includes(room.status)) {
        room.status = 'abandoned'
        this.rooms.set(roomId, room)
        this.notifyRoomUpdated(room)
      }

      // Remove completed/cancelled/abandoned rooms after 1 hour
      if (['completed', 'cancelled', 'abandoned'].includes(room.status) &&
          now - (room.endedAt || room.lastActivity) > 60 * 60 * 1000) {
        this.rooms.delete(roomId)
      }
    }

    this.saveToStorage()
    this.notifyLobbyUpdated()
  }

  private updatePlayerActivity() {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) return

    for (const [roomId, room] of this.rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.userId === currentUser.id)
      if (playerIndex !== -1) {
        room.players[playerIndex].lastSeen = Date.now()
        room.lastActivity = Date.now()
        this.rooms.set(roomId, room)
      }
    }
  }

  // Event management
  private notifyLobbyUpdated() {
    const rooms = Array.from(this.rooms.values())
    this.eventListeners.lobbyUpdated.forEach(callback => callback(rooms))
  }

  private notifyRoomUpdated(room: GameRoom) {
    this.eventListeners.roomUpdated.forEach(callback => callback(room))
  }

  private notifyPlayerJoined(roomId: string, player: RoomPlayer) {
    this.eventListeners.playerJoined.forEach(callback => callback(roomId, player))
  }

  private notifyPlayerLeft(roomId: string, playerId: string) {
    this.eventListeners.playerLeft.forEach(callback => callback(roomId, playerId))
  }

  private notifyGameStarted(roomId: string) {
    this.eventListeners.gameStarted.forEach(callback => callback(roomId))
  }

  // Public API
  async createRoom(data: CreateRoomData): Promise<GameRoom> {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) {
      throw new Error('Must be logged in to create a room')
    }

    const gameType = this.gameTypes.get(data.gameTypeId)
    if (!gameType) {
      throw new Error('Invalid game type')
    }

    // Check if user is already in a room
    const existingRoom = this.getUserRoom(currentUser.id)
    if (existingRoom) {
      throw new Error('You are already in a room. Leave your current room first.')
    }

    const roomId = this.generateId()
    const now = Date.now()

    const hostPlayer: RoomPlayer = {
      userId: currentUser.id,
      nickname: currentUser.nickname,
      joinedAt: now,
      isHost: true,
      isReady: false,
      status: 'connected',
      color: currentUser.color,
      lastSeen: now
    }

    const room: GameRoom = {
      id: roomId,
      gameTypeId: data.gameTypeId,
      gameTypeName: gameType.name,
      name: data.name,
      description: data.description,
      hostId: currentUser.id,
      hostNickname: currentUser.nickname,
      status: 'waiting',
      privacy: data.privacy,
      currentPlayers: 1,
      maxPlayers: data.maxPlayers || gameType.maxPlayers,
      minPlayers: gameType.minPlayers,
      players: [hostPlayer],
      settings: { ...DEFAULT_ROOM_SETTINGS, ...data.settings },
      createdAt: now,
      lastActivity: now,
      isPasswordProtected: !!data.password,
      password: data.password,
      meetupLocation: data.meetupLocation,
      meetupTime: data.meetupTime,
      meetupNotes: data.meetupNotes
    }

    this.rooms.set(roomId, room)
    this.saveToStorage()
    this.notifyLobbyUpdated()
    this.notifyRoomUpdated(room)

    return room
  }

  async joinRoom(data: JoinRoomData): Promise<{ success: boolean; room?: GameRoom; error?: string }> {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) {
      return { success: false, error: 'Must be logged in to join a room' }
    }

    const room = this.rooms.get(data.roomId)
    if (!room) {
      return { success: false, error: 'Room not found' }
    }

    // Check if user is already in this room
    if (room.players.some(p => p.userId === currentUser.id)) {
      return { success: true, room }
    }

    // Check if user is in another room
    const existingRoom = this.getUserRoom(currentUser.id)
    if (existingRoom && existingRoom.id !== data.roomId) {
      return { success: false, error: 'You are already in another room' }
    }

    // Check room capacity
    if (room.currentPlayers >= room.maxPlayers) {
      return { success: false, error: 'Room is full' }
    }

    // Check room status
    if (!['waiting', 'starting'].includes(room.status)) {
      return { success: false, error: 'Cannot join room in current status' }
    }

    // Check password
    if (room.isPasswordProtected && room.password !== data.password) {
      return { success: false, error: 'Incorrect password' }
    }

    // Add player to room
    const newPlayer: RoomPlayer = {
      userId: currentUser.id,
      nickname: currentUser.nickname,
      joinedAt: Date.now(),
      isHost: false,
      isReady: false,
      status: 'connected',
      color: currentUser.color,
      lastSeen: Date.now()
    }

    room.players.push(newPlayer)
    room.currentPlayers = room.players.length
    room.lastActivity = Date.now()

    this.rooms.set(data.roomId, room)
    this.saveToStorage()
    this.notifyLobbyUpdated()
    this.notifyRoomUpdated(room)
    this.notifyPlayerJoined(data.roomId, newPlayer)

    return { success: true, room }
  }

  async leaveRoom(roomId: string): Promise<void> {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) {
      throw new Error('Must be logged in to leave a room')
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    const playerIndex = room.players.findIndex(p => p.userId === currentUser.id)
    if (playerIndex === -1) {
      throw new Error('You are not in this room')
    }

    const wasHost = room.players[playerIndex].isHost

    // Remove player
    room.players.splice(playerIndex, 1)
    room.currentPlayers = room.players.length
    room.lastActivity = Date.now()

    // If no players left, mark room as abandoned
    if (room.players.length === 0) {
      room.status = 'abandoned'
      room.endedAt = Date.now()
    } else if (wasHost && room.players.length > 0) {
      // Transfer host to next player
      room.players[0].isHost = true
      room.hostId = room.players[0].userId
      room.hostNickname = room.players[0].nickname
    }

    this.rooms.set(roomId, room)
    this.saveToStorage()
    this.notifyLobbyUpdated()
    this.notifyRoomUpdated(room)
    this.notifyPlayerLeft(roomId, currentUser.id)
  }

  async deleteRoom(roomId: string): Promise<void> {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) {
      throw new Error('Must be logged in to delete a room')
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    if (room.hostId !== currentUser.id) {
      throw new Error('Only the host can delete the room')
    }

    room.status = 'cancelled'
    room.endedAt = Date.now()

    this.rooms.set(roomId, room)
    this.saveToStorage()
    this.notifyLobbyUpdated()
    this.notifyRoomUpdated(room)
  }

  async setPlayerReady(roomId: string, isReady: boolean): Promise<void> {
    const guestUserManager = getGuestUserManager()
    const currentUser = guestUserManager.getCurrentUser()
    
    if (!currentUser) {
      throw new Error('Must be logged in to set ready status')
    }

    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    const playerIndex = room.players.findIndex(p => p.userId === currentUser.id)
    if (playerIndex === -1) {
      throw new Error('You are not in this room')
    }

    room.players[playerIndex].isReady = isReady
    room.players[playerIndex].lastSeen = Date.now()
    room.lastActivity = Date.now()

    // Check if all players are ready and minimum players met
    const allReady = room.players.every(p => p.isReady)
    const hasMinPlayers = room.players.length >= room.minPlayers

    if (allReady && hasMinPlayers && room.settings.autoStart) {
      room.status = 'starting'
      // Auto-start after delay
      setTimeout(() => {
        this.startGame(roomId)
      }, room.settings.autoStartDelay * 1000)
    }

    this.rooms.set(roomId, room)
    this.saveToStorage()
    this.notifyRoomUpdated(room)
  }

  async startGame(roomId: string): Promise<void> {
    const room = this.rooms.get(roomId)
    if (!room) {
      throw new Error('Room not found')
    }

    if (room.players.length < room.minPlayers) {
      throw new Error('Not enough players to start the game')
    }

    room.status = 'active'
    room.startedAt = Date.now()
    room.lastActivity = Date.now()

    // Set all players to playing status
    room.players.forEach(player => {
      player.status = 'playing'
    })

    this.rooms.set(roomId, room)
    this.saveToStorage()
    this.notifyLobbyUpdated()
    this.notifyRoomUpdated(room)
    this.notifyGameStarted(roomId)
  }

  // Data retrieval methods
  getAllRooms(filters?: LobbyFilters): GameRoom[] {
    let rooms = Array.from(this.rooms.values())

    if (filters) {
      if (filters.gameType) {
        rooms = rooms.filter(room => room.gameTypeId === filters.gameType)
      }
      if (filters.status) {
        rooms = rooms.filter(room => filters.status!.includes(room.status))
      }
      if (filters.privacy) {
        rooms = rooms.filter(room => filters.privacy!.includes(room.privacy))
      }
      if (filters.hasSpace) {
        rooms = rooms.filter(room => room.currentPlayers < room.maxPlayers)
      }
      if (filters.minPlayers) {
        rooms = rooms.filter(room => room.minPlayers >= filters.minPlayers!)
      }
      if (filters.maxPlayers) {
        rooms = rooms.filter(room => room.maxPlayers <= filters.maxPlayers!)
      }
      if (filters.difficulty) {
        rooms = rooms.filter(room => {
          const gameType = this.gameTypes.get(room.gameTypeId)
          return gameType && filters.difficulty!.includes(gameType.difficulty)
        })
      }
      if (filters.category) {
        rooms = rooms.filter(room => {
          const gameType = this.gameTypes.get(room.gameTypeId)
          return gameType && filters.category!.includes(gameType.category)
        })
      }
    }

    return rooms.sort((a, b) => b.createdAt - a.createdAt)
  }

  getRoom(roomId: string): GameRoom | null {
    return this.rooms.get(roomId) || null
  }

  getUserRoom(userId: string): GameRoom | null {
    for (const room of this.rooms.values()) {
      if (room.players.some(p => p.userId === userId)) {
        return room
      }
    }
    return null
  }

  getGameTypes(): GameType[] {
    return Array.from(this.gameTypes.values()).filter(gt => gt.isActive)
  }

  getLobbyStats(): LobbyStats {
    const rooms = Array.from(this.rooms.values())
    const activeRooms = rooms.filter(r => ['waiting', 'starting', 'active'].includes(r.status))
    
    const gameTypeCounts = new Map<string, number>()
    let totalPlayers = 0

    activeRooms.forEach(room => {
      totalPlayers += room.currentPlayers
      const count = gameTypeCounts.get(room.gameTypeId) || 0
      gameTypeCounts.set(room.gameTypeId, count + 1)
    })

    const popularGameTypes = Array.from(gameTypeCounts.entries())
      .map(([gameTypeId, count]) => ({ gameTypeId, count }))
      .sort((a, b) => b.count - a.count)

    return {
      totalRooms: activeRooms.length,
      activeGames: rooms.filter(r => r.status === 'active').length,
      waitingRooms: rooms.filter(r => r.status === 'waiting').length,
      totalPlayers,
      averagePlayersPerRoom: activeRooms.length > 0 ? totalPlayers / activeRooms.length : 0,
      popularGameTypes
    }
  }

  // Event subscriptions
  subscribeToLobbyUpdates(callback: (rooms: GameRoom[]) => void): () => void {
    this.eventListeners.lobbyUpdated.push(callback)
    return () => {
      const index = this.eventListeners.lobbyUpdated.indexOf(callback)
      if (index > -1) {
        this.eventListeners.lobbyUpdated.splice(index, 1)
      }
    }
  }

  subscribeToRoomUpdates(roomId: string, callback: (room: GameRoom) => void): () => void {
    const wrappedCallback = (room: GameRoom) => {
      if (room.id === roomId) {
        callback(room)
      }
    }
    this.eventListeners.roomUpdated.push(wrappedCallback)
    return () => {
      const index = this.eventListeners.roomUpdated.indexOf(wrappedCallback)
      if (index > -1) {
        this.eventListeners.roomUpdated.splice(index, 1)
      }
    }
  }

  // Utility methods
  canJoinRoom(roomId: string, userId: string): { canJoin: boolean; reason?: string } {
    const room = this.rooms.get(roomId)
    if (!room) {
      return { canJoin: false, reason: 'Room not found' }
    }

    if (room.currentPlayers >= room.maxPlayers) {
      return { canJoin: false, reason: 'Room is full' }
    }

    if (!['waiting', 'starting'].includes(room.status)) {
      return { canJoin: false, reason: 'Game already in progress' }
    }

    if (room.players.some(p => p.userId === userId)) {
      return { canJoin: true }
    }

    const existingRoom = this.getUserRoom(userId)
    if (existingRoom && existingRoom.id !== roomId) {
      return { canJoin: false, reason: 'Already in another room' }
    }

    return { canJoin: true }
  }

  isRoomFull(roomId: string): boolean {
    const room = this.rooms.get(roomId)
    return room ? room.currentPlayers >= room.maxPlayers : true
  }

  getRoomPlayerCount(roomId: string): number {
    const room = this.rooms.get(roomId)
    return room ? room.currentPlayers : 0
  }

  cleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    if (this.activityInterval) {
      clearInterval(this.activityInterval)
    }
  }
}

// Singleton instance
let gameLobbyManagerInstance: GameLobbyManagerClass | null = null

export function getGameLobbyManager(): GameLobbyManagerClass {
  if (!gameLobbyManagerInstance) {
    gameLobbyManagerInstance = new GameLobbyManagerClass()
  }
  return gameLobbyManagerInstance
}

export { GameLobbyManagerClass } 