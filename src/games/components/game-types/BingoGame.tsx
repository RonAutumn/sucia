import React, { useState, useEffect } from 'react';
import { Bingo, GameVote, Guest, BingoCell } from '../../../types';
import { useGameState } from '../../../hooks/useGameState';
import { useGameModeration } from '../../hooks/useGameModeration';
import { createGameAuditLogger } from '../../utils/gameAuditLogger';

interface BingoGameProps {
  game: Bingo;
  guests: Guest[];
  currentGuestId?: string;
  isStaff?: boolean;
  onVoteSubmit?: (vote: GameVote) => void;
  onGameUpdate?: (game: Bingo) => void;
}

const BingoGame: React.FC<BingoGameProps> = ({
  game,
  guests,
  currentGuestId,
  isStaff = false,
  onVoteSubmit,
  onGameUpdate
}) => {
  const { gameState, submitVote } = useGameState(game.eventId);
  const { 
    pauseGame, 
    resumeGame, 
    isGamePaused 
  } = useGameModeration(game.eventId, game, 'staff-default');
  
  const [markedCells, setMarkedCells] = useState<string[]>([]);
  const [userConsent, setUserConsent] = useState<boolean | null>(null);
  const [hasBingo, setHasBingo] = useState(false);
  const [bingoPattern, setBingoPattern] = useState<string | null>(null);

  const auditLogger = createGameAuditLogger(game.eventId);

  // Load user's marked cells from votes
  useEffect(() => {
    if (!currentGuestId) return;
    
    const userVotes = gameState.votes.filter(
      vote => vote.gameId === game.id && vote.guestId === currentGuestId
    );
    
    const marked = userVotes.map(vote => vote.optionId).filter(Boolean) as string[];
    setMarkedCells(marked);
  }, [gameState.votes, game.id, currentGuestId]);

  // Check for bingo patterns
  useEffect(() => {
    if (markedCells.length < 5) {
      setHasBingo(false);
      setBingoPattern(null);
      return;
    }

    const pattern = checkForBingo(markedCells);
    if (pattern) {
      setHasBingo(true);
      setBingoPattern(pattern);
    } else {
      setHasBingo(false);
      setBingoPattern(null);
    }
  }, [markedCells]);

  const checkForBingo = (marked: string[]): string | null => {
    // Assuming 5x5 grid (25 cells)
    const gridSize = 5;
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false));
    
    // Mark the grid based on marked cells
    marked.forEach(cellId => {
      const index = parseInt(cellId.replace('cell-', ''));
      const row = Math.floor(index / gridSize);
      const col = index % gridSize;
      if (row < gridSize && col < gridSize) {
        grid[row][col] = true;
      }
    });

    // Check rows
    for (let row = 0; row < gridSize; row++) {
      if (grid[row].every(cell => cell)) {
        return `Row ${row + 1}`;
      }
    }

    // Check columns
    for (let col = 0; col < gridSize; col++) {
      if (grid.every(row => row[col])) {
        return `Column ${col + 1}`;
      }
    }

    // Check diagonals
    if (grid.every((row, index) => row[index])) {
      return 'Diagonal (top-left to bottom-right)';
    }
    
    if (grid.every((row, index) => row[gridSize - 1 - index])) {
      return 'Diagonal (top-right to bottom-left)';
    }

    return null;
  };

  const handleOptIn = () => {
    setUserConsent(true);
    auditLogger.logEvent({
      eventType: 'consent_updated',
      staffId: currentGuestId || 'unknown',
      guestId: currentGuestId,
      details: { consent: true, gameType: 'bingo', gameId: game.id },
      severity: 'info',
      category: 'compliance'
    });
  };

  const handleOptOut = () => {
    setUserConsent(false);
    auditLogger.logEvent({
      eventType: 'consent_updated', 
      staffId: currentGuestId || 'unknown',
      guestId: currentGuestId,
      details: { consent: false, gameType: 'bingo', gameId: game.id },
      severity: 'info',
      category: 'compliance'
    });
  };

  const handleCellClick = async (cellId: string) => {
    if (!currentGuestId || isGamePaused || hasBingo) return;

    const isMarked = markedCells.includes(cellId);
    
    if (isMarked) {
      // Unmark cell - remove vote
      setMarkedCells(prev => prev.filter(id => id !== cellId));
    } else {
      // Mark cell - add vote
      const vote: GameVote = {
        gameId: game.id,
        guestId: currentGuestId,
        optionId: cellId,
        timestamp: new Date()
      };

      try {
        submitVote(vote);
        setMarkedCells(prev => [...prev, cellId]);

        auditLogger.logEvent({
          eventType: 'vote_submitted',
          staffId: 'system',
          guestId: currentGuestId,
          gameId: game.id,
          details: { 
            cellId,
            cellText: game.cells.find(cell => cell.id === cellId)?.text,
            action: 'mark'
          },
          severity: 'info',
          category: 'user_action'
        });

        onVoteSubmit?.(vote);
      } catch (error) {
        console.error('Failed to mark cell:', error);
      }
    }
  };

  const handleClaimBingo = async () => {
    if (!currentGuestId || !hasBingo || !bingoPattern) return;

    const vote: GameVote = {
      gameId: game.id,
      guestId: currentGuestId,
      optionId: 'BINGO_CLAIM',
      response: bingoPattern,
      timestamp: new Date()
    };

    try {
      submitVote(vote);

      auditLogger.logEvent({
        eventType: 'vote_submitted',
        staffId: 'system',
        guestId: currentGuestId,
        gameId: game.id,
        details: { 
          action: 'claim_bingo',
          pattern: bingoPattern,
          markedCells: markedCells.length
        },
        severity: 'info',
        category: 'user_action'
      });

      onVoteSubmit?.(vote);
    } catch (error) {
      console.error('Failed to claim bingo:', error);
    }
  };

  const handleStaffAction = async (action: 'pause' | 'resume' | 'reset_game') => {
    if (!isStaff) return;

    try {
      switch (action) {
        case 'pause':
          await pauseGame('Staff initiated pause');
          break;
        case 'resume':
          await resumeGame();
          break;
        case 'reset_game':
          // Clear all votes for this game
          setMarkedCells([]);
          break;
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    }
  };

  const getBingoClaimants = () => {
    return gameState.votes
      .filter(vote => vote.gameId === game.id && vote.optionId === 'BINGO_CLAIM')
      .map(vote => ({
        ...vote,
        guestName: guests.find(g => g.id === vote.guestId)?.name || `Guest ${vote.guestId}`
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  };

  // Consent flow for participants
  if (!isStaff && currentGuestId && userConsent === null) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Join the Bingo?
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Mark off items as you experience them during the event!
          </p>
          
          {game.settings.contentWarning && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-3 mb-4">
              <p className="text-orange-800 dark:text-orange-200 text-sm">
                ⚠️ {game.settings.contentWarning}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleOptIn}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Join Bingo
            </button>
            {game.settings.allowOptOut && (
              <button
                onClick={handleOptOut}
                className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Skip
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Opt-out state
  if (!isStaff && userConsent === false) {
    return (
      <div className="max-w-md mx-auto bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-lg p-6 text-center">
        <div className="text-2xl mb-2">✅</div>
        <p className="text-neutral-600 dark:text-neutral-400">
          You've chosen not to participate in this bingo.
        </p>
        <button
          onClick={() => setUserConsent(null)}
          className="mt-3 text-primary-600 hover:text-primary-700 text-sm underline"
        >
          Change your mind?
        </button>
      </div>
    );
  }

  const bingoClaimants = getBingoClaimants();
  const gridSize = Math.ceil(Math.sqrt(game.cells.length));

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-green-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🎯 Bingo</h2>
            <p className="text-green-100">
              Mark off items as you experience them!
            </p>
          </div>
          
          {hasBingo && (
            <div className="text-right">
              <div className="bg-yellow-500 text-yellow-900 px-3 py-1 rounded-full text-sm font-medium">
                🎉 BINGO! ({bingoPattern})
              </div>
            </div>
          )}
        </div>

        {/* Game Status */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1">
            <span>👥</span>
            {gameState.participants.length} participants
          </span>
          <span className="flex items-center gap-1">
            <span>✓</span>
            {markedCells.length}/{game.cells.length} marked
          </span>
          <span className="flex items-center gap-1">
            <span>🏆</span>
            {bingoClaimants.length} winners
          </span>
          {isGamePaused && (
            <span className="bg-yellow-500 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium">
              ⏸️ Paused
            </span>
          )}
        </div>
      </div>

      {/* Staff Controls */}
      {isStaff && (
        <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 p-4">
          <div className="flex gap-2">
            <button
              onClick={() => handleStaffAction(isGamePaused ? 'resume' : 'pause')}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors duration-200 ${
                isGamePaused
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              {isGamePaused ? '▶️ Resume' : '⏸️ Pause'}
            </button>
            <button
              onClick={() => handleStaffAction('reset_game')}
              className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium transition-colors duration-200"
            >
              🔄 Reset Game
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Bingo Grid */}
        <div className="mb-6">
          <div 
            className="grid gap-2 mx-auto max-w-lg"
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {game.cells.map((cell) => {
              const isMarked = markedCells.includes(cell.id);
              return (
                <button
                  key={cell.id}
                  onClick={() => handleCellClick(cell.id)}
                  disabled={isGamePaused || !currentGuestId || hasBingo}
                  className={`aspect-square p-2 text-xs font-medium rounded-lg border-2 transition-all duration-200 ${
                    isMarked
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-900/10'
                  } ${!currentGuestId || isGamePaused || hasBingo ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    {isMarked && (
                      <span className="text-green-500 text-lg mb-1">✓</span>
                    )}
                    <span className="text-center leading-tight">
                      {cell.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bingo Claim Button */}
        {hasBingo && currentGuestId && !bingoClaimants.find(c => c.guestId === currentGuestId) && (
          <div className="text-center mb-6">
            <button
              onClick={handleClaimBingo}
              className="bg-yellow-500 hover:bg-yellow-600 text-yellow-900 px-8 py-3 rounded-lg font-bold text-lg transition-colors duration-200 animate-pulse"
            >
              🎉 CLAIM BINGO! 🎉
            </button>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">
              You got {bingoPattern}!
            </p>
          </div>
        )}

        {/* Winners List */}
        {bingoClaimants.length > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">
              🏆 Bingo Winners!
            </h3>
            <div className="space-y-2">
              {bingoClaimants.map((claimant, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="font-medium text-yellow-800 dark:text-yellow-200">
                    #{index + 1} {claimant.guestName}
                  </span>
                  <div className="text-right">
                    <div className="text-sm text-yellow-700 dark:text-yellow-300">
                      {claimant.response}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {claimant.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 text-center text-neutral-600 dark:text-neutral-400 text-sm">
          <p>
            Click on squares to mark them off as you experience these moments during the event.
            Get 5 in a row (horizontal, vertical, or diagonal) to win!
          </p>
        </div>
      </div>
    </div>
  );
};

export default BingoGame; 