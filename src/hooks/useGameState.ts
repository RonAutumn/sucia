import { useState, useEffect, useCallback } from 'react';
import { Game, GameVote } from '../types';

// Storage key patterns following existing conventions
const GAME_STATE_KEY = 'gameState';
const GAME_VOTES_KEY = 'gameVotes';
const GAME_PARTICIPANTS_KEY = 'gameParticipants';

interface GameState {
  activeGame: Game | null;
  votes: GameVote[];
  participants: string[]; // guest IDs
  lastUpdated: number;
}

interface GameStateManagerResult {
  gameState: GameState;
  launchGame: (game: Game) => void;
  stopGame: () => void;
  joinGame: (guestId: string) => void;
  leaveGame: (guestId: string) => void;
  submitVote: (vote: Omit<GameVote, 'timestamp'>) => void;
  updateGameSettings: (settings: Partial<Game['settings']>) => void;
  isParticipant: (guestId: string) => boolean;
  getGameVotes: (guestId?: string) => GameVote[];
  clearGameData: () => void;
  syncFromStorage: () => void;
}

/**
 * Manages game state with localStorage persistence and cross-tab synchronization
 * Follows existing app patterns for data persistence and session management
 */
export function useGameState(eventId: string): GameStateManagerResult {
  const getStorageKey = (suffix: string) => `${suffix}-${eventId}`;
  
  const [gameState, setGameState] = useState<GameState>({
    activeGame: null,
    votes: [],
    participants: [],
    lastUpdated: Date.now()
  });

  // Load initial state from localStorage
  useEffect(() => {
    syncFromStorage();
  }, [eventId]);

  // Cross-tab synchronization listener
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key?.startsWith(getStorageKey(GAME_STATE_KEY))) {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [eventId]);

  const syncFromStorage = useCallback(() => {
    try {
      const storedGameState = localStorage.getItem(getStorageKey(GAME_STATE_KEY));
      const storedVotes = localStorage.getItem(getStorageKey(GAME_VOTES_KEY));
      const storedParticipants = localStorage.getItem(getStorageKey(GAME_PARTICIPANTS_KEY));

      const newGameState: GameState = {
        activeGame: storedGameState ? JSON.parse(storedGameState) : null,
        votes: storedVotes ? JSON.parse(storedVotes) : [],
        participants: storedParticipants ? JSON.parse(storedParticipants) : [],
        lastUpdated: Date.now()
      };

      setGameState(newGameState);
    } catch (error) {
      console.error('Failed to sync game state from storage:', error);
    }
  }, [eventId]);

  const persistGameState = useCallback((newState: Partial<GameState>) => {
    try {
      const updatedState = { ...gameState, ...newState, lastUpdated: Date.now() };
      
      if (updatedState.activeGame) {
        localStorage.setItem(getStorageKey(GAME_STATE_KEY), JSON.stringify(updatedState.activeGame));
      } else {
        localStorage.removeItem(getStorageKey(GAME_STATE_KEY));
      }
      
      localStorage.setItem(getStorageKey(GAME_VOTES_KEY), JSON.stringify(updatedState.votes));
      localStorage.setItem(getStorageKey(GAME_PARTICIPANTS_KEY), JSON.stringify(updatedState.participants));
      
      setGameState(updatedState);
    } catch (error) {
      console.error('Failed to persist game state:', error);
    }
  }, [gameState, eventId]);

  const launchGame = useCallback((game: Game) => {
    const updatedGame = {
      ...game,
      isActive: true,
      eventId,
      participants: []
    };
    
    persistGameState({
      activeGame: updatedGame,
      votes: [],
      participants: []
    });
  }, [eventId, persistGameState]);

  const stopGame = useCallback(() => {
    if (gameState.activeGame) {
      const stoppedGame = { ...gameState.activeGame, isActive: false };
      persistGameState({ activeGame: stoppedGame });
    }
  }, [gameState.activeGame, persistGameState]);

  const joinGame = useCallback((guestId: string) => {
    if (!gameState.activeGame) return;
    
    if (!gameState.participants.includes(guestId)) {
      const updatedParticipants = [...gameState.participants, guestId];
      const updatedGame = {
        ...gameState.activeGame,
        participants: updatedParticipants
      };
      
      persistGameState({
        activeGame: updatedGame,
        participants: updatedParticipants
      });
    }
  }, [gameState, persistGameState]);

  const leaveGame = useCallback((guestId: string) => {
    if (!gameState.activeGame) return;
    
    const updatedParticipants = gameState.participants.filter(id => id !== guestId);
    const updatedVotes = gameState.votes.filter(vote => vote.guestId !== guestId);
    const updatedGame = {
      ...gameState.activeGame,
      participants: updatedParticipants
    };
    
    persistGameState({
      activeGame: updatedGame,
      participants: updatedParticipants,
      votes: updatedVotes
    });
  }, [gameState, persistGameState]);

  const submitVote = useCallback((vote: Omit<GameVote, 'timestamp'>) => {
    if (!gameState.activeGame) return;
    
    const newVote: GameVote = {
      ...vote,
      timestamp: new Date()
    };
    
    // Remove any existing vote from this guest for this game
    const filteredVotes = gameState.votes.filter(
      v => !(v.guestId === vote.guestId && v.gameId === vote.gameId)
    );
    
    const updatedVotes = [...filteredVotes, newVote];
    persistGameState({ votes: updatedVotes });
  }, [gameState, persistGameState]);

  const updateGameSettings = useCallback((settings: Partial<Game['settings']>) => {
    if (!gameState.activeGame) return;
    
    const updatedGame = {
      ...gameState.activeGame,
      settings: { ...gameState.activeGame.settings, ...settings }
    };
    
    persistGameState({ activeGame: updatedGame });
  }, [gameState.activeGame, persistGameState]);

  const isParticipant = useCallback((guestId: string): boolean => {
    return gameState.participants.includes(guestId);
  }, [gameState.participants]);

  const getGameVotes = useCallback((guestId?: string): GameVote[] => {
    if (!gameState.activeGame) return [];
    
    let votes = gameState.votes.filter(vote => vote.gameId === gameState.activeGame!.id);
    
    if (guestId) {
      votes = votes.filter(vote => vote.guestId === guestId);
    }
    
    return votes;
  }, [gameState]);

  const clearGameData = useCallback(() => {
    try {
      localStorage.removeItem(getStorageKey(GAME_STATE_KEY));
      localStorage.removeItem(getStorageKey(GAME_VOTES_KEY));
      localStorage.removeItem(getStorageKey(GAME_PARTICIPANTS_KEY));
      
      setGameState({
        activeGame: null,
        votes: [],
        participants: [],
        lastUpdated: Date.now()
      });
    } catch (error) {
      console.error('Failed to clear game data:', error);
    }
  }, [eventId]);

  return {
    gameState,
    launchGame,
    stopGame,
    joinGame,
    leaveGame,
    submitVote,
    updateGameSettings,
    isParticipant,
    getGameVotes,
    clearGameData,
    syncFromStorage
  };
} 