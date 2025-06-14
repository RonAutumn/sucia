import { useState, useEffect, useCallback, useRef } from 'react';
import { Game } from '../types';

interface RealTimeUpdateConfig {
  enabled: boolean;
  interval: number; // milliseconds
  onGameUpdate?: (game: Game) => void;
  onParticipantUpdate?: (participants: string[]) => void;
  onVoteUpdate?: (voteCount: number) => void;
  onError?: (error: Error) => void;
}

interface RealTimeUpdatesResult {
  isConnected: boolean;
  lastUpdate: Date | null;
  updateCount: number;
  startUpdates: () => void;
  stopUpdates: () => void;
  triggerUpdate: () => void;
  setConfig: (config: Partial<RealTimeUpdateConfig>) => void;
}

/**
 * Manages real-time updates for games platform using polling mechanism
 * Follows existing app patterns (30s intervals like Dashboard/DashboardTiles)
 */
export function useRealTimeUpdates(
  gameId: string | null,
  initialConfig: Partial<RealTimeUpdateConfig> = {}
): RealTimeUpdatesResult {
  const defaultConfig: RealTimeUpdateConfig = {
    enabled: true,
    interval: 30000, // 30 seconds like Dashboard
    ...initialConfig
  };

  const [config, setConfigState] = useState<RealTimeUpdateConfig>(defaultConfig);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update configuration
  const setConfig = useCallback((newConfig: Partial<RealTimeUpdateConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Trigger manual update
  const triggerUpdate = useCallback(async () => {
    if (!gameId || !mountedRef.current) return;

    try {
      setLastUpdate(new Date());
      setUpdateCount(prev => prev + 1);

      // Simulate fetching latest game state
      // In a real implementation, this would make API calls
      const gameStateKey = `gameState-${gameId}`;
      const votesKey = `gameVotes-${gameId}`;
      const participantsKey = `gameParticipants-${gameId}`;

      const storedGame = localStorage.getItem(gameStateKey);
      const storedVotes = localStorage.getItem(votesKey);
      const storedParticipants = localStorage.getItem(participantsKey);

      if (storedGame && config.onGameUpdate) {
        const game: Game = JSON.parse(storedGame);
        config.onGameUpdate(game);
      }

      if (storedParticipants && config.onParticipantUpdate) {
        const participants: string[] = JSON.parse(storedParticipants);
        config.onParticipantUpdate(participants);
      }

      if (storedVotes && config.onVoteUpdate) {
        const votes = JSON.parse(storedVotes);
        config.onVoteUpdate(votes.length);
      }

    } catch (error) {
      console.error('Real-time update failed:', error);
      if (config.onError) {
        config.onError(error as Error);
      }
    }
  }, [gameId, config]);

  // Start polling updates
  const startUpdates = useCallback(() => {
    if (!config.enabled || !gameId || intervalRef.current) return;

    setIsConnected(true);
    
    // Initial update
    triggerUpdate();

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (mountedRef.current) {
        triggerUpdate();
      }
    }, config.interval);
  }, [config.enabled, config.interval, gameId, triggerUpdate]);

  // Stop polling updates
  const stopUpdates = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  // Auto-start/stop based on gameId and config
  useEffect(() => {
    if (gameId && config.enabled) {
      startUpdates();
    } else {
      stopUpdates();
    }

    return () => {
      stopUpdates();
    };
  }, [gameId, config.enabled, startUpdates, stopUpdates]);

  // Handle page visibility changes (like existing components)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && gameId && config.enabled) {
        // Page became visible, trigger immediate update
        triggerUpdate();
      } else if (document.visibilityState === 'hidden') {
        // Page hidden, we could pause updates to save resources
        // For now, keeping consistent with Dashboard behavior
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [gameId, config.enabled, triggerUpdate]);

  // Handle browser focus events
  useEffect(() => {
    const handleFocus = () => {
      if (gameId && config.enabled) {
        triggerUpdate();
      }
    };

    const handleBlur = () => {
      // Could implement pause logic here if needed
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [gameId, config.enabled, triggerUpdate]);

  return {
    isConnected,
    lastUpdate,
    updateCount,
    startUpdates,
    stopUpdates,
    triggerUpdate,
    setConfig
  };
}

/**
 * Lightweight hook for simple game state polling
 * Simplified version for basic use cases
 */
export function useGamePolling(
  gameId: string | null,
  onUpdate?: () => void,
  interval: number = 30000
) {
  return useRealTimeUpdates(gameId, {
    enabled: !!gameId,
    interval,
    onGameUpdate: onUpdate,
    onParticipantUpdate: onUpdate,
    onVoteUpdate: onUpdate
  });
} 