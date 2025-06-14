// Game Lobby and Room Management Types

export interface GameType {
  id: string
  name: string
  description: string
  minPlayers: number
  maxPlayers: number
  estimatedDuration: number // in minutes
  difficulty: GameDifficulty
  category: GameCategory
  icon?: string
  color?: string
  isActive: boolean
  rules?: string[]
  requirements?: string[] // What players need to bring or prepare
  isPhysical: boolean // true for real-life games, false for digital games
  location?: string // suggested location type (e.g., "table", "living room", "outdoor")
}

export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'expert'
export type GameCategory = 'card' | 'board' | 'party' | 'strategy' | 'trivia' | 'action'

export interface GameRoom {
  id: string
  gameTypeId: string
  gameTypeName: string
  name: string
  description?: string
  hostId: string
  hostNickname: string
  status: RoomStatus
  privacy: RoomPrivacy
  currentPlayers: number
  maxPlayers: number
  minPlayers: number
  players: RoomPlayer[]
  settings: GameRoomSettings
  createdAt: number
  startedAt?: number
  endedAt?: number
  lastActivity: number
  isPasswordProtected: boolean
  password?: string
  // Physical meetup details for real-life games
  meetupLocation?: string // Where to meet for physical games
  meetupTime?: number // Scheduled time for the game
  meetupNotes?: string // Additional instructions for meeting up
}

export type RoomStatus = 
  | 'waiting'     // Waiting for players to join
  | 'starting'    // Game is about to start
  | 'active'      // Game is currently in progress
  | 'paused'      // Game is temporarily paused
  | 'completed'   // Game has finished
  | 'cancelled'   // Game was cancelled
  | 'abandoned'   // Game was abandoned due to inactivity

export type RoomPrivacy = 'public' | 'private' | 'friends-only'

export interface RoomPlayer {
  userId: string
  nickname: string
  joinedAt: number
  isHost: boolean
  isReady: boolean
  status: PlayerStatus
  color?: string
  avatar?: string
  lastSeen: number
}

export type PlayerStatus = 'connected' | 'disconnected' | 'away' | 'playing'

export interface GameRoomSettings {
  allowSpectators: boolean
  autoStart: boolean
  autoStartDelay: number // seconds
  maxSpectators: number
  gameVariant?: string
  customRules?: Record<string, any>
  timeLimit?: number // minutes per game
  turnTimeLimit?: number // seconds per turn
  difficulty?: GameDifficulty
}

export interface CreateRoomData {
  gameTypeId: string
  name: string
  description?: string
  privacy: RoomPrivacy
  password?: string
  maxPlayers?: number
  settings?: Partial<GameRoomSettings>
  // Physical meetup details
  meetupLocation?: string
  meetupTime?: number
  meetupNotes?: string
}

export interface JoinRoomData {
  roomId: string
  password?: string
}

export interface LobbyFilters {
  gameType?: string
  status?: RoomStatus[]
  privacy?: RoomPrivacy[]
  hasSpace?: boolean
  minPlayers?: number
  maxPlayers?: number
  difficulty?: GameDifficulty[]
  category?: GameCategory[]
}

export interface LobbyStats {
  totalRooms: number
  activeGames: number
  waitingRooms: number
  totalPlayers: number
  averagePlayersPerRoom: number
  popularGameTypes: { gameTypeId: string; count: number }[]
}

export interface GameLobbyManager {
  // Room management
  createRoom: (data: CreateRoomData) => Promise<GameRoom>
  joinRoom: (data: JoinRoomData) => Promise<{ success: boolean; room?: GameRoom; error?: string }>
  leaveRoom: (roomId: string) => Promise<void>
  deleteRoom: (roomId: string) => Promise<void>
  
  // Room operations
  updateRoomSettings: (roomId: string, settings: Partial<GameRoomSettings>) => Promise<void>
  setPlayerReady: (roomId: string, isReady: boolean) => Promise<void>
  kickPlayer: (roomId: string, playerId: string) => Promise<void>
  transferHost: (roomId: string, newHostId: string) => Promise<void>
  startGame: (roomId: string) => Promise<void>
  
  // Data retrieval
  getAllRooms: (filters?: LobbyFilters) => GameRoom[]
  getRoom: (roomId: string) => GameRoom | null
  getUserRoom: (userId: string) => GameRoom | null
  getGameTypes: () => GameType[]
  getLobbyStats: () => LobbyStats
  
  // Real-time updates
  subscribeToLobbyUpdates: (callback: (rooms: GameRoom[]) => void) => () => void
  subscribeToRoomUpdates: (roomId: string, callback: (room: GameRoom) => void) => () => void
  
  // Utility
  canJoinRoom: (roomId: string, userId: string) => { canJoin: boolean; reason?: string }
  isRoomFull: (roomId: string) => boolean
  getRoomPlayerCount: (roomId: string) => number
  cleanup: () => void
}

export interface PlayerMatchingResult {
  success: boolean
  roomId?: string
  position?: number
  estimatedWaitTime?: number
  error?: string
}

export interface RoomInvite {
  id: string
  roomId: string
  fromUserId: string
  fromNickname: string
  toUserId: string
  toNickname: string
  message?: string
  createdAt: number
  expiresAt: number
  status: InviteStatus
}

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled' 