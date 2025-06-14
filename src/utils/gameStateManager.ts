import { Game, GameVote, Guest } from '../types';

// Storage keys following existing naming conventions
const GAME_STATE_PREFIX = 'gameState';
const GAME_VOTES_PREFIX = 'gameVotes';
const GAME_PARTICIPANTS_PREFIX = 'gameParticipants';
const GAME_AUDIT_PREFIX = 'gameAudit';
const GAME_SESSION_PREFIX = 'gameSession';

interface GameSession {
  id: string;
  eventId: string;
  gameId: string;
  startTime: Date;
  endTime?: Date;
  staffId: string;
  participants: string[];
  totalVotes: number;
  status: 'active' | 'completed' | 'cancelled';
}

interface AuditLogEntry {
  id: string;
  timestamp: Date;
  eventId: string;
  gameId: string;
  staffId: string;
  action: 'game_created' | 'game_launched' | 'game_stopped' | 'participant_joined' | 
          'participant_left' | 'vote_submitted' | 'settings_updated' | 'game_moderated';
  details: Record<string, any>;
  guestId?: string;
}

/**
 * Centralized game state management utility
 * Provides persistence, audit logging, and session tracking
 */
export class GameStateManager {
  private eventId: string;

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  private getStorageKey(prefix: string, suffix?: string): string {
    return suffix ? `${prefix}-${this.eventId}-${suffix}` : `${prefix}-${this.eventId}`;
  }

  /**
   * GAME STATE PERSISTENCE
   */
  saveGameState(game: Game): boolean {
    try {
      const key = this.getStorageKey(GAME_STATE_PREFIX, game.id);
      localStorage.setItem(key, JSON.stringify({
        ...game,
        lastUpdated: new Date().toISOString()
      }));
      
      this.logAudit({
        action: game.isActive ? 'game_launched' : 'game_stopped',
        gameId: game.id,
        staffId: game.staffId,
        details: {
          gameType: game.type,
          participantCount: game.participants.length,
          settings: game.settings
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to save game state:', error);
      return false;
    }
  }

  loadGameState(gameId: string): Game | null {
    try {
      const key = this.getStorageKey(GAME_STATE_PREFIX, gameId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        createdAt: new Date(parsed.createdAt),
        lastUpdated: parsed.lastUpdated ? new Date(parsed.lastUpdated) : undefined
      };
    } catch (error) {
      console.error('Failed to load game state:', error);
      return null;
    }
  }

  removeGameState(gameId: string): boolean {
    try {
      const key = this.getStorageKey(GAME_STATE_PREFIX, gameId);
      localStorage.removeItem(key);
      
      // Also clean up related data
      this.removeGameVotes(gameId);
      this.removeGameParticipants(gameId);
      
      return true;
    } catch (error) {
      console.error('Failed to remove game state:', error);
      return false;
    }
  }

  /**
   * VOTE MANAGEMENT
   */
  saveGameVotes(gameId: string, votes: GameVote[]): boolean {
    try {
      const key = this.getStorageKey(GAME_VOTES_PREFIX, gameId);
      localStorage.setItem(key, JSON.stringify(votes));
      return true;
    } catch (error) {
      console.error('Failed to save game votes:', error);
      return false;
    }
  }

  loadGameVotes(gameId: string): GameVote[] {
    try {
      const key = this.getStorageKey(GAME_VOTES_PREFIX, gameId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((vote: any) => ({
        ...vote,
        timestamp: new Date(vote.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load game votes:', error);
      return [];
    }
  }

  addVote(vote: GameVote): boolean {
    try {
      const existingVotes = this.loadGameVotes(vote.gameId);
      
      // Remove any existing vote from this guest
      const filteredVotes = existingVotes.filter(
        v => !(v.guestId === vote.guestId && v.gameId === vote.gameId)
      );
      
      const updatedVotes = [...filteredVotes, vote];
      const success = this.saveGameVotes(vote.gameId, updatedVotes);
      
      if (success) {
        this.logAudit({
          action: 'vote_submitted',
          gameId: vote.gameId,
          staffId: 'system', // Vote submissions are from participants
          guestId: vote.guestId,
          details: {
            optionId: vote.optionId,
            response: vote.response,
            voteCount: updatedVotes.length
          }
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to add vote:', error);
      return false;
    }
  }

  removeGameVotes(gameId: string): boolean {
    try {
      const key = this.getStorageKey(GAME_VOTES_PREFIX, gameId);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove game votes:', error);
      return false;
    }
  }

  /**
   * PARTICIPANT MANAGEMENT
   */
  saveGameParticipants(gameId: string, participants: string[]): boolean {
    try {
      const key = this.getStorageKey(GAME_PARTICIPANTS_PREFIX, gameId);
      localStorage.setItem(key, JSON.stringify(participants));
      return true;
    } catch (error) {
      console.error('Failed to save game participants:', error);
      return false;
    }
  }

  loadGameParticipants(gameId: string): string[] {
    try {
      const key = this.getStorageKey(GAME_PARTICIPANTS_PREFIX, gameId);
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load game participants:', error);
      return [];
    }
  }

  addParticipant(gameId: string, guestId: string, staffId: string): boolean {
    try {
      const participants = this.loadGameParticipants(gameId);
      
      if (!participants.includes(guestId)) {
        const updatedParticipants = [...participants, guestId];
        const success = this.saveGameParticipants(gameId, updatedParticipants);
        
        if (success) {
          this.logAudit({
            action: 'participant_joined',
            gameId,
            staffId,
            guestId,
            details: {
              participantCount: updatedParticipants.length
            }
          });
        }
        
        return success;
      }
      
      return true; // Already a participant
    } catch (error) {
      console.error('Failed to add participant:', error);
      return false;
    }
  }

  removeParticipant(gameId: string, guestId: string, staffId: string): boolean {
    try {
      const participants = this.loadGameParticipants(gameId);
      const updatedParticipants = participants.filter(id => id !== guestId);
      
      const success = this.saveGameParticipants(gameId, updatedParticipants);
      
      if (success) {
        // Also remove their votes
        const votes = this.loadGameVotes(gameId);
        const filteredVotes = votes.filter(vote => vote.guestId !== guestId);
        this.saveGameVotes(gameId, filteredVotes);
        
        this.logAudit({
          action: 'participant_left',
          gameId,
          staffId,
          guestId,
          details: {
            participantCount: updatedParticipants.length,
            votesRemoved: votes.length - filteredVotes.length
          }
        });
      }
      
      return success;
    } catch (error) {
      console.error('Failed to remove participant:', error);
      return false;
    }
  }

  removeGameParticipants(gameId: string): boolean {
    try {
      const key = this.getStorageKey(GAME_PARTICIPANTS_PREFIX, gameId);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Failed to remove game participants:', error);
      return false;
    }
  }

  /**
   * AUDIT LOGGING
   */
  logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'eventId'>): boolean {
    try {
      const auditEntry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventId: this.eventId,
        ...entry
      };
      
      const auditLog = this.loadAuditLog();
      auditLog.push(auditEntry);
      
      // Keep only last 1000 entries to prevent storage bloat
      const trimmedLog = auditLog.slice(-1000);
      
      const key = this.getStorageKey(GAME_AUDIT_PREFIX);
      localStorage.setItem(key, JSON.stringify(trimmedLog));
      
      return true;
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      return false;
    }
  }

  loadAuditLog(): AuditLogEntry[] {
    try {
      const key = this.getStorageKey(GAME_AUDIT_PREFIX);
      const stored = localStorage.getItem(key);
      
      if (!stored) return [];
      
      const parsed = JSON.parse(stored);
      return parsed.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load audit log:', error);
      return [];
    }
  }

  getAuditLogForGame(gameId: string): AuditLogEntry[] {
    const fullLog = this.loadAuditLog();
    return fullLog.filter(entry => entry.gameId === gameId);
  }

  /**
   * SESSION MANAGEMENT
   */
  startGameSession(game: Game, staffId: string): GameSession {
    const session: GameSession = {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId: this.eventId,
      gameId: game.id,
      startTime: new Date(),
      staffId,
      participants: [],
      totalVotes: 0,
      status: 'active'
    };
    
    const key = this.getStorageKey(GAME_SESSION_PREFIX, game.id);
    localStorage.setItem(key, JSON.stringify(session));
    
    return session;
  }

  endGameSession(gameId: string, status: 'completed' | 'cancelled' = 'completed'): boolean {
    try {
      const key = this.getStorageKey(GAME_SESSION_PREFIX, gameId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return false;
      
      const session: GameSession = JSON.parse(stored);
      const updatedSession = {
        ...session,
        endTime: new Date(),
        status,
        participants: this.loadGameParticipants(gameId),
        totalVotes: this.loadGameVotes(gameId).length
      };
      
      localStorage.setItem(key, JSON.stringify(updatedSession));
      return true;
    } catch (error) {
      console.error('Failed to end game session:', error);
      return false;
    }
  }

  loadGameSession(gameId: string): GameSession | null {
    try {
      const key = this.getStorageKey(GAME_SESSION_PREFIX, gameId);
      const stored = localStorage.getItem(key);
      
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        startTime: new Date(parsed.startTime),
        endTime: parsed.endTime ? new Date(parsed.endTime) : undefined
      };
    } catch (error) {
      console.error('Failed to load game session:', error);
      return null;
    }
  }

  /**
   * CLEANUP UTILITIES
   */
  cleanupGameData(gameId: string): boolean {
    try {
      this.removeGameState(gameId);
      this.removeGameVotes(gameId);
      this.removeGameParticipants(gameId);
      this.endGameSession(gameId, 'cancelled');
      
      this.logAudit({
        action: 'game_moderated',
        gameId,
        staffId: 'system',
        details: {
          action: 'cleanup_game_data',
          reason: 'manual_cleanup'
        }
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cleanup game data:', error);
      return false;
    }
  }

  cleanupEventData(): boolean {
    try {
      const keys = Object.keys(localStorage);
      const eventKeys = keys.filter(key => key.includes(`-${this.eventId}-`));
      
      eventKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      return true;
    } catch (error) {
      console.error('Failed to cleanup event data:', error);
      return false;
    }
  }

  /**
   * ANALYTICS & REPORTING
   */
  getGameAnalytics(gameId: string) {
    const game = this.loadGameState(gameId);
    const votes = this.loadGameVotes(gameId);
    const participants = this.loadGameParticipants(gameId);
    const session = this.loadGameSession(gameId);
    const auditLog = this.getAuditLogForGame(gameId);
    
    return {
      game,
      session,
      participantCount: participants.length,
      voteCount: votes.length,
      participationRate: participants.length > 0 ? (votes.length / participants.length) * 100 : 0,
      auditEntries: auditLog.length,
      timeline: auditLog.map(entry => ({
        timestamp: entry.timestamp,
        action: entry.action,
        details: entry.details
      }))
    };
  }
}

/**
 * Factory function to create game state manager instances
 */
export function createGameStateManager(eventId: string): GameStateManager {
  return new GameStateManager(eventId);
} 