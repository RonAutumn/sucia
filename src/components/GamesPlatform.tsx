import React, { useState, useEffect } from 'react';
import { Game, Poll, Event, Guest } from '../types';
import { mockGames, mockPolls } from '../data/mockData';
import { useGameState } from '../hooks/useGameState';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';
import { createGameStateManager } from '../utils/gameStateManager';
import GameCreationModal from './GameCreationModal';

interface GamesPlatformProps {
  event: Event;
  guests: Guest[];
}

const GamesPlatform: React.FC<GamesPlatformProps> = ({ event, guests }) => {
  const [activeGames, setActiveGames] = useState<Game[]>([]);
  const [selectedGameType, setSelectedGameType] = useState<'poll' | 'trivia' | 'icebreaker' | 'bingo'>('poll');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  
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

  useEffect(() => {
    // Load games for this event (from localStorage if available, fallback to mock data)
    const eventGames = mockGames.filter(game => game.eventId === event.id);
    
    // Enhance with persistent state
    const enhancedGames = eventGames.map(game => {
      const persistedGame = gameStateManager.loadGameState(game.id);
      return persistedGame || game;
    });
    
    setActiveGames(enhancedGames);
  }, [event.id]);

  const handleCreateGame = () => {
    setIsCreatingGame(true);
  };

  const handleGameCreate = (newGame: Game) => {
    // Add the new game to active games
    setActiveGames(prev => [...prev, newGame]);
    
    // Save to localStorage for persistence
    gameStateManager.saveGameState(newGame);

    // Log the creation
    gameStateManager.logAudit({
      action: 'game_created',
      gameId: newGame.id,
      staffId: newGame.staffId,
      details: {
        gameType: newGame.type,
        title: newGame.title
      }
    });
  };

  const handleLaunchGame = (gameId: string) => {
    const gameToLaunch = activeGames.find(game => game.id === gameId);
    if (!gameToLaunch) return;

    // Stop any currently active game first
    const currentlyActive = activeGames.find(game => game.isActive);
    if (currentlyActive && currentlyActive.id !== gameId) {
      handleStopGame(currentlyActive.id);
    }

    // Launch the new game using the game state hook
    const updatedGame = { ...gameToLaunch, isActive: true };
    launchGame(updatedGame);
    
    // Start game session for audit logging
    gameStateManager.startGameSession(updatedGame, 'staff-1'); // TODO: Use actual staff ID
    
    // Update local state
    setActiveGames(prev => 
      prev.map(game => 
        game.id === gameId 
          ? updatedGame
          : { ...game, isActive: false } // Only one active game at a time
      )
    );
  };

  const handleStopGame = (gameId: string) => {
    const gameToStop = activeGames.find(game => game.id === gameId);
    if (!gameToStop) return;

    // Stop the game using the game state hook
    stopGame();
    
    // End game session for audit logging
    gameStateManager.endGameSession(gameId, 'completed');
    
    // Update local state
    setActiveGames(prev => 
      prev.map(game => 
        game.id === gameId 
          ? { ...game, isActive: false }
          : game
      )
    );
  };

  const getGameTypeIcon = (type: string) => {
    switch (type) {
      case 'poll': return '📊';
      case 'trivia': return '🧠';
      case 'icebreaker': return '🔥';
      case 'bingo': return '🎯';
      default: return '🎮';
    }
  };

  const getGameTypeColor = (type: string) => {
    switch (type) {
      case 'poll': return 'bg-blue-500';
      case 'trivia': return 'bg-purple-500';
      case 'icebreaker': return 'bg-pink-500';
      case 'bingo': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-serif text-neutral-900 dark:text-neutral-100">
            🎮 Interactive Games
          </h2>
          <div className="flex items-center gap-4 mt-1">
            <p className="text-neutral-600 dark:text-neutral-400">
              Engage your community with live interactive games • {guests.length} participants available
            </p>
            {gameState.activeGame && (
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></span>
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {isConnected ? 'Live' : 'Connecting...'}
                  {lastUpdate && (
                    <span className="ml-1">
                      • Updated {lastUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </span>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={handleCreateGame}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center gap-2"
        >
          <span>➕</span>
          Create Game
        </button>
      </div>

      {/* Active Game Alert */}
      {gameState.activeGame && (
        <div className="bg-accent-50 dark:bg-accent-900/20 border border-accent-200 dark:border-accent-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <div>
              <h3 className="font-semibold text-accent-900 dark:text-accent-100">
                Game in Progress
              </h3>
              <p className="text-accent-700 dark:text-accent-300 text-sm">
                {gameState.activeGame.title} is currently running
              </p>
              <div className="flex items-center gap-4 mt-1 text-xs text-accent-600 dark:text-accent-400">
                <span className="flex items-center gap-1">
                  <span>👥</span>
                  {gameState.participants.length} participants
                </span>
                <span className="flex items-center gap-1">
                  <span>🗳️</span>
                  {gameState.votes.length} votes
                </span>
                {gameState.activeGame.settings.timeLimit && (
                  <span className="flex items-center gap-1">
                    <span>⏱️</span>
                    {gameState.activeGame.settings.timeLimit}s time limit
                  </span>
                )}
              </div>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5 animate-pulse"></span>
                Live
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeGames.map((game) => (
          <div
            key={game.id}
            className={`border rounded-lg p-4 transition-all duration-200 ${
              game.isActive 
                ? 'border-accent-300 dark:border-accent-600 bg-accent-50 dark:bg-accent-900/20' 
                : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-600'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{getGameTypeIcon(game.type)}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium text-white ${getGameTypeColor(game.type)}`}>
                  {game.type.charAt(0).toUpperCase() + game.type.slice(1)}
                </span>
              </div>
              {game.isActive && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  Active
                </span>
              )}
            </div>

            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
              {game.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-3">
              {game.description}
            </p>

            {/* Participants count */}
            <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              <span className="flex items-center gap-1">
                <span>👥</span>
                {game.isActive && gameState.activeGame?.id === game.id 
                  ? gameState.participants.length 
                  : game.participants.length} participants
              </span>
              {game.isActive && gameState.activeGame?.id === game.id && gameState.votes.length > 0 && (
                <span className="flex items-center gap-1">
                  <span>🗳️</span>
                  {gameState.votes.length} votes
                </span>
              )}
              {game.settings.timeLimit && (
                <span className="flex items-center gap-1">
                  <span>⏱️</span>
                  {game.settings.timeLimit}s
                </span>
              )}
            </div>

            {/* Content Warning */}
            {game.settings.contentWarning && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded p-2 mb-3">
                <p className="text-orange-800 dark:text-orange-200 text-xs">
                  ⚠️ {game.settings.contentWarning}
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {game.isActive ? (
                <button
                  onClick={() => handleStopGame(game.id)}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
                >
                  Stop Game
                </button>
              ) : (
                <button
                  onClick={() => handleLaunchGame(game.id)}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 px-3 rounded text-sm font-medium transition-colors duration-200"
                >
                  Launch Game
                </button>
              )}
              <button className="px-3 py-2 border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors duration-200">
                ⚙️
              </button>
            </div>
          </div>
        ))}

        {/* Create New Game Card */}
        <div 
          onClick={handleCreateGame}
          className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-6 flex flex-col items-center justify-center text-neutral-500 dark:text-neutral-400 hover:border-primary-400 dark:hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer transition-all duration-200 min-h-[200px]"
        >
          <span className="text-3xl mb-2">➕</span>
          <span className="font-medium">Create New Game</span>
          <span className="text-sm text-center mt-1">
            Add poll, trivia, icebreaker, or bingo
          </span>
        </div>
      </div>

      {/* Create Game Modal */}
      <GameCreationModal
        isOpen={isCreatingGame}
        onClose={() => setIsCreatingGame(false)}
        onGameCreate={handleGameCreate}
        event={event}
      />
    </div>
  );
};

export default GamesPlatform; 