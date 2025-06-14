import React, { useState, useEffect } from 'react';
import { Game, Guest } from '../../types';
import { useGameState } from '../../hooks/useGameState';

interface MobileGameLobbyProps {
  eventId: string;
  guest: Guest;
  onJoinGame?: (gameId: string, guestId: string) => void;
  onLeaveGame?: (gameId: string, guestId: string) => void;
}

const MobileGameLobby: React.FC<MobileGameLobbyProps> = ({ 
  eventId, 
  guest, 
  onJoinGame, 
  onLeaveGame 
}) => {
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showContentWarning, setShowContentWarning] = useState(false);
  const [hasAcceptedConsent, setHasAcceptedConsent] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const {
    gameState,
    joinGame,
    leaveGame,
    isParticipant
  } = useGameState(eventId);

  const activeGame = gameState.activeGame;
  const consentRequired = activeGame?.settings.allowOptOut;
  const contentWarning = activeGame?.settings.contentWarning;
  const joined = isParticipant(guest.id);

  useEffect(() => {
    // Show content warning on game load if required
    if (activeGame && contentWarning && !joined) {
      setShowContentWarning(true);
    }
  }, [activeGame, contentWarning, joined]);

  const handleJoinClick = () => {
    if (consentRequired && !hasAcceptedConsent) {
      setShowConsentModal(true);
      return;
    }
    
    performJoinGame();
  };

  const performJoinGame = () => {
    if (!activeGame) return;
    
    setIsAnimating(true);
    joinGame(guest.id);
    onJoinGame?.(activeGame.id, guest.id);
    
    // Animate success
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleLeaveGame = () => {
    if (!activeGame) return;
    
    setIsAnimating(true);
    leaveGame(guest.id);
    onLeaveGame?.(activeGame.id, guest.id);
    setHasAcceptedConsent(false);
    
    setTimeout(() => setIsAnimating(false), 500);
  };

  const handleConsentAccept = () => {
    setHasAcceptedConsent(true);
    setShowConsentModal(false);
    performJoinGame();
  };

  if (!activeGame) {
    return (
      <div className="text-center py-8 px-4">
        <span className="text-4xl mb-4 block">🎮</span>
        <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          No Active Games
        </h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          Wait for staff to start an interactive game
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg mx-4 mt-4">
      {/* Game Header */}
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <div className="flex items-start gap-3">
          <span className="text-2xl mt-0.5">
            {activeGame.type === 'poll' && '📊'}
            {activeGame.type === 'trivia' && '🧠'}
            {activeGame.type === 'icebreaker' && '🔥'}
            {activeGame.type === 'bingo' && '🎯'}
          </span>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 leading-tight">
              {activeGame.title}
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              {activeGame.description}
            </p>
            
            <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <span>👥</span>
                <span>{gameState.participants.length} participants</span>
              </span>
              <span className="flex items-center gap-1">
                <span>📊</span>
                <span className="capitalize">{activeGame.type}</span>
              </span>
              {activeGame.settings?.timeLimit && (
                <span className="flex items-center gap-1">
                  <span>⏱️</span>
                  <span>{activeGame.settings.timeLimit}s limit</span>
                </span>
              )}
            </div>
          </div>
          
          <div className="shrink-0">
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              Live
            </span>
          </div>
        </div>
      </div>

      {/* Content Warning */}
      {contentWarning && !joined && (
        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border-b border-orange-200 dark:border-orange-700">
          <div className="flex gap-3">
            <span className="text-orange-500 text-lg mt-0.5">⚠️</span>
            <div>
              <h4 className="font-medium text-orange-800 dark:text-orange-200 text-sm">
                Content Advisory
              </h4>
              <p className="text-orange-700 dark:text-orange-300 text-sm mt-1">
                {contentWarning}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participation Status */}
      <div className="p-4">
        {!joined ? (
          <div className="space-y-4">
            {consentRequired && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                  💡 <strong>Participation is voluntary.</strong> By joining, you consent to participate in this game. 
                  You may opt out at any time during the activity.
                </p>
              </div>
            )}
            
            <button
              onClick={handleJoinClick}
              disabled={isAnimating}
              className={`w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-4 rounded-lg font-medium transition-all duration-200 min-h-[56px] flex items-center justify-center gap-2 ${
                isAnimating ? 'scale-95' : 'scale-100'
              }`}
              aria-label={`Join ${activeGame.title} game`}
            >
              {isAnimating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>🎮</span>
                  <span>Join Game</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-green-500 text-xl">✅</span>
                <div>
                  <h4 className="font-medium text-green-800 dark:text-green-200 text-sm">
                    You're participating!
                  </h4>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Ready to play? The game will start shortly.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLeaveGame}
              disabled={isAnimating}
              className={`w-full bg-red-500 hover:bg-red-600 disabled:bg-red-400 text-white px-6 py-4 rounded-lg font-medium transition-all duration-200 min-h-[56px] flex items-center justify-center gap-2 ${
                isAnimating ? 'scale-95' : 'scale-100'
              }`}
              aria-label={`Leave ${activeGame.title} game`}
            >
              {isAnimating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Leaving...</span>
                </>
              ) : (
                <>
                  <span>🚪</span>
                  <span>Leave Game</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Participants List */}
      {gameState.participants.length > 0 && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <h4 className="font-semibold text-sm mb-3 text-neutral-800 dark:text-neutral-200">
            Participants ({gameState.participants.length})
          </h4>
          <div className="flex flex-wrap gap-2">
            {gameState.participants.slice(0, 10).map((pid, index) => (
              <div
                key={pid}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs transition-all ${
                  pid === guest.id
                    ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 border border-primary-300 dark:border-primary-700'
                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                }`}
              >
                {pid === guest.id ? (
                  <>
                    <span className="w-1.5 h-1.5 bg-primary-500 rounded-full mr-1.5"></span>
                    You
                  </>
                ) : (
                  `Guest ${pid.slice(-4)}`
                )}
              </div>
            ))}
            {gameState.participants.length > 10 && (
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                +{gameState.participants.length - 10} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-t-xl sm:rounded-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🤝</span>
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  Participation Consent
                </h3>
              </div>
              
              <div className="space-y-4 text-sm text-neutral-700 dark:text-neutral-300">
                <p>
                  <strong>Before joining "{activeGame.title}":</strong>
                </p>
                
                <ul className="space-y-2 pl-4">
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Your participation is completely voluntary</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>You can leave the game at any time</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Your responses may be visible to other participants</span>
                  </li>
                  <li className="flex gap-2">
                    <span>•</span>
                    <span>Game data is stored locally and not shared externally</span>
                  </li>
                </ul>
                
                {contentWarning && (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded">
                    <p className="text-orange-800 dark:text-orange-200">
                      <strong>Content Advisory:</strong> {contentWarning}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowConsentModal(false)}
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConsentAccept}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px]"
                >
                  I Consent & Join
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Warning Modal */}
      {showContentWarning && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-800 rounded-t-xl sm:rounded-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">⚠️</span>
                <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">
                  Content Advisory
                </h3>
              </div>
              
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-6">
                {contentWarning}
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowContentWarning(false);
                    // Navigate away or close lobby
                  }}
                  className="flex-1 bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-300 px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px]"
                >
                  Back
                </button>
                <button
                  onClick={() => setShowContentWarning(false)}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-medium transition-colors min-h-[48px]"
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGameLobby; 