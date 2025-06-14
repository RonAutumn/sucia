import React from 'react';
import { Game, Poll, Trivia, Icebreaker, Bingo, Guest, GameVote } from '../../types';
import PollGame from './game-types/PollGame';
import TriviaGame from './game-types/TriviaGame';
import IcebreakerGame from './game-types/IcebreakerGame';
import BingoGame from './game-types/BingoGame';

interface GameRouterProps {
  game: Game;
  guests: Guest[];
  currentGuestId?: string;
  isStaff?: boolean;
  onVoteSubmit?: (vote: GameVote) => void;
  onGameUpdate?: (game: Game) => void;
}

const GameRouter: React.FC<GameRouterProps> = ({
  game,
  guests,
  currentGuestId,
  isStaff = false,
  onVoteSubmit,
  onGameUpdate
}) => {
  // Type-safe casting based on game type
  const renderGame = () => {
    switch (game.type) {
      case 'poll':
        return (
          <PollGame
            game={game as Poll}
            guests={guests}
            currentGuestId={currentGuestId}
            isStaff={isStaff}
            onVoteSubmit={onVoteSubmit}
            onGameUpdate={(updatedGame) => onGameUpdate?.(updatedGame)}
          />
        );
      
      case 'trivia':
        return (
          <TriviaGame
            game={game as Trivia}
            guests={guests}
            currentGuestId={currentGuestId}
            isStaff={isStaff}
            onVoteSubmit={onVoteSubmit}
            onGameUpdate={(updatedGame) => onGameUpdate?.(updatedGame)}
          />
        );
      
      case 'icebreaker':
        return (
          <IcebreakerGame
            game={game as Icebreaker}
            guests={guests}
            currentGuestId={currentGuestId}
            isStaff={isStaff}
            onVoteSubmit={onVoteSubmit}
            onGameUpdate={(updatedGame) => onGameUpdate?.(updatedGame)}
          />
        );
      
      case 'bingo':
        return (
          <BingoGame
            game={game as Bingo}
            guests={guests}
            currentGuestId={currentGuestId}
            isStaff={isStaff}
            onVoteSubmit={onVoteSubmit}
            onGameUpdate={(updatedGame) => onGameUpdate?.(updatedGame)}
          />
        );
      
      default:
        return (
          <div className="max-w-md mx-auto bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6 text-center">
            <div className="text-4xl mb-4">❓</div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              Unknown Game Type
            </h2>
            <p className="text-neutral-600 dark:text-neutral-400">
              The game type "{game.type}" is not supported.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 py-8">
      <div className="container mx-auto px-4">
        {renderGame()}
      </div>
    </div>
  );
};

export default GameRouter; 