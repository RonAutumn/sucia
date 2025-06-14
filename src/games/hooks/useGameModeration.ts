import { useState, useEffect, useCallback } from 'react';
import { createGameStateManager } from '../../utils/gameStateManager';
import { Game, GameVote } from '../../types';

interface ModerationAction {
  id: string;
  action: 'warn' | 'mute' | 'remove' | 'block_content' | 'pause_game' | 'end_game';
  guestId?: string;
  reason: string;
  staffId: string;
  timestamp: Date;
  gameId: string;
}

interface ModerationSettings {
  autoFilter: boolean;
  requireStaffApproval: boolean;
  maxParticipants: number;
  allowLateJoin: boolean;
  contentWarningRequired: boolean;
}

interface GameModerationResult {
  moderationActions: ModerationAction[];
  moderationSettings: ModerationSettings;
  flaggedContent: GameVote[];
  pauseGame: (reason: string) => Promise<boolean>;
  resumeGame: () => Promise<boolean>;
  removeParticipant: (guestId: string, reason: string) => Promise<boolean>;
  flagContent: (voteId: string, reason: string) => Promise<boolean>;
  unflagContent: (voteId: string) => Promise<boolean>;
  updateModerationSettings: (settings: Partial<ModerationSettings>) => void;
  getModerationHistory: (guestId?: string) => ModerationAction[];
  isGamePaused: boolean;
  canModerate: (staffId: string) => boolean;
  exportModerationLog: () => string;
}

// Content filtering patterns (basic implementation)
const CONTENT_FILTERS = [
  /\b(hate|harassment|abuse)\b/i,
  /\b(inappropriate|offensive)\b/i,
  // Add more patterns as needed for content moderation
];

/**
 * Hook for staff moderation controls and oversight
 * Provides tools for content moderation, participant management, and session control
 */
export function useGameModeration(
  eventId: string,
  game: Game | null,
  staffId: string = 'staff-default'
): GameModerationResult {
  const [moderationActions, setModerationActions] = useState<ModerationAction[]>([]);
  const [moderationSettings, setModerationSettings] = useState<ModerationSettings>({
    autoFilter: true,
    requireStaffApproval: false,
    maxParticipants: 50,
    allowLateJoin: true,
    contentWarningRequired: false
  });
  const [flaggedContent, setFlaggedContent] = useState<GameVote[]>([]);
  const [isGamePaused, setIsGamePaused] = useState(false);

  const gameStateManager = createGameStateManager(eventId);

  // Load initial moderation data
  useEffect(() => {
    if (!game) return;

    // Load moderation actions
    const actionsKey = `gameModeration-${eventId}-${game.id}`;
    const storedActions = localStorage.getItem(actionsKey);
    if (storedActions) {
      try {
        const parsed = JSON.parse(storedActions);
        const actions = parsed.map((action: any) => ({
          ...action,
          timestamp: new Date(action.timestamp)
        }));
        setModerationActions(actions);
      } catch (error) {
        console.error('Failed to load moderation actions:', error);
      }
    }

    // Load moderation settings
    const settingsKey = `gameModerationSettings-${eventId}-${game.id}`;
    const storedSettings = localStorage.getItem(settingsKey);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setModerationSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Failed to load moderation settings:', error);
      }
    }

    // Load flagged content
    const flaggedKey = `gameFlagged-${eventId}-${game.id}`;
    const storedFlagged = localStorage.getItem(flaggedKey);
    if (storedFlagged) {
      try {
        const parsed = JSON.parse(storedFlagged);
        const flagged = parsed.map((vote: any) => ({
          ...vote,
          timestamp: new Date(vote.timestamp)
        }));
        setFlaggedContent(flagged);
      } catch (error) {
        console.error('Failed to load flagged content:', error);
      }
    }

    // Check if game is paused
    const pausedKey = `gamePaused-${eventId}-${game.id}`;
    const isPaused = localStorage.getItem(pausedKey) === 'true';
    setIsGamePaused(isPaused);
  }, [eventId, game?.id]);

  // Persist moderation data
  const persistModerationData = useCallback(() => {
    if (!game) return;

    const actionsKey = `gameModeration-${eventId}-${game.id}`;
    localStorage.setItem(actionsKey, JSON.stringify(moderationActions));

    const settingsKey = `gameModerationSettings-${eventId}-${game.id}`;
    localStorage.setItem(settingsKey, JSON.stringify(moderationSettings));

    const flaggedKey = `gameFlagged-${eventId}-${game.id}`;
    localStorage.setItem(flaggedKey, JSON.stringify(flaggedContent));

    const pausedKey = `gamePaused-${eventId}-${game.id}`;
    localStorage.setItem(pausedKey, isGamePaused.toString());
  }, [eventId, game, moderationActions, moderationSettings, flaggedContent, isGamePaused]);

  // Auto-persist when data changes
  useEffect(() => {
    persistModerationData();
  }, [persistModerationData]);

  const addModerationAction = useCallback((action: Omit<ModerationAction, 'id' | 'timestamp'>) => {
    const newAction: ModerationAction = {
      ...action,
      id: `mod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    };

    setModerationActions(prev => [...prev, newAction]);

    // Log to audit trail
    gameStateManager.logAudit({
      action: 'game_moderated',
      gameId: action.gameId,
      staffId: action.staffId,
      guestId: action.guestId,
      details: {
        moderationAction: action.action,
        reason: action.reason
      }
    });

    return newAction;
  }, [gameStateManager]);

  const pauseGame = useCallback(async (reason: string): Promise<boolean> => {
    if (!game) return false;

    try {
      setIsGamePaused(true);
      addModerationAction({
        action: 'pause_game',
        reason,
        staffId,
        gameId: game.id
      });
      return true;
    } catch (error) {
      console.error('Failed to pause game:', error);
      return false;
    }
  }, [game, staffId, addModerationAction]);

  const resumeGame = useCallback(async (): Promise<boolean> => {
    if (!game) return false;

    try {
      setIsGamePaused(false);
      addModerationAction({
        action: 'pause_game',
        reason: 'Game resumed',
        staffId,
        gameId: game.id
      });
      return true;
    } catch (error) {
      console.error('Failed to resume game:', error);
      return false;
    }
  }, [game, staffId, addModerationAction]);

  const removeParticipant = useCallback(async (guestId: string, reason: string): Promise<boolean> => {
    if (!game) return false;

    try {
      const success = gameStateManager.removeParticipant(game.id, guestId, staffId);
      if (success) {
        addModerationAction({
          action: 'remove',
          guestId,
          reason,
          staffId,
          gameId: game.id
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove participant:', error);
      return false;
    }
  }, [game, staffId, gameStateManager, addModerationAction]);

  const flagContent = useCallback(async (voteId: string, reason: string): Promise<boolean> => {
    if (!game) return false;

    try {
      // Find the vote in game votes
      const gameVotes = gameStateManager.loadGameVotes(game.id);
      const vote = gameVotes.find(v => `${v.gameId}_${v.guestId}_${v.timestamp.getTime()}` === voteId);
      
      if (vote && !flaggedContent.some(f => `${f.gameId}_${f.guestId}_${f.timestamp.getTime()}` === voteId)) {
        setFlaggedContent(prev => [...prev, vote]);
        addModerationAction({
          action: 'block_content',
          guestId: vote.guestId,
          reason,
          staffId,
          gameId: game.id
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to flag content:', error);
      return false;
    }
  }, [game, flaggedContent, gameStateManager, addModerationAction, staffId]);

  const unflagContent = useCallback(async (voteId: string): Promise<boolean> => {
    if (!game) return false;

    try {
      setFlaggedContent(prev => 
        prev.filter(vote => `${vote.gameId}_${vote.guestId}_${vote.timestamp.getTime()}` !== voteId)
      );
      addModerationAction({
        action: 'block_content',
        reason: 'Content unflagged',
        staffId,
        gameId: game.id
      });
      return true;
    } catch (error) {
      console.error('Failed to unflag content:', error);
      return false;
    }
  }, [game, staffId, addModerationAction]);

  const updateModerationSettings = useCallback((settings: Partial<ModerationSettings>) => {
    setModerationSettings(prev => ({ ...prev, ...settings }));
  }, []);

  const getModerationHistory = useCallback((guestId?: string): ModerationAction[] => {
    if (guestId) {
      return moderationActions.filter(action => action.guestId === guestId);
    }
    return moderationActions;
  }, [moderationActions]);

  const canModerate = useCallback((checkStaffId: string): boolean => {
    // Basic permission check - in a real system this would check roles/permissions
    return checkStaffId === staffId || checkStaffId.startsWith('staff-');
  }, [staffId]);

  const exportModerationLog = useCallback((): string => {
    const logData = {
      eventId,
      gameId: game?.id,
      exportTime: new Date().toISOString(),
      moderationActions,
      flaggedContent: flaggedContent.length,
      settings: moderationSettings
    };
    return JSON.stringify(logData, null, 2);
  }, [eventId, game?.id, moderationActions, flaggedContent, moderationSettings]);

  // Auto content filtering (if enabled)
  useEffect(() => {
    if (!game || !moderationSettings.autoFilter) return;

    const gameVotes = gameStateManager.loadGameVotes(game.id);
    const newFlagged: GameVote[] = [];

    gameVotes.forEach(vote => {
      if (vote.response && !flaggedContent.some(f => 
        f.gameId === vote.gameId && f.guestId === vote.guestId && 
        f.timestamp.getTime() === vote.timestamp.getTime()
      )) {
        // Check against content filters
        const containsInappropriateContent = CONTENT_FILTERS.some(filter => 
          filter.test(vote.response || '')
        );
        
        if (containsInappropriateContent) {
          newFlagged.push(vote);
        }
      }
    });

    if (newFlagged.length > 0) {
      setFlaggedContent(prev => [...prev, ...newFlagged]);
      newFlagged.forEach(vote => {
        addModerationAction({
          action: 'block_content',
          guestId: vote.guestId,
          reason: 'Auto-flagged by content filter',
          staffId: 'system',
          gameId: game.id
        });
      });
    }
  }, [game, moderationSettings.autoFilter, gameStateManager, flaggedContent, addModerationAction]);

  return {
    moderationActions,
    moderationSettings,
    flaggedContent,
    pauseGame,
    resumeGame,
    removeParticipant,
    flagContent,
    unflagContent,
    updateModerationSettings,
    getModerationHistory,
    isGamePaused,
    canModerate,
    exportModerationLog
  };
} 