import { UnoGameEngine, PhysicalCardInput } from '../unoGameEngine';
import { GamePlayer } from '../../../types/game-types';

describe('UnoGameEngine', () => {
  let engine: UnoGameEngine;
  let players: GamePlayer[];

  beforeEach(() => {
    players = [
      { id: 'player1', name: 'Alice', isHost: true, isActive: true, joinedAt: '2023-01-01T00:00:00Z' },
      { id: 'player2', name: 'Bob', isHost: false, isActive: true, joinedAt: '2023-01-01T00:00:01Z' },
      { id: 'player3', name: 'Charlie', isHost: false, isActive: true, joinedAt: '2023-01-01T00:00:02Z' }
    ];
    engine = new UnoGameEngine('test-game', players);
  });

  describe('Game Initialization', () => {
    test('should initialize game with correct players', () => {
      const gameState = engine.getGameState();
      expect(gameState.players).toEqual(players);
      expect(gameState.gameId).toBe('test-game');
      expect(gameState.gameType).toBe('uno');
    });

    test('should deal 7 cards to each player', () => {
      const gameState = engine.getGameState();
      players.forEach(player => {
        expect(gameState.playerHands[player.id]).toHaveLength(7);
      });
    });

    test('should have valid start card (number card)', () => {
      const currentCard = engine.getCurrentCard();
      expect(currentCard.type).toBe('number');
      expect(currentCard.isWild).toBeFalsy();
    });

    test('should initialize deck with correct number of cards', () => {
      const gameState = engine.getGameState();
      // Total cards = 108, minus 21 dealt (7 per player), minus 1 start card = 86
      expect(gameState.deck.length).toBe(86);
    });
  });

  describe('Card Validation', () => {
    test('should validate matching color', () => {
      const gameState = engine.getGameState();
      const currentCard = gameState.currentCard;
      const playerHand = gameState.playerHands['player1'];
      
      // Find a card with matching color
      const matchingCard = playerHand.find(card => card.color === currentCard.color);
      if (matchingCard) {
        const result = engine.isValidPlay(matchingCard, 'player1');
        expect(result.valid).toBe(true);
      }
    });

    test('should validate matching number', () => {
      const gameState = engine.getGameState();
      const currentCard = gameState.currentCard;
      const playerHand = gameState.playerHands['player1'];
      
      // Find a card with matching number
      const matchingCard = playerHand.find(card => 
        card.type === 'number' && card.value === currentCard.value
      );
      if (matchingCard) {
        const result = engine.isValidPlay(matchingCard, 'player1');
        expect(result.valid).toBe(true);
      }
    });

    test('should validate wild cards as always playable', () => {
      const gameState = engine.getGameState();
      const playerHand = gameState.playerHands['player1'];
      
      // Find a wild card
      const wildCard = playerHand.find(card => card.isWild);
      if (wildCard) {
        const result = engine.isValidPlay(wildCard, 'player1');
        expect(result.valid).toBe(true);
      }
    });

    test('should reject invalid plays', () => {
      const gameState = engine.getGameState();
      const currentCard = gameState.currentCard;
      const playerHand = gameState.playerHands['player1'];
      
      // Find a card that doesn't match
      const invalidCard = playerHand.find(card => 
        card.color !== currentCard.color && 
        card.type !== currentCard.type &&
        (card.type !== 'number' || card.value !== currentCard.value) &&
        !card.isWild
      );
      
      if (invalidCard) {
        const result = engine.isValidPlay(invalidCard, 'player1');
        expect(result.valid).toBe(false);
      }
    });
  });

  describe('Physical Card Input Processing', () => {
    test('should process valid physical card input', async () => {
      const gameState = engine.getGameState();
      const validCard = gameState.playerHands['player1'].find(card => 
        engine.isValidPlay(card, 'player1').valid
      );
      
      if (validCard) {
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: validCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString(),
          confidence: 0.95
        };

        const result = await engine.processPhysicalCardInput(input);
        expect(result.success).toBe(true);
        expect(result.action?.type).toBe('play_card');
        expect(result.action?.card?.id).toBe(validCard.id);
      }
    });

    test('should reject card not in player hand', async () => {
      const input: PhysicalCardInput = {
        method: 'manual_entry',
        cardId: 'non-existent-card',
        playerId: 'player1',
        timestamp: new Date().toISOString()
      };

      const result = await engine.processPhysicalCardInput(input);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Card not found');
    });

    test('should reject play when not player turn', async () => {
      const gameState = engine.getGameState();
      const validCard = gameState.playerHands['player2'].find(card => 
        engine.isValidPlay(card, 'player2').valid
      );
      
      if (validCard) {
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: validCard.id,
          playerId: 'player2', // Not player1's turn
          timestamp: new Date().toISOString()
        };

        const result = await engine.processPhysicalCardInput(input);
        expect(result.success).toBe(false);
        expect(result.message).toContain('Not your turn');
      }
    });
  });

  describe('Turn Management', () => {
    test('should advance turn after regular card play', async () => {
      const initialPlayer = engine.getCurrentPlayer();
      const gameState = engine.getGameState();
      const validCard = gameState.playerHands['player1'].find(card => 
        card.type === 'number' && engine.isValidPlay(card, 'player1').valid
      );
      
      if (validCard) {
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: validCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString()
        };

        await engine.processPhysicalCardInput(input);
        const newPlayer = engine.getCurrentPlayer();
        expect(newPlayer?.id).toBe('player2');
      }
    });

    test('should handle reverse card', async () => {
      const gameState = engine.getGameState();
      const reverseCard = gameState.playerHands['player1'].find(card => 
        card.type === 'reverse' && engine.isValidPlay(card, 'player1').valid
      );
      
      if (reverseCard) {
        const initialDirection = gameState.direction;
        
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: reverseCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString()
        };

        await engine.processPhysicalCardInput(input);
        const newGameState = engine.getGameState();
        expect(newGameState.direction).not.toBe(initialDirection);
      }
    });
  });

  describe('Special Cards', () => {
    test('should handle skip card', async () => {
      const gameState = engine.getGameState();
      const skipCard = gameState.playerHands['player1'].find(card => 
        card.type === 'skip' && engine.isValidPlay(card, 'player1').valid
      );
      
      if (skipCard) {
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: skipCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString()
        };

        await engine.processPhysicalCardInput(input);
        const newPlayer = engine.getCurrentPlayer();
        // Should skip player2 and go to player3
        expect(newPlayer?.id).toBe('player3');
      }
    });

    test('should handle draw two card', async () => {
      const gameState = engine.getGameState();
      const drawTwoCard = gameState.playerHands['player1'].find(card => 
        card.type === 'draw_two' && engine.isValidPlay(card, 'player1').valid
      );
      
      if (drawTwoCard) {
        const initialHandSize = gameState.playerHands['player2'].length;
        
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: drawTwoCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString()
        };

        await engine.processPhysicalCardInput(input);
        const newGameState = engine.getGameState();
        expect(newGameState.playerHands['player2'].length).toBe(initialHandSize + 2);
      }
    });
  });

  describe('Uno Calling', () => {
    test('should handle Uno call', () => {
      const action = {
        type: 'call_uno' as const,
        playerId: 'player1',
        timestamp: new Date().toISOString()
      };

      engine.processAction(action);
      const gameState = engine.getGameState();
      expect(gameState.unoCallouts['player1']).toBe(true);
    });

    test('should handle successful Uno challenge', () => {
      const gameState = engine.getGameState();
      const initialHandSize = gameState.playerHands['player2'].length;
      
      // Simulate player2 having 1 card but not calling Uno
      gameState.playerHands['player2'] = [gameState.playerHands['player2'][0]];
      
      const action = {
        type: 'challenge_uno' as const,
        playerId: 'player1',
        targetPlayer: 'player2',
        timestamp: new Date().toISOString()
      };

      engine.processAction(action);
      const newGameState = engine.getGameState();
      expect(newGameState.playerHands['player2'].length).toBe(3); // 1 + 2 penalty cards
    });
  });

  describe('Win Condition', () => {
    test('should detect win when player has no cards', async () => {
      const gameState = engine.getGameState();
      
      // Simulate player having only one card
      const lastCard = gameState.playerHands['player1'][0];
      gameState.playerHands['player1'] = [lastCard];
      
      // Make sure it's a valid play
      if (engine.isValidPlay(lastCard, 'player1').valid) {
        const input: PhysicalCardInput = {
          method: 'qr_scan',
          cardId: lastCard.id,
          playerId: 'player1',
          timestamp: new Date().toISOString()
        };

        await engine.processPhysicalCardInput(input);
        const newGameState = engine.getGameState();
        expect(newGameState.status).toBe('finished');
        expect(newGameState.winner).toBe('player1');
      }
    });
  });

  describe('Game State Serialization', () => {
    test('should export and import game state', () => {
      const originalState = engine.getGameState();
      const serialized = engine.exportGameState();
      const importedEngine = UnoGameEngine.importGameState(serialized);
      const importedState = importedEngine.getGameState();
      
      expect(importedState.gameId).toBe(originalState.gameId);
      expect(importedState.players).toEqual(originalState.players);
      expect(importedState.deck.length).toBe(originalState.deck.length);
    });
  });

  describe('Valid Moves', () => {
    test('should return list of valid moves for player', () => {
      const validMoves = engine.getValidMoves('player1');
      expect(Array.isArray(validMoves)).toBe(true);
      
      // All returned cards should be valid plays
      validMoves.forEach(card => {
        const result = engine.isValidPlay(card, 'player1');
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('Deck Management', () => {
    test('should reshuffle discard pile when deck runs out', () => {
      const gameState = engine.getGameState();
      
      // Empty the deck
      gameState.deck = [];
      
      // Add cards to discard pile
      gameState.discardPile = [
        { id: 'card1', color: 'red', type: 'number', value: 1 },
        { id: 'card2', color: 'blue', type: 'number', value: 2 },
        { id: 'card3', color: 'green', type: 'number', value: 3 }
      ];
      
      // Try to draw cards - should trigger reshuffle
      const action = {
        type: 'draw_card' as const,
        playerId: 'player1',
        timestamp: new Date().toISOString()
      };
      
      const result = engine.processAction(action);
      const newGameState = engine.getGameState();
      
      // Deck should have cards now (reshuffled from discard pile)
      expect(newGameState.deck.length).toBeGreaterThan(0);
      // Current card should remain in discard pile
      expect(newGameState.discardPile.length).toBe(1);
    });
  });
}); 