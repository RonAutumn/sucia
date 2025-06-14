// Database types
export * from './database'

// Core business logic interfaces
export * from './interfaces'

// Game-specific types
export * from './game-types'

// Re-export commonly used types with cleaner names (prefixed to avoid conflicts with legacy types)
export type {
  Game as SuciaGame,
  Service,
  ServiceQueue,
  CheckIn,
  GameSession,
  GameWithDetails,
  ServiceWithQueue,
  QueueEntryWithDetails,
  CheckInWithDetails,
  GameSessionWithDetails,
  ApiResponse,
  PaginatedResponse,
  ApiError,
  RealtimeEvent,
  DashboardStats,
  GameAnalytics,
  Notification,
  UserPreferences,
  CrudOperations
} from './interfaces'

export type {
  UnoGameState,
  UnoCard,
  UnoAction,
  ArcadeGameState,
  VRGameState,
  PCGameState,
  ConsoleGameState,
  GameRoom,
  Tournament,
  GameStats,
  Achievement,
  GameStateUnion,
  GameCommand,
  GameEvent
} from './game-types'

// Union types for easy reference
export type {
  GameStatus,
  ServiceStatus,
  QueueStatus,
  CheckInStatus,
  SessionStatus,
  GameType,
  ServiceType,
  CheckInType
} from './interfaces'

export type {
  UnoColor,
  UnoCardType,
  UnoActionType,
  GameSessionStatus
} from './game-types'

export type {
  GameSessionStatus as GameStateStatus
} from './game-types'

// Legacy event management types (keeping for backward compatibility)
export interface Game {
  id: string;
  title: string;
  type: 'poll' | 'trivia' | 'icebreaker' | 'bingo';
  description: string;
  isActive: boolean;
  createdAt: Date;
  eventId: string;
  staffId: string;
  participants: string[]; // guest IDs
  settings: {
    allowOptOut: boolean;
    showResults: boolean;
    timeLimit?: number; // seconds
    contentWarning?: string;
  };
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  checkedIn: boolean;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  guestList: Guest[];
}

// CSV Import related types
export interface CSVGuest {
  firstName: string;
  lastName: string;
  email: string;
  ticketType?: string;
  orderId?: string;
}

export interface CSVValidationError {
  row: number;
  field: string;
  value: string;
  message: string;
}

export interface CSVImportResult {
  valid: CSVGuest[];
  duplicates: CSVGuest[];
  invalid: CSVValidationError[];
  totalRows: number;
}

export interface CSVUploadProgress {
  stage: 'uploading' | 'parsing' | 'validating' | 'importing' | 'complete';
  progress: number;
  message: string;
}

export interface DuplicateHandlingOption {
  action: 'skip' | 'merge' | 'replace';
  guest: CSVGuest;
  existingGuest?: Guest;
}

// Game Types for Interactive Platform
export interface GameOption {
  id: string;
  text: string;
  votes: number;
}

export interface Poll extends Game {
  type: 'poll';
  question: string;
  options: GameOption[];
  allowMultipleChoice: boolean;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Trivia extends Game {
  type: 'trivia';
  questions: TriviaQuestion[];
  currentQuestionIndex: number;
  scores: { [guestId: string]: number };
}

export interface IcebreakerPrompt {
  id: string;
  prompt: string;
  category: 'spicy' | 'mild' | 'deep' | 'fun';
  responses: { [guestId: string]: string };
}

export interface Icebreaker extends Game {
  type: 'icebreaker';
  prompts: IcebreakerPrompt[];
  currentPromptIndex: number;
}

export interface BingoCell {
  id: string;
  text: string;
  marked: boolean;
}

export interface Bingo extends Game {
  type: 'bingo';
  cells: BingoCell[];
  winners: string[]; // guest IDs
}

export interface GameVote {
  gameId: string;
  guestId: string;
  optionId?: string;
  response?: string;
  timestamp: Date;
}

// Legacy types that were missing
export interface PollOption {
  id: string;
  text: string;
  votes: number;
}

export interface BingoItem {
  id: string;
  text: string;
  marked: boolean;
}

// CSV related types that were missing
export interface CsvUploadResult {
  success: boolean;
  message: string;
  data?: any[];
}

export interface CsvFieldMapping {
  [key: string]: string;
} 