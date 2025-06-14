import React, { useState, useEffect, useCallback } from 'react';
import { QrScanner } from '../../../components/QrScanner';
import { UnoGameEngine, PhysicalCardInput } from '../../utils/unoGameEngine';
import { UnoCard, UnoColor, GamePlayer } from '../../../types/game-types';

interface UnoGameProps {
  gameId: string;
  players: GamePlayer[];
  currentUserId: string;
  onGameUpdate?: (gameState: any) => void;
}

const UnoGame: React.FC<UnoGameProps> = ({ 
  gameId, 
  players, 
  currentUserId, 
  onGameUpdate 
}) => {
  const [gameEngine, setGameEngine] = useState<UnoGameEngine | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualCardInput, setManualCardInput] = useState('');
  const [gameState, setGameState] = useState<any>(null);
  const [selectedWildColor, setSelectedWildColor] = useState<UnoColor | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [gameMessage, setGameMessage] = useState('');

  // Initialize game engine
  useEffect(() => {
    const engine = new UnoGameEngine(gameId, players);
    setGameEngine(engine);
    setGameState(engine.getGameState());
  }, [gameId, players]);

  // Update game state
  const updateGameState = useCallback(() => {
    if (gameEngine) {
      const state = gameEngine.getGameState();
      setGameState(state);
      onGameUpdate?.(state);
    }
  }, [gameEngine, onGameUpdate]);

  // Handle QR code scan
  const handleQrScan = async (result: string) => {
    if (!gameEngine) return;
    
    setIsScanning(false);
    
    try {
      const cardInput: PhysicalCardInput = {
        method: 'qr_scan',
        cardId: result,
        playerId: currentUserId,
        timestamp: new Date().toISOString(),
        confidence: 0.95
      };

      const playResult = await gameEngine.processPhysicalCardInput(cardInput);
      
      if (playResult.success) {
        // Check if it's a wild card that needs color selection
        if (playResult.action?.card?.isWild) {
          setShowColorPicker(true);
        }
        updateGameState();
        setGameMessage('Card played successfully!');
      } else {
        setGameMessage(`Error: ${playResult.message}`);
      }
    } catch (error) {
      setGameMessage(`Failed to process card: ${error}`);
    }
  };

  // Handle manual card entry
  const handleManualCardEntry = async () => {
    if (!gameEngine || !manualCardInput.trim()) return;

    try {
      const cardInput: PhysicalCardInput = {
        method: 'manual_entry',
        cardId: manualCardInput.trim(),
        playerId: currentUserId,
        timestamp: new Date().toISOString()
      };

      const playResult = await gameEngine.processPhysicalCardInput(cardInput);
      
      if (playResult.success) {
        if (playResult.action?.card?.isWild) {
          setShowColorPicker(true);
        }
        updateGameState();
        setGameMessage('Card played successfully!');
        setManualCardInput('');
        setShowManualEntry(false);
      } else {
        setGameMessage(`Error: ${playResult.message}`);
      }
    } catch (error) {
      setGameMessage(`Failed to process card: ${error}`);
    }
  };

  // Handle wild card color selection
  const handleColorSelection = (color: UnoColor) => {
    if (!gameEngine) return;

    const action = {
      type: 'choose_color' as const,
      playerId: currentUserId,
      timestamp: new Date().toISOString(),
      chosenColor: color
    };

    gameEngine.processAction(action);
    updateGameState();
    setShowColorPicker(false);
    setSelectedWildColor(null);
  };

  // Handle draw card
  const handleDrawCard = () => {
    if (!gameEngine) return;

    const action = {
      type: 'draw_card' as const,
      playerId: currentUserId,
      timestamp: new Date().toISOString()
    };

    gameEngine.processAction(action);
    updateGameState();
    setGameMessage('Drew a card');
  };

  // Handle Uno call
  const handleCallUno = () => {
    if (!gameEngine) return;

    const action = {
      type: 'call_uno' as const,
      playerId: currentUserId,
      timestamp: new Date().toISOString()
    };

    gameEngine.processAction(action);
    updateGameState();
    setGameMessage('UNO called!');
  };

  // Get current player info
  const currentPlayer = gameEngine?.getCurrentPlayer();
  const isMyTurn = currentPlayer?.id === currentUserId;
  const currentCard = gameEngine?.getCurrentCard();
  const myHand = gameEngine?.getPlayerHand(currentUserId) || [];
  const validMoves = gameEngine?.getValidMoves(currentUserId) || [];

  // Card color styling
  const getCardColorClass = (card: UnoCard) => {
    const color = card.chosenColor || card.color;
    switch (color) {
      case 'red': return 'bg-red-500 text-white';
      case 'blue': return 'bg-blue-500 text-white';
      case 'green': return 'bg-green-500 text-white';
      case 'yellow': return 'bg-yellow-400 text-black';
      case 'wild': return 'bg-gray-800 text-white';
      default: return 'bg-gray-300 text-black';
    }
  };

  // Format card display
  const formatCard = (card: UnoCard) => {
    if (card.type === 'number') return card.value?.toString() || '?';
    if (card.type === 'skip') return 'Skip';
    if (card.type === 'reverse') return 'Rev';
    if (card.type === 'draw_two') return '+2';
    if (card.type === 'wild') return 'Wild';
    if (card.type === 'wild_draw_four') return '+4';
    return '?';
  };

  if (!gameState) {
    return <div className="p-4">Loading game...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Game Header */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-2xl font-bold text-center mb-4">Physical Uno Game</h2>
        
        {/* Game Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Current Player</p>
            <p className="font-semibold">{currentPlayer?.name || 'Unknown'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Direction</p>
            <p className="font-semibold">{gameState.direction}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Cards in Deck</p>
            <p className="font-semibold">{gameState.deck.length}</p>
          </div>
        </div>

        {/* Game Message */}
        {gameMessage && (
          <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded text-center">
            {gameMessage}
          </div>
        )}
      </div>

      {/* Current Card */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3 text-center">Current Card</h3>
        <div className="flex justify-center">
          {currentCard && (
            <div className={`w-20 h-28 rounded-lg border-2 border-gray-400 flex items-center justify-center font-bold text-lg ${getCardColorClass(currentCard)}`}>
              {formatCard(currentCard)}
              {currentCard.chosenColor && (
                <div className="absolute top-1 right-1 w-3 h-3 rounded-full border border-white"
                     style={{ backgroundColor: currentCard.chosenColor }}></div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Player Actions */}
      {isMyTurn && (
        <div className="bg-white rounded-lg shadow-md p-4">
          <h3 className="text-lg font-semibold mb-4 text-center">Your Turn - Play a Card</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* QR Scanner */}
            <button
              onClick={() => setIsScanning(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              📷 Scan Card QR
            </button>

            {/* Manual Entry */}
            <button
              onClick={() => setShowManualEntry(true)}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              ✏️ Enter Card ID
            </button>

            {/* Draw Card */}
            <button
              onClick={handleDrawCard}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              🎴 Draw Card
            </button>
          </div>

          {/* Uno Button */}
          {myHand.length === 1 && (
            <div className="text-center">
              <button
                onClick={handleCallUno}
                className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg text-xl animate-pulse"
              >
                🎯 CALL UNO!
              </button>
            </div>
          )}
        </div>
      )}

      {/* Player Hand Info */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Your Hand</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-600">Cards in Hand</p>
            <p className="font-semibold text-xl">{myHand.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Valid Moves</p>
            <p className="font-semibold text-xl">{validMoves.length}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Uno Called</p>
            <p className="font-semibold">{gameState.unoCallouts[currentUserId] ? 'Yes' : 'No'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Position</p>
            <p className="font-semibold">Player {players.findIndex(p => p.id === currentUserId) + 1}</p>
          </div>
        </div>
      </div>

      {/* All Players Status */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Players</h3>
        <div className="space-y-2">
          {players.map((player, index) => {
            const handSize = gameState.playerHands[player.id]?.length || 0;
            const hasCalledUno = gameState.unoCallouts[player.id];
            const isCurrentPlayer = gameState.currentTurn === player.id;
            
            return (
              <div
                key={player.id}
                className={`flex justify-between items-center p-3 rounded ${
                  isCurrentPlayer ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="font-semibold">{player.name}</span>
                  {isCurrentPlayer && <span className="text-blue-600">👈 Current</span>}
                  {hasCalledUno && <span className="text-red-600">UNO!</span>}
                </div>
                <div className="text-right">
                  <span className="font-semibold">{handSize} cards</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR Scanner Modal */}
      {isScanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Scan Card QR Code</h3>
            <QrScanner onScan={handleQrScan} onClose={() => setIsScanning(false)} />
            <button
              onClick={() => setIsScanning(false)}
              className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Manual Entry Modal */}
      {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Enter Card ID</h3>
            <input
              type="text"
              value={manualCardInput}
              onChange={(e) => setManualCardInput(e.target.value)}
              placeholder="Enter card ID (e.g., red-5-abc123)"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleManualCardEntry}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded"
              >
                Play Card
              </button>
              <button
                onClick={() => {
                  setShowManualEntry(false);
                  setManualCardInput('');
                }}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Wild Color Picker Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-center">Choose Wild Card Color</h3>
            <div className="grid grid-cols-2 gap-4">
              {(['red', 'blue', 'green', 'yellow'] as UnoColor[]).map(color => (
                <button
                  key={color}
                  onClick={() => handleColorSelection(color)}
                  className={`py-6 rounded-lg font-semibold text-white transition-transform hover:scale-105 ${
                    color === 'red' ? 'bg-red-500' :
                    color === 'blue' ? 'bg-blue-500' :
                    color === 'green' ? 'bg-green-500' :
                    'bg-yellow-400 text-black'
                  }`}
                >
                  {color.charAt(0).toUpperCase() + color.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game End */}
      {gameState.status === 'finished' && (
        <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
          <h3 className="text-2xl font-bold text-green-800 mb-2">Game Finished!</h3>
          <p className="text-green-700">
            Winner: {players.find(p => p.id === gameState.winner)?.name || 'Unknown'}
          </p>
        </div>
      )}
    </div>
  );
};

export default UnoGame; 