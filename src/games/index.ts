// Games Platform Module - Centralized exports
// Modular architecture for interactive group games and icebreakers

// Core hooks
export { useGameState } from '../hooks/useGameState';
export { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
export { useParticipantManager } from './hooks/useParticipantManager';
export { useGameModeration } from './hooks/useGameModeration';

// Components - Desktop/Original
export { default as GamesPlatform } from '../components/GamesPlatform';
export { default as GameLobby } from '../components/GameLobby';

// Components - Mobile-Optimized
export { default as MobileGamesPlatform } from './components/MobileGamesPlatform';
export { default as MobileGameLobby } from './components/MobileGameLobby';

// Components - Accessibility & Responsive
export { AccessibilityProvider, useAccessibility } from './components/AccessibilityProvider';
export { 
  ResponsiveLayout, 
  ResponsiveShow, 
  ResponsiveContainer, 
  useResponsive 
} from './components/ResponsiveLayout';

// Game moderation and management components
// export { default as GameModerator } from './components/GameModerator';
// export { default as GameResults } from './components/GameResults';

// Game-type specific components
export { default as PollGame } from './components/game-types/PollGame';
export { default as TriviaGame } from './components/game-types/TriviaGame';
export { default as IcebreakerGame } from './components/game-types/IcebreakerGame';
export { default as BingoGame } from './components/game-types/BingoGame';
export { default as UnoGame } from './components/game-types/UnoGame';

// Utilities
export { createGameStateManager } from '../utils/gameStateManager';
export { gameScoreCalculator } from './utils/gameScoreCalculator';
export { gameModerationTools } from './utils/gameModerationTools';
export { gameAuditLogger } from './utils/gameAuditLogger';
export { UnoGameEngine } from './utils/unoGameEngine';

// Types (re-export from main types)
export type {
  Game,
  Poll,
  Trivia,
  Icebreaker,
  Bingo,
  GameVote,
  GameOption,
  TriviaQuestion,
  IcebreakerPrompt,
  BingoCell
} from '../types'; 