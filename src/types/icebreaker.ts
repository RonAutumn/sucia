// Ice Breaker Bingo Game Types

export interface PromptCategory {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Prompt {
  id: number;
  content: string;
  category_id?: number;
  difficulty_level: 1 | 2 | 3; // 1=easy, 2=medium, 3=hard
  appropriateness_level: 1 | 2 | 3 | 4 | 5; // 1=mild, 5=steamy
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: PromptCategory;
}

export type GameStatus = 'setup' | 'active' | 'paused' | 'completed';

export interface IcebreakerGame {
  id: number;
  name: string;
  room_code: string;
  status: GameStatus;
  max_players: number;
  min_players: number;
  created_by?: string;
  started_at?: string;
  ended_at?: string;
  settings: GameSettings;
  created_at: string;
  updated_at: string;
  players?: GamePlayer[];
  winners?: GameWinner[];
}

export interface GameSettings {
  time_limit?: number; // in minutes
  win_conditions: ('line' | 'four_corners' | 'full_card')[];
  prompt_categories?: number[];
  appropriateness_level_max?: number;
  allow_manual_verification?: boolean;
}

export interface GamePlayer {
  id: number;
  game_id: number;
  player_nickname: string;
  player_session_id?: string;
  joined_at: string;
  is_active: boolean;
  bingo_card?: BingoCard;
  progress?: PlayerProgress[];
}

export interface BingoCard {
  id: number;
  game_id: number;
  player_id: number;
  card_data: BingoCardData;
  created_at: string;
}

export interface BingoCardData {
  grid: BingoSquare[][];
  center_free: boolean;
}

export interface BingoSquare {
  position: number; // 0-24 for 5x5 grid
  prompt?: Prompt;
  is_free?: boolean; // for center square
  is_completed?: boolean;
  completed_at?: string;
}

export interface PlayerProgress {
  id: number;
  game_id: number;
  player_id: number;
  card_id: number;
  square_position: number;
  prompt_id?: number;
  completed_at: string;
  verified_by?: string;
}

export type WinPattern = 'horizontal' | 'vertical' | 'diagonal' | 'four_corners' | 'full_card';

export interface GameWinner {
  id: number;
  game_id: number;
  player_id: number;
  win_pattern: WinPattern;
  completed_at: string;
  player?: GamePlayer;
}

export interface AdminAction {
  id: number;
  game_id?: number;
  admin_nickname?: string;
  action_type: string;
  action_details: Record<string, any>;
  created_at: string;
}

// UI State Types
export interface IcebreakerGameState {
  currentGame?: IcebreakerGame;
  isLoading: boolean;
  error?: string;
  players: GamePlayer[];
  myPlayer?: GamePlayer;
  myCard?: BingoCard;
  winners: GameWinner[];
}

export interface PromptLibraryState {
  prompts: Prompt[];
  categories: PromptCategory[];
  isLoading: boolean;
  error?: string;
  filters: {
    category?: number;
    difficulty?: number;
    appropriateness_max?: number;
  };
}

// Admin Interface Types
export interface AdminGameControls {
  startGame: (gameId: number) => Promise<void>;
  pauseGame: (gameId: number) => Promise<void>;
  endGame: (gameId: number) => Promise<void>;
  kickPlayer: (gameId: number, playerId: number) => Promise<void>;
  verifySquare: (progressId: number) => Promise<void>;
  resetGame: (gameId: number) => Promise<void>;
}

// Game Creation Types
export interface CreateGameRequest {
  name: string;
  max_players?: number;
  min_players?: number;
  settings: GameSettings;
}

export interface JoinGameRequest {
  room_code: string;
  player_nickname: string;
  player_session_id?: string;
}

// API Response Types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface GameListResponse {
  games: IcebreakerGame[];
  total: number;
  page: number;
  limit: number;
}

// Event Types for Real-time Updates
export type GameEvent = 
  | { type: 'player_joined'; data: GamePlayer }
  | { type: 'player_left'; data: { player_id: number } }
  | { type: 'square_completed'; data: PlayerProgress }
  | { type: 'game_status_changed'; data: { status: GameStatus } }
  | { type: 'winner_announced'; data: GameWinner }
  | { type: 'game_started'; data: { started_at: string } }
  | { type: 'game_ended'; data: { ended_at: string } };

// Utility Types
export type DifficultyLevel = 1 | 2 | 3;
export type AppropriatenessLevel = 1 | 2 | 3 | 4 | 5;

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  1: 'Easy',
  2: 'Medium', 
  3: 'Hard'
};

export const APPROPRIATENESS_LABELS: Record<AppropriatenessLevel, string> = {
  1: 'Mild',
  2: 'Moderate',
  3: 'Spicy',
  4: 'Steamy',
  5: 'Very Hot'
};

export const WIN_PATTERN_LABELS: Record<WinPattern, string> = {
  'horizontal': 'Horizontal Line',
  'vertical': 'Vertical Line', 
  'diagonal': 'Diagonal Line',
  'four_corners': 'Four Corners',
  'full_card': 'Full Card'
}; 