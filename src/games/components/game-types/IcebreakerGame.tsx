import React, { useState, useEffect } from 'react';
import { Icebreaker, GameVote, Guest, IcebreakerPrompt } from '../../../types';
import { useGameState } from '../../../hooks/useGameState';
import { useGameModeration } from '../../hooks/useGameModeration';
import { createGameAuditLogger } from '../../utils/gameAuditLogger';

interface IcebreakerGameProps {
  game: Icebreaker;
  guests: Guest[];
  currentGuestId?: string;
  isStaff?: boolean;
  onVoteSubmit?: (vote: GameVote) => void;
  onGameUpdate?: (game: Icebreaker) => void;
}

const IcebreakerGame: React.FC<IcebreakerGameProps> = ({
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
    flagContent,
    isGamePaused 
  } = useGameModeration(game.eventId, game, 'staff-default');
  
  const [response, setResponse] = useState('');
  const [hasResponded, setHasResponded] = useState(false);
  const [userConsent, setUserConsent] = useState<boolean | null>(null);
  const [showResponses, setShowResponses] = useState(false);

  const auditLogger = createGameAuditLogger(game.eventId);
  const currentPrompt = game.prompts[game.currentPromptIndex];

  // Check if user has already responded to current prompt
  useEffect(() => {
    if (!currentGuestId || !currentPrompt) return;
    
    const existingResponse = gameState.votes.find(
      vote => vote.gameId === game.id && 
              vote.guestId === currentGuestId && 
              vote.optionId === currentPrompt.id
    );
    
    if (existingResponse) {
      setHasResponded(true);
      setResponse(existingResponse.response || '');
    } else {
      setHasResponded(false);
      setResponse('');
    }
  }, [gameState.votes, game.id, currentGuestId, currentPrompt?.id]);

  const handleOptIn = () => {
    setUserConsent(true);
    auditLogger.logEvent({
      eventType: 'consent_updated',
      staffId: currentGuestId || 'unknown',
      guestId: currentGuestId,
      details: { consent: true, gameType: 'icebreaker', gameId: game.id },
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
      details: { consent: false, gameType: 'icebreaker', gameId: game.id },
      severity: 'info',
      category: 'compliance'
    });
  };

  const handleSubmitResponse = async () => {
    if (!currentGuestId || !currentPrompt || !response.trim() || hasResponded || isGamePaused) return;

    const vote: GameVote = {
      gameId: game.id,
      guestId: currentGuestId,
      optionId: currentPrompt.id,
      response: response.trim(),
      timestamp: new Date()
    };

    try {
      submitVote(vote);
      setHasResponded(true);

      auditLogger.logEvent({
        eventType: 'vote_submitted',
        staffId: 'system',
        guestId: currentGuestId,
        gameId: game.id,
        details: { 
          promptId: currentPrompt.id,
          promptCategory: currentPrompt.category,
          responseLength: response.length,
          prompt: currentPrompt.prompt
        },
        severity: 'info',
        category: 'user_action'
      });

      onVoteSubmit?.(vote);
    } catch (error) {
      console.error('Failed to submit response:', error);
    }
  };

  const handleStaffAction = async (action: 'pause' | 'resume' | 'next_prompt' | 'prev_prompt' | 'show_responses') => {
    if (!isStaff) return;

    try {
      switch (action) {
        case 'pause':
          await pauseGame('Staff initiated pause');
          break;
        case 'resume':
          await resumeGame();
          break;
        case 'show_responses':
          setShowResponses(true);
          break;
        case 'next_prompt':
          if (game.currentPromptIndex < game.prompts.length - 1) {
            const updatedGame = {
              ...game,
              currentPromptIndex: game.currentPromptIndex + 1
            };
            setShowResponses(false);
            onGameUpdate?.(updatedGame);
          }
          break;
        case 'prev_prompt':
          if (game.currentPromptIndex > 0) {
            const updatedGame = {
              ...game,
              currentPromptIndex: game.currentPromptIndex - 1
            };
            setShowResponses(false);
            onGameUpdate?.(updatedGame);
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    }
  };

  const getPromptResponses = () => {
    if (!currentPrompt) return [];
    
    return gameState.votes
      .filter(vote => vote.gameId === game.id && vote.optionId === currentPrompt.id && vote.response)
      .map(vote => ({
        ...vote,
        guestName: guests.find(g => g.id === vote.guestId)?.name || `Guest ${vote.guestId}`
      }));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'spicy': return 'bg-red-500';
      case 'mild': return 'bg-green-500';
      case 'deep': return 'bg-blue-500';
      case 'fun': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'spicy': return '🌶️';
      case 'mild': return '🌱';
      case 'deep': return '🤔';
      case 'fun': return '🎉';
      default: return '💭';
    }
  };

  // Consent flow for participants
  if (!isStaff && currentGuestId && userConsent === null) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🔥</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Join the Icebreaker?
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Share your thoughts with the community!
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
              Join Icebreaker
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
          You've chosen not to participate in this icebreaker.
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

  if (!currentPrompt) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Icebreaker Complete!
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400">
          Thank you for sharing with the community!
        </p>
      </div>
    );
  }

  const responses = getPromptResponses();

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-pink-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🔥 Icebreaker</h2>
            <p className="text-pink-100">
              Prompt {game.currentPromptIndex + 1} of {game.prompts.length}
            </p>
          </div>
          
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getCategoryColor(currentPrompt.category)}`}>
              <span className="mr-1">{getCategoryEmoji(currentPrompt.category)}</span>
              {currentPrompt.category}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="bg-pink-400 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${((game.currentPromptIndex + 1) / game.prompts.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Game Status */}
        <div className="flex items-center gap-4 mt-2 text-sm">
          <span className="flex items-center gap-1">
            <span>👥</span>
            {gameState.participants.length} participants
          </span>
          <span className="flex items-center gap-1">
            <span>💬</span>
            {responses.length} responses
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
              onClick={() => handleStaffAction('show_responses')}
              className="px-3 py-1 bg-pink-500 hover:bg-pink-600 text-white rounded text-sm font-medium transition-colors duration-200"
            >
              💬 Show Responses
            </button>
            <button
              onClick={() => handleStaffAction('prev_prompt')}
              disabled={game.currentPromptIndex === 0}
              className="px-3 py-1 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors duration-200"
            >
              ⬅️ Previous
            </button>
            <button
              onClick={() => handleStaffAction('next_prompt')}
              disabled={game.currentPromptIndex >= game.prompts.length - 1}
              className="px-3 py-1 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors duration-200"
            >
              ➡️ Next
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {!showResponses ? (
          /* Response Input */
          <div>
            <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
              {currentPrompt.prompt}
            </h3>

            {!hasResponded ? (
              <div className="space-y-4">
                <textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Share your thoughts..."
                  disabled={isGamePaused || !currentGuestId}
                  className="w-full h-32 p-4 border border-neutral-300 dark:border-neutral-600 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500 dark:bg-neutral-700 dark:text-neutral-100"
                  maxLength={500}
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500 dark:text-neutral-400">
                    {response.length}/500 characters
                  </span>
                  
                  <button
                    onClick={handleSubmitResponse}
                    disabled={!response.trim() || isGamePaused || !currentGuestId}
                    className="bg-pink-600 hover:bg-pink-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Share Response
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border">
                  <h4 className="font-medium text-neutral-900 dark:text-neutral-100 mb-2">
                    Your Response:
                  </h4>
                  <p className="text-neutral-700 dark:text-neutral-300">
                    {response}
                  </p>
                </div>
                
                <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                  <span className="text-green-800 dark:text-green-200 font-medium">
                    ✅ Your response has been shared!
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Community Responses */
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Community Responses
            </h3>
            
            <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4">
              "{currentPrompt.prompt}"
            </div>

            {responses.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {responses.map((response, index) => (
                  <div key={index} className="p-4 bg-neutral-50 dark:bg-neutral-700 rounded-lg border">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {response.guestName}
                      </span>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {response.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-neutral-700 dark:text-neutral-300">
                      {response.response}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
                <div className="text-4xl mb-2">💭</div>
                <p>No responses yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IcebreakerGame; 