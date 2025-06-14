import React, { useState, useEffect } from 'react';
import { Poll, GameVote, Guest } from '../../../types';
import { useGameState } from '../../../hooks/useGameState';
import { useGameModeration } from '../../hooks/useGameModeration';
import { createGameAuditLogger } from '../../utils/gameAuditLogger';
import { GameScoreCalculator } from '../../utils/gameScoreCalculator';

interface PollGameProps {
  game: Poll;
  guests: Guest[];
  currentGuestId?: string;
  isStaff?: boolean;
  onVoteSubmit?: (vote: GameVote) => void;
  onGameUpdate?: (game: Poll) => void;
}

const PollGame: React.FC<PollGameProps> = ({
  game,
  guests,
  currentGuestId,
  isStaff = false,
  onVoteSubmit,
  onGameUpdate
}) => {
  const { gameState, submitVote, isParticipant } = useGameState(game.eventId);
  const { 
    pauseGame, 
    resumeGame, 
    removeParticipant, 
    flagContent, 
    isGamePaused,
    getModerationHistory 
  } = useGameModeration(game.eventId, game, 'staff-default');
  
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [userConsent, setUserConsent] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const auditLogger = createGameAuditLogger(game.eventId);
  const scoreCalculator = new GameScoreCalculator();

  // Check if user has already voted
  useEffect(() => {
    if (!currentGuestId) return;
    
    const existingVote = gameState.votes.find(
      vote => vote.gameId === game.id && vote.guestId === currentGuestId
    );
    
    if (existingVote) {
      setHasVoted(true);
      setSelectedOption(existingVote.optionId || null);
    }
  }, [gameState.votes, game.id, currentGuestId]);

  // Handle time limit countdown
  useEffect(() => {
    if (!game.settings.timeLimit || !game.isActive) return;

    const gameStartTime = game.createdAt.getTime();
    const endTime = gameStartTime + (game.settings.timeLimit * 1000);
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setShowResults(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [game.settings.timeLimit, game.isActive, game.createdAt]);

  // Auto-show results based on game settings
  useEffect(() => {
    if (game.settings.showResults && game.isActive) {
      setShowResults(true);
    }
  }, [game.settings.showResults, game.isActive]);

  const handleOptIn = () => {
    setUserConsent(true);
    auditLogger.logEvent({
      eventType: 'consent_updated',
      staffId: currentGuestId || 'unknown',
      guestId: currentGuestId,
      details: { consent: true, gameType: 'poll', gameId: game.id },
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
      details: { consent: false, gameType: 'poll', gameId: game.id },
      severity: 'info',
      category: 'compliance'
    });
  };

  const handleVote = async (optionId: string) => {
    if (!currentGuestId || hasVoted || isGamePaused) return;

    const vote: GameVote = {
      gameId: game.id,
      guestId: currentGuestId,
      optionId,
      timestamp: new Date()
    };

    try {
      submitVote(vote);
      setSelectedOption(optionId);
      setHasVoted(true);

      // Audit log the vote
      auditLogger.logEvent({
        eventType: 'vote_submitted',
        staffId: 'system',
        guestId: currentGuestId,
        gameId: game.id,
        details: { optionId, pollQuestion: game.question },
        severity: 'info',
        category: 'user_action'
      });

      onVoteSubmit?.(vote);
    } catch (error) {
      console.error('Failed to submit vote:', error);
    }
  };

  const handleStaffAction = async (action: 'pause' | 'resume' | 'show_results') => {
    if (!isStaff) return;

    try {
      switch (action) {
        case 'pause':
          await pauseGame('Staff initiated pause');
          break;
        case 'resume':
          await resumeGame();
          break;
        case 'show_results':
          setShowResults(true);
          break;
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    }
  };

  const calculateResults = () => {
    const optionCounts = game.options.reduce((acc, option) => {
      acc[option.id] = 0;
      return acc;
    }, {} as Record<string, number>);

    gameState.votes
      .filter(vote => vote.gameId === game.id && vote.optionId)
      .forEach(vote => {
        if (vote.optionId && optionCounts.hasOwnProperty(vote.optionId)) {
          optionCounts[vote.optionId]++;
        }
      });

    const totalVotes = Object.values(optionCounts).reduce((sum, count) => sum + count, 0);

    return game.options.map(option => ({
      ...option,
      votes: optionCounts[option.id],
      percentage: totalVotes > 0 ? Math.round((optionCounts[option.id] / totalVotes) * 100) : 0
    }));
  };

  // Consent flow for participants
  if (!isStaff && currentGuestId && userConsent === null) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Join the Poll?
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            {game.question}
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
              Join Poll
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
          You've chosen not to participate in this poll.
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

  const results = calculateResults();
  const maxVotes = Math.max(...results.map(r => r.votes), 1);

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-blue-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">📊 Poll</h2>
            <p className="text-blue-100">{game.question}</p>
          </div>
          
          {timeRemaining !== null && (
            <div className="text-right">
              <div className="text-sm text-blue-100">Time Remaining</div>
              <div className="text-2xl font-bold">
                {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
              </div>
            </div>
          )}
        </div>

        {/* Game Status Indicators */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1">
            <span>👥</span>
            {gameState.participants.length} participants
          </span>
          <span className="flex items-center gap-1">
            <span>🗳️</span>
            {gameState.votes.filter(v => v.gameId === game.id).length} votes
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
              onClick={() => handleStaffAction('show_results')}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors duration-200"
            >
              📊 Show Results
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {!showResults ? (
          /* Voting Interface */
          <div className="space-y-3">
            {results.map((option) => (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={hasVoted || isGamePaused || !currentGuestId}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedOption === option.id
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : hasVoted
                    ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 opacity-60'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/10'
                } ${!currentGuestId || isGamePaused ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {option.text}
                  </span>
                  {selectedOption === option.id && (
                    <span className="text-blue-500 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}

            {hasVoted && (
              <div className="text-center mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <span className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Your vote has been recorded!
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Poll Results
            </h3>
            
            <div className="space-y-3">
              {results.map((option) => (
                <div key={option.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {option.text}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {option.votes} votes ({option.percentage}%)
                    </span>
                  </div>
                  
                  <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${(option.votes / maxVotes) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
              <div className="text-center text-neutral-600 dark:text-neutral-400">
                Total Votes: {results.reduce((sum, option) => sum + option.votes, 0)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollGame; 