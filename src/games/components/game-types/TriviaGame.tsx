import React, { useState, useEffect } from 'react';
import { Trivia, GameVote, Guest, TriviaQuestion } from '../../../types';
import { useGameState } from '../../../hooks/useGameState';
import { useGameModeration } from '../../hooks/useGameModeration';
import { createGameAuditLogger } from '../../utils/gameAuditLogger';
import { GameScoreCalculator } from '../../utils/gameScoreCalculator';

interface TriviaGameProps {
  game: Trivia;
  guests: Guest[];
  currentGuestId?: string;
  isStaff?: boolean;
  onVoteSubmit?: (vote: GameVote) => void;
  onGameUpdate?: (game: Trivia) => void;
}

const TriviaGame: React.FC<TriviaGameProps> = ({
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
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userConsent, setUserConsent] = useState<boolean | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const auditLogger = createGameAuditLogger(game.eventId);
  const scoreCalculator = new GameScoreCalculator();

  const currentQuestion = game.questions[game.currentQuestionIndex];
  const isLastQuestion = game.currentQuestionIndex >= game.questions.length - 1;

  // Check if user has already answered current question
  useEffect(() => {
    if (!currentGuestId || !currentQuestion) return;
    
    const existingAnswer = gameState.votes.find(
      vote => vote.gameId === game.id && 
              vote.guestId === currentGuestId && 
              vote.optionId?.includes(currentQuestion.id)
    );
    
    if (existingAnswer) {
      setHasAnswered(true);
      const answerIndex = parseInt(existingAnswer.optionId?.split('_').pop() || '0');
      setSelectedAnswer(answerIndex);
    } else {
      setHasAnswered(false);
      setSelectedAnswer(null);
    }
  }, [gameState.votes, game.id, currentGuestId, currentQuestion?.id]);

  // Handle question timer
  useEffect(() => {
    if (!game.settings.timeLimit || !currentQuestion || !game.isActive) return;

    setQuestionStartTime(Date.now());
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - questionStartTime) / 1000);
      const remaining = Math.max(0, game.settings.timeLimit! - elapsed);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        setShowAnswer(true);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [game.settings.timeLimit, currentQuestion?.id, game.isActive, questionStartTime]);

  const handleOptIn = () => {
    setUserConsent(true);
    auditLogger.logEvent({
      eventType: 'consent_updated',
      staffId: currentGuestId || 'unknown',
      guestId: currentGuestId,
      details: { consent: true, gameType: 'trivia', gameId: game.id },
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
      details: { consent: false, gameType: 'trivia', gameId: game.id },
      severity: 'info',
      category: 'compliance'
    });
  };

  const handleAnswer = async (answerIndex: number) => {
    if (!currentGuestId || !currentQuestion || hasAnswered || isGamePaused) return;

    const vote: GameVote = {
      gameId: game.id,
      guestId: currentGuestId,
      optionId: `${currentQuestion.id}_${answerIndex}`,
      timestamp: new Date()
    };

    try {
      submitVote(vote);
      setSelectedAnswer(answerIndex);
      setHasAnswered(true);

      auditLogger.logEvent({
        eventType: 'vote_submitted',
        staffId: 'system',
        guestId: currentGuestId,
        gameId: game.id,
        details: { 
          questionId: currentQuestion.id,
          answerIndex,
          isCorrect: answerIndex === currentQuestion.correctAnswer,
          question: currentQuestion.question
        },
        severity: 'info',
        category: 'user_action'
      });

      onVoteSubmit?.(vote);
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const handleStaffAction = async (action: 'pause' | 'resume' | 'next_question' | 'show_answer' | 'prev_question') => {
    if (!isStaff) return;

    try {
      switch (action) {
        case 'pause':
          await pauseGame('Staff initiated pause');
          break;
        case 'resume':
          await resumeGame();
          break;
        case 'show_answer':
          setShowAnswer(true);
          break;
        case 'next_question':
          if (!isLastQuestion) {
            const updatedGame = {
              ...game,
              currentQuestionIndex: game.currentQuestionIndex + 1
            };
            setShowAnswer(false);
            setQuestionStartTime(Date.now());
            onGameUpdate?.(updatedGame);
            
            auditLogger.logEvent({
              eventType: 'settings_changed',
              staffId: 'staff-default',
              gameId: game.id,
              details: { action: 'next_question', newIndex: updatedGame.currentQuestionIndex },
              severity: 'info',
              category: 'user_action'
            });
          }
          break;
        case 'prev_question':
          if (game.currentQuestionIndex > 0) {
            const updatedGame = {
              ...game,
              currentQuestionIndex: game.currentQuestionIndex - 1
            };
            setShowAnswer(false);
            setQuestionStartTime(Date.now());
            onGameUpdate?.(updatedGame);
            
            auditLogger.logEvent({
              eventType: 'settings_changed',
              staffId: 'staff-default',
              gameId: game.id,
              details: { action: 'prev_question', newIndex: updatedGame.currentQuestionIndex },
              severity: 'info',
              category: 'user_action'
            });
          }
          break;
      }
    } catch (error) {
      console.error(`Failed to perform ${action}:`, error);
    }
  };

  const calculateCurrentScores = () => {
    if (!gameState.votes.length) return [];
    
    const triviaVotes = gameState.votes.filter(vote => vote.gameId === game.id);
    return scoreCalculator.calculateTriviaScores(game, triviaVotes);
  };

  const getAnswerResults = () => {
    if (!currentQuestion) return [];
    
    const questionVotes = gameState.votes.filter(
      vote => vote.gameId === game.id && vote.optionId?.includes(currentQuestion.id)
    );

    const answerCounts = currentQuestion.options.map((_, index) => {
      const count = questionVotes.filter(vote => {
        const answerIndex = parseInt(vote.optionId?.split('_').pop() || '0');
        return answerIndex === index;
      }).length;
      return count;
    });

    const totalAnswers = answerCounts.reduce((sum, count) => sum + count, 0);

    return currentQuestion.options.map((option, index) => ({
      option,
      count: answerCounts[index],
      percentage: totalAnswers > 0 ? Math.round((answerCounts[index] / totalAnswers) * 100) : 0,
      isCorrect: index === currentQuestion.correctAnswer
    }));
  };

  // Consent flow for participants
  if (!isStaff && currentGuestId && userConsent === null) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">🧠</div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Join the Trivia?
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 mb-4">
            Test your knowledge with {game.questions.length} questions!
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
              Join Trivia
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
          You've chosen not to participate in this trivia.
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

  if (!currentQuestion) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-4">
          Trivia Complete!
        </h2>
        
        {/* Final Scores */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Final Scores
          </h3>
          <div className="space-y-2">
            {calculateCurrentScores().slice(0, 5).map((score, index) => (
              <div key={score.guestId} className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-neutral-600 dark:text-neutral-400">
                    #{index + 1}
                  </span>
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {guests.find(g => g.id === score.guestId)?.name || `Guest ${score.guestId}`}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary-600">{score.score} pts</div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400">
                    {score.details.correctAnswers}/{score.details.totalAnswers} correct
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const answerResults = getAnswerResults();
  const currentScores = calculateCurrentScores();

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-purple-500 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🧠 Trivia</h2>
            <p className="text-purple-100">
              Question {game.currentQuestionIndex + 1} of {game.questions.length}
            </p>
          </div>
          
          {timeRemaining !== null && (
            <div className="text-right">
              <div className="text-sm text-purple-100">Time Remaining</div>
              <div className="text-2xl font-bold">
                {timeRemaining}s
              </div>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="bg-purple-400 rounded-full h-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300"
              style={{ width: `${((game.currentQuestionIndex + 1) / game.questions.length) * 100}%` }}
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
            <span>✏️</span>
            {gameState.votes.filter(v => v.gameId === game.id && v.optionId?.includes(currentQuestion.id)).length} answers
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
              onClick={() => handleStaffAction('show_answer')}
              className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-sm font-medium transition-colors duration-200"
            >
              🔍 Show Answer
            </button>
            <button
              onClick={() => handleStaffAction('prev_question')}
              disabled={game.currentQuestionIndex === 0}
              className="px-3 py-1 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors duration-200"
            >
              ⬅️ Previous
            </button>
            <button
              onClick={() => handleStaffAction('next_question')}
              disabled={isLastQuestion}
              className="px-3 py-1 bg-neutral-500 hover:bg-neutral-600 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded text-sm font-medium transition-colors duration-200"
            >
              ➡️ Next
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-6">
        {/* Question */}
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            {currentQuestion.question}
          </h3>
        </div>

        {!showAnswer ? (
          /* Answer Options */
          <div className="space-y-3">
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index)}
                disabled={hasAnswered || isGamePaused || !currentGuestId}
                className={`w-full p-4 rounded-lg border-2 text-left transition-all duration-200 ${
                  selectedAnswer === index
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : hasAnswered
                    ? 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 opacity-60'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/10'
                } ${!currentGuestId || isGamePaused ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-neutral-900 dark:text-neutral-100">
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                  {selectedAnswer === index && (
                    <span className="text-purple-500 text-xl">✓</span>
                  )}
                </div>
              </button>
            ))}

            {hasAnswered && (
              <div className="text-center mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
                <span className="text-green-800 dark:text-green-200 font-medium">
                  ✅ Your answer has been recorded!
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Answer Results */
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Results
            </h3>
            
            <div className="space-y-3">
              {answerResults.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  result.isCorrect 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                    : 'border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-neutral-900 dark:text-neutral-100">
                      {String.fromCharCode(65 + index)}. {result.option}
                      {result.isCorrect && <span className="ml-2 text-green-600">✓ Correct</span>}
                    </span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {result.count} ({result.percentage}%)
                    </span>
                  </div>
                  
                  <div className="relative h-3 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-500 ease-out ${
                        result.isCorrect ? 'bg-green-500' : 'bg-neutral-400'
                      }`}
                      style={{ width: `${result.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {currentQuestion.explanation && (
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Explanation
                </h4>
                <p className="text-blue-800 dark:text-blue-200 text-sm">
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Top 3 Current Scores */}
            {currentScores.length > 0 && (
              <div className="mt-6 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-lg">
                <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                  Current Leaderboard
                </h4>
                <div className="space-y-2">
                  {currentScores.slice(0, 3).map((score, index) => (
                    <div key={score.guestId} className="flex items-center justify-between">
                      <span className="text-neutral-700 dark:text-neutral-300">
                        #{index + 1} {guests.find(g => g.id === score.guestId)?.name || `Guest ${score.guestId}`}
                      </span>
                      <span className="font-semibold text-primary-600">
                        {score.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TriviaGame; 