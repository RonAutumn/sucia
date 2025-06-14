// Generic game state types
export interface BaseGameState {
  gameId: string
  status: GameSessionStatus
  createdAt: string
  updatedAt: string
  players: GamePlayer[]
  maxPlayers: number
  currentTurn?: string // player ID
  winner?: string // player ID
  settings: GameSettings
}

export interface GamePlayer {
  id: string
  name: string
  isHost: boolean
  isActive: boolean
  joinedAt: string
  score?: number
  position?: number
}

export interface GameSettings {
  gameType: string
  difficulty?: 'easy' | 'medium' | 'hard'
  timeLimit?: number // in minutes
  maxRounds?: number
  customRules?: Record<string, any>
}

export type GameSessionStatus = 'waiting' | 'starting' | 'active' | 'paused' | 'finished' | 'cancelled'

// Uno specific types
export interface UnoGameState extends BaseGameState {
  gameType: 'uno'
  deck: UnoCard[]
  discardPile: UnoCard[]
  currentCard: UnoCard
  direction: 'clockwise' | 'counterclockwise'
  drawStack: number // for +2/+4 stacking
  lastAction?: UnoAction
  playerHands: Record<string, UnoCard[]>
  unoCallouts: Record<string, boolean> // track who called "Uno"
}

export interface UnoCard {
  id: string
  color: UnoColor | 'wild'
  type: UnoCardType
  value?: number
  isWild?: boolean
  chosenColor?: UnoColor // for wild cards after color choice
}

export type UnoColor = 'red' | 'blue' | 'green' | 'yellow'

export type UnoCardType = 
  | 'number'
  | 'skip'
  | 'reverse'
  | 'draw_two'
  | 'wild'
  | 'wild_draw_four'

export interface UnoAction {
  type: UnoActionType
  playerId: string
  timestamp: string
  card?: UnoCard
  chosenColor?: UnoColor
  targetPlayer?: string
  drawnCards?: number
}

export type UnoActionType = 
  | 'play_card'
  | 'draw_card'
  | 'choose_color'
  | 'call_uno'
  | 'challenge_uno'
  | 'skip_turn'
  | 'forfeit'

export interface UnoPlayerState {
  playerId: string
  handSize: number
  canPlay: boolean
  hasCalledUno: boolean
  skippedTurns: number
}

// Arcade game types
export interface ArcadeGameState extends BaseGameState {
  gameType: 'arcade'
  currentLevel: number
  lives: number
  score: number
  highScore: number
  powerUps: PowerUp[]
  gameMode: 'single' | 'versus' | 'coop'
}

export interface PowerUp {
  id: string
  type: string
  duration: number
  effect: Record<string, any>
  activatedAt?: string
}

// VR game types
export interface VRGameState extends BaseGameState {
  gameType: 'vr'
  environment: string
  difficulty: 'beginner' | 'intermediate' | 'expert'
  controls: VRControlScheme
  safetySettings: VRSafetySettings
}

export interface VRControlScheme {
  movement: 'teleport' | 'smooth' | 'room_scale'
  comfort: 'comfort' | 'normal' | 'intense'
  dominantHand: 'left' | 'right'
}

export interface VRSafetySettings {
  boundaries: boolean
  snapTurn: boolean
  vignetteReduction: boolean
  heightAdjustment: number
}

// PC game types
export interface PCGameState extends BaseGameState {
  gameType: 'pc'
  genre: string
  platform: 'steam' | 'epic' | 'origin' | 'gog' | 'custom'
  graphicsSettings: GraphicsSettings
  controls: PCControlScheme
}

export interface GraphicsSettings {
  resolution: string
  quality: 'low' | 'medium' | 'high' | 'ultra'
  framerate: number
  vsync: boolean
  rayTracing: boolean
}

export interface PCControlScheme {
  type: 'keyboard_mouse' | 'controller'
  keyBindings?: Record<string, string>
  sensitivity?: number
  invertY?: boolean
}

// Console game types
export interface ConsoleGameState extends BaseGameState {
  gameType: 'console'
  platform: 'ps5' | 'xbox' | 'switch' | 'ps4' | 'xbox_one'
  controllers: ControllerConfig[]
  splitScreen?: boolean
}

export interface ControllerConfig {
  playerId: string
  controllerType: string
  vibration: boolean
  audioOutput: 'tv' | 'headset' | 'controller'
}

// Game room types
export interface GameRoom {
  id: string
  name: string
  gameType: string
  hostId: string
  players: GamePlayer[]
  maxPlayers: number
  isPrivate: boolean
  password?: string
  status: 'waiting' | 'starting' | 'active' | 'finished'
  settings: GameSettings
  createdAt: string
  expiresAt?: string
}

export interface GameInvite {
  id: string
  roomId: string
  fromPlayer: string
  toPlayer: string
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  createdAt: string
  expiresAt: string
  message?: string
}

// Tournament types
export interface Tournament {
  id: string
  name: string
  gameType: string
  format: 'single_elimination' | 'double_elimination' | 'round_robin' | 'swiss'
  status: 'registration' | 'active' | 'completed' | 'cancelled'
  maxParticipants: number
  registeredPlayers: TournamentPlayer[]
  brackets?: TournamentBracket[]
  prizes: TournamentPrize[]
  rules: string
  startTime: string
  endTime?: string
  registrationDeadline: string
  entryFee?: number
}

export interface TournamentPlayer {
  playerId: string
  playerName: string
  registeredAt: string
  seed?: number
  currentRound?: number
  wins: number
  losses: number
  eliminated: boolean
}

export interface TournamentBracket {
  id: string
  round: number
  match: number
  player1?: string
  player2?: string
  winner?: string
  score?: string
  scheduledTime?: string
  completedAt?: string
}

export interface TournamentPrize {
  position: number
  description: string
  value?: number
  type: 'cash' | 'credit' | 'item' | 'trophy'
}

// Game statistics
export interface GameStats {
  playerId: string
  gameType: string
  totalGames: number
  wins: number
  losses: number
  winRate: number
  averageGameDuration: number
  bestStreak: number
  currentStreak: number
  totalPlayTime: number
  achievements: Achievement[]
  ranking?: number
  elo?: number
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlockedAt: string
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  points: number
}

// Utility types for game management
export type GameStateUnion = 
  | UnoGameState 
  | ArcadeGameState 
  | VRGameState 
  | PCGameState 
  | ConsoleGameState

export interface GameCommand<T = any> {
  type: string
  playerId: string
  gameId: string
  payload: T
  timestamp: string
}

export interface GameEvent<T = any> {
  type: string
  gameId: string
  data: T
  timestamp: string
  broadcastTo?: 'all' | 'players' | 'spectators' | string[]
}

// Form types for game creation
export interface CreateGameRoomForm {
  name: string
  gameType: string
  maxPlayers: number
  isPrivate: boolean
  password?: string
  settings: Partial<GameSettings>
}

export interface JoinGameRoomForm {
  roomId: string
  password?: string
  playerName: string
}

export interface GameSessionForm {
  gameId: string
  duration?: number
  notes?: string
} 