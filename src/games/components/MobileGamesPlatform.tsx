import React, { useState, useEffect } from 'react';
import { Game, Poll, Event, Guest } from '../../types';
import { useGameState } from '../../hooks/useGameState';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';
import { createGameStateManager } from '../../utils/gameStateManager';

interface MobileGamesPlatformProps {
  event: Event;
  guests: Guest[];
  isStaff?: boolean;
}

const MobileGamesPlatform: React.FC<MobileGamesPlatformProps> = ({ 
  event, 
  guests, 
  isStaff = false 
}) => {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<'poll' | 'trivia' | 'icebreaker' | 'bingo'>('poll');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Initialize game state management
  const gameStateManager = createGameStateManager(event.id);
  const { gameState, launchGame, stopGame } = useGameState(event.id);
  
  // Set up real-time updates for active game
  const { isConnected, lastUpdate } = useRealTimeUpdates(
    gameState.activeGame?.id || null,
    {
      onGameUpdate: (updatedGame) => {
        setActiveGames(prev => 
          prev.map(game => 
            game.id === updatedGame.id ? updatedGame : game
          )
        );
      },
      onParticipantUpdate: (participants) => {
        console.log('Participants updated:', participants.length);
      },
      onVoteUpdate: (voteCount) => {
        console.log('Votes updated:', voteCount);
      }
    }
  );

  const gameTypes = [
    { id: 'poll', name: 'Poll', icon: '📊', color: 'bg-blue-500', description: 'Quick community voting' },
    { id: 'trivia', name: 'Trivia', icon: '🧠', color: 'bg-purple-500', description: 'Knowledge challenges' },
    { id: 'icebreaker', name: 'Icebreaker', icon: '🔥', color: 'bg-pink-500', description: 'Social connection' },
    { id: 'bingo', name: 'Bingo', icon: '🎯', color: 'bg-green-500', description: 'Interactive bingo' }
  ];

  const handleLaunchGame = (gameId: string) => {
    const gameToLaunch = activeGames.find(game => game.id === gameId);
    if (!gameToLaunch) return;

    // Stop any currently active game first
    const currentlyActive = activeGames.find(game => game.isActive);
    if (currentlyActive && currentlyActive.id !== gameId) {
      handleStopGame(currentlyActive.id);
    }

    // Launch the new game
    const updatedGame = { ...gameToLaunch, isActive: true };
    launchGame(updatedGame);
    gameStateManager.startGameSession(updatedGame, 'staff-1');
    
    setActiveGames(prev => 
      prev.map(game => 
        game.id === gameId 
          ? updatedGame
          : { ...game, isActive: false }
      )
    );
  };

  const handleStopGame = (gameId: string) => {
    stopGame();
    gameStateManager.endGameSession(gameId, 'completed');
    
    setActiveGames(prev => 
      prev.map(game => 
        game.id === gameId 
          ? { ...game, isActive: false }
          : game
      )
    );
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              🎮 Interactive Games
            </h1>
            {gameState.activeGame && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isConnected ? 'Live' : 'Connecting...'}
                </span>
              </div>
            )}
          </div>
          
          {isStaff && (
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Connection Status Bar */}
        <div className="mt-2 text-xs text-neutral-600 dark:text-neutral-400">
          {guests.length} participants available
          {lastUpdate && (
            <span className="ml-2">
              • Updated {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute top-16 right-4 bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-4 min-w-48">
            <button
              onClick={() => {
                setIsCreatingGame(true);
                setShowMobileMenu(false);
              }}
              className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              ➕ Create Game
            </button>
            <button
              onClick={() => setShowMobileMenu(false)}
              className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded"
            >
              📊 Analytics
            </button>
          </div>
        </div>
      )}

      {/* Active Game Alert - Mobile Optimized */}
      {gameState.activeGame && (
        <div className="mx-4 mt-4 bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">🎯</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-accent-900 dark:text-accent-100 text-sm">
                Game in Progress
              </h3>
              <p className="text-accent-700 dark:text-accent-300 text-xs truncate">
                {gameState.activeGame.title}
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-accent-600 dark:text-accent-400">
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  <span>{gameState.participants.length}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span>🗳️</span>
                  <span>{gameState.votes.length}</span>
                </span>
                {gameState.activeGame.settings.timeLimit && (
                  <span className="flex items-center gap-1">
                    <span>⏱️</span>
                    <span>{gameState.activeGame.settings.timeLimit}s</span>
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              Live
            </span>
          </div>
          
          {/* Quick Actions - Mobile */}
          {isStaff && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => handleStopGame(gameState.activeGame!.id)}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                aria-label={`Stop ${gameState.activeGame.title}`}
              >
                Stop Game
              </button>
              <button
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                aria-label="View game details"
              >
                View Details
              </button>
            </div>
          )}
        </div>
      )}

      {/* Game Type Selector - Horizontal Scroll */}
      {isStaff && (
        <div className="px-4 mt-6">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">
            Game Types
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {gameTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedGameType(type.id as any)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all min-w-[100px] min-h-[44px] ${
                  selectedGameType === type.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800'
                }`}
                aria-label={`Select ${type.name} game type`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                  {type.name}
                </span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                  {type.description}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Games List - Mobile Grid */}
      <div className="px-4 mt-6 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Available Games
          </h2>
          {isStaff && (
            <button
              onClick={() => setIsCreatingGame(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] flex items-center gap-2"
              aria-label="Create new game"
            >
              <span>➕</span>
              Create
            </button>
          )}
        </div>

        {activeGames.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-4xl mb-4 block">🎮</span>
            <h3 className="text-lg font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              No games yet
            </h3>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              {isStaff ? 'Create your first interactive game' : 'Wait for staff to create games'}
            </p>
            {isStaff && (
              <button
                onClick={() => setIsCreatingGame(true)}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-colors min-h-[44px]"
              >
                Create Game
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            {activeGames.map((game) => (
              <div
                key={game.id}
                className={`bg-white dark:bg-neutral-800 rounded-lg border-2 p-4 transition-all ${
                  game.isActive 
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/20' 
                    : 'border-neutral-200 dark:border-neutral-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">
                    {game.type === 'poll' && '📊'}
                    {game.type === 'trivia' && '🧠'}
                    {game.type === 'icebreaker' && '🔥'}
                    {game.type === 'bingo' && '🎯'}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm leading-tight">
                        {game.title}
                      </h3>
                      {game.isActive && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 shrink-0">
                          Active
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 line-clamp-2">
                      {game.description}
                    </p>
                    
                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      <span className="flex items-center gap-1">
                        <span>👥</span>
                        <span>{game.participants?.length || 0}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>📊</span>
                        <span className="capitalize">{game.type}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <span>⏱️</span>
                        <span>{game.settings?.timeLimit || 'No limit'}</span>
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                {isStaff && (
                  <div className="flex gap-2 mt-4">
                    {!game.isActive ? (
                      <button
                        onClick={() => handleLaunchGame(game.id)}
                        className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-3 py-2 rounded text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                        aria-label={`Launch ${game.title}`}
                      >
                        Launch Game
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStopGame(game.id)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                        aria-label={`Stop ${game.title}`}
                      >
                        Stop Game
                      </button>
                    )}
                    <button
                      className="px-4 py-2 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded text-sm font-medium transition-colors min-h-[44px] flex items-center justify-center"
                      aria-label={`Edit ${game.title}`}
                    >
                      ✏️
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Game Modal - Bottom Sheet Style */}
      {isCreatingGame && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-800 rounded-t-xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Create New Game
              </h3>
              <button
                onClick={() => setIsCreatingGame(false)}
                className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300"
                aria-label="Close create game modal"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Select a game type to create an interactive experience for your community.
              </p>
              
              <div className="grid gap-3">
                {gameTypes.map((type) => (
                  <button
                    key={type.id}
                    className="flex items-center gap-4 p-4 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors min-h-[44px]"
                    onClick={() => {
                      setSelectedGameType(type.id as any);
                      // TODO: Navigate to game creation form
                      setIsCreatingGame(false);
                    }}
                  >
                    <span className="text-2xl">{type.icon}</span>
                    <div className="text-left">
                      <h4 className="font-medium text-neutral-900 dark:text-neutral-100">
                        {type.name}
                      </h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileGamesPlatform; 