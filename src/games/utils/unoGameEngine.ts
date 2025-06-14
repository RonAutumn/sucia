import { 
  UnoGameState, 
  UnoCard, 
  UnoAction, 
  UnoColor, 
  UnoCardType, 
  UnoActionType,
  GamePlayer 
} from '../../types/game-types';

// Physical game integration types
export interface PhysicalCardInput {
  method: 'qr_scan' | 'manual_entry' | 'card_scan';
  cardId: string;
  playerId: string;
  timestamp: string;
  confidence?: number; // for scanning methods
}

export interface PhysicalGameSync {
  lastSyncTimestamp: string;
  pendingActions: UnoAction[];
  syncStatus: 'synced' | 'pending' | 'conflict' | 'error';
  deviceId: string;
}

// Core Uno Game Engine for Physical Games
export class UnoGameEngine {
  private gameState: UnoGameState;
  private physicalSync: PhysicalGameSync;

  constructor(gameId: string, players: GamePlayer[]) {
    this.gameState = this.initializeGame(gameId, players);
    this.physicalSync = {
      lastSyncTimestamp: new Date().toISOString(),
      pendingActions: [],
      syncStatus: 'synced',
      deviceId: this.generateDeviceId()
    };
  }

  // Initialize game state for physical Uno
  private initializeGame(gameId: string, players: GamePlayer[]): UnoGameState {
    const deck = this.createDeck();
    const shuffledDeck = this.shuffleDeck(deck);
    
    // Deal 7 cards per player for physical game tracking
    const playerHands: Record<string, UnoCard[]> = {};
    let currentIndex = 0;
    
    players.forEach(player => {
      playerHands[player.id] = shuffledDeck.slice(currentIndex, currentIndex + 7);
      currentIndex += 7;
    });

    const remainingDeck = shuffledDeck.slice(currentIndex);
    const startCard = this.getValidStartCard(remainingDeck);
    const discardPile = [startCard];
    const finalDeck = remainingDeck.filter(card => card.id !== startCard.id);

    return {
      gameId,
      gameType: 'uno',
      status: 'waiting',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      players,
      maxPlayers: 10,
      currentTurn: players[0]?.id,
      settings: {
        gameType: 'uno',
        customRules: {
          physicalMode: true,
          stacking: true,
          sevenZero: false,
          jumpIn: false
        }
      },
      deck: finalDeck,
      discardPile,
      currentCard: startCard,
      direction: 'clockwise',
      drawStack: 0,
      playerHands,
      unoCallouts: {}
    };
  }

  // Create standard Uno deck with unique IDs for physical tracking
  private createDeck(): UnoCard[] {
    const deck: UnoCard[] = [];
    const colors: UnoColor[] = ['red', 'blue', 'green', 'yellow'];
    
    // Number cards (0-9)
    colors.forEach(color => {
      // One 0 per color
      deck.push({
        id: `${color}-0-${this.generateCardId()}`,
        color,
        type: 'number',
        value: 0
      });
      
      // Two of each number 1-9 per color
      for (let num = 1; num <= 9; num++) {
        for (let copy = 0; copy < 2; copy++) {
          deck.push({
            id: `${color}-${num}-${this.generateCardId()}`,
            color,
            type: 'number',
            value: num
          });
        }
      }
    });

    // Action cards (2 per color per type)
    const actionTypes: UnoCardType[] = ['skip', 'reverse', 'draw_two'];
    colors.forEach(color => {
      actionTypes.forEach(type => {
        for (let copy = 0; copy < 2; copy++) {
          deck.push({
            id: `${color}-${type}-${this.generateCardId()}`,
            color,
            type
          });
        }
      });
    });

    // Wild cards (4 of each type)
    for (let copy = 0; copy < 4; copy++) {
      deck.push({
        id: `wild-${this.generateCardId()}`,
        color: 'wild',
        type: 'wild',
        isWild: true
      });
      
      deck.push({
        id: `wild-draw-four-${this.generateCardId()}`,
        color: 'wild',
        type: 'wild_draw_four',
        isWild: true
      });
    }

    return deck;
  }

  // Fisher-Yates shuffle algorithm for fair randomization
  private shuffleDeck(deck: UnoCard[]): UnoCard[] {
    const shuffled = [...deck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get valid start card (no action cards or wilds)
  private getValidStartCard(deck: UnoCard[]): UnoCard {
    const validStart = deck.find(card => 
      card.type === 'number' && !card.isWild
    );
    
    if (!validStart) {
      throw new Error('No valid start card found in deck');
    }
    
    return validStart;
  }

  // Process physical card input
  public async processPhysicalCardInput(input: PhysicalCardInput): Promise<{ 
    success: boolean; 
    message: string; 
    action?: UnoAction 
  }> {
    try {
      const card = this.findCardById(input.cardId);
      if (!card) {
        return { success: false, message: 'Card not found in game' };
      }

      const player = this.gameState.players.find(p => p.id === input.playerId);
      if (!player) {
        return { success: false, message: 'Player not found' };
      }

      // Validate if it's the player's turn
      if (this.gameState.currentTurn !== input.playerId) {
        return { success: false, message: 'Not your turn' };
      }

      // Validate if the card can be played
      const canPlay = this.isValidPlay(card, input.playerId);
      if (!canPlay.valid) {
        return { success: false, message: canPlay.reason || 'Invalid play' };
      }

      // Create action for physical card play
      const action: UnoAction = {
        type: 'play_card',
        playerId: input.playerId,
        timestamp: input.timestamp,
        card
      };

      // Process the action
      const result = this.processAction(action);
      
      // Add to sync queue
      this.physicalSync.pendingActions.push(action);
      this.physicalSync.syncStatus = 'pending';

      return { 
        success: true, 
        message: 'Card played successfully', 
        action 
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Error processing card: ${error}` 
      };
    }
  }

  // Validate if a card can be played
  public isValidPlay(card: UnoCard, playerId: string): { valid: boolean; reason?: string } {
    const currentCard = this.gameState.currentCard;
    const playerHand = this.gameState.playerHands[playerId];

    // Check if player has the card
    if (!playerHand?.some(c => c.id === card.id)) {
      return { valid: false, reason: 'Card not in player hand' };
    }

    // Wild cards can always be played
    if (card.isWild) {
      return { valid: true };
    }

    // Check color match
    if (card.color === currentCard.color || 
        (currentCard.chosenColor && card.color === currentCard.chosenColor)) {
      return { valid: true };
    }

    // Check type/value match
    if (card.type === currentCard.type || 
        (card.type === 'number' && currentCard.type === 'number' && card.value === currentCard.value)) {
      return { valid: true };
    }

    return { valid: false, reason: 'Card does not match color, number, or type' };
  }

  // Process game action
  public processAction(action: UnoAction): UnoGameState {
    switch (action.type) {
      case 'play_card':
        return this.handlePlayCard(action);
      case 'draw_card':
        return this.handleDrawCard(action);
      case 'choose_color':
        return this.handleChooseColor(action);
      case 'call_uno':
        return this.handleCallUno(action);
      case 'challenge_uno':
        return this.handleChallengeUno(action);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  // Handle card play action
  private handlePlayCard(action: UnoAction): UnoGameState {
    if (!action.card) throw new Error('No card specified in play action');

    const card = action.card;
    const playerId = action.playerId;

    // Set game to active if it's not already
    if (this.gameState.status === 'waiting') {
      this.gameState.status = 'active';
    }

    // Remove card from player's hand
    const playerHand = this.gameState.playerHands[playerId];
    this.gameState.playerHands[playerId] = playerHand.filter(c => c.id !== card.id);

    // Add card to discard pile
    this.gameState.discardPile.push(card);
    this.gameState.currentCard = card;

    // Check for win condition first
    if (this.gameState.playerHands[playerId].length === 0) {
      this.gameState.status = 'finished';
      this.gameState.winner = playerId;
      this.gameState.lastAction = action;
      this.gameState.updatedAt = new Date().toISOString();
      return this.gameState;
    }

    // Check for Uno callout requirement
    if (this.gameState.playerHands[playerId].length === 1 && 
        !this.gameState.unoCallouts[playerId]) {
      // Player should call Uno
    }

    // Handle special card effects
    this.processSpecialCardEffects(card, playerId);

    // Advance turn if no special effects interrupted and game is still active
    if (this.gameState.status === 'active') {
      this.advanceTurn();
    }

    this.gameState.lastAction = action;
    this.gameState.updatedAt = new Date().toISOString();

    return this.gameState;
  }

  // Process special card effects
  private processSpecialCardEffects(card: UnoCard, playerId: string): void {
    switch (card.type) {
      case 'skip':
        this.advanceTurn(); // Skip next player
        break;
      case 'reverse':
        this.gameState.direction = this.gameState.direction === 'clockwise' 
          ? 'counterclockwise' 
          : 'clockwise';
        break;
      case 'draw_two':
        this.gameState.drawStack += 2;
        this.advanceTurn();
        this.forceDrawCards(this.gameState.currentTurn!, this.gameState.drawStack);
        this.gameState.drawStack = 0;
        break;
      case 'wild_draw_four':
        this.gameState.drawStack += 4;
        this.advanceTurn();
        this.forceDrawCards(this.gameState.currentTurn!, this.gameState.drawStack);
        this.gameState.drawStack = 0;
        break;
    }
  }

  // Advance to next player's turn
  private advanceTurn(): void {
    const currentIndex = this.gameState.players.findIndex(
      p => p.id === this.gameState.currentTurn
    );
    
    let nextIndex;
    if (this.gameState.direction === 'clockwise') {
      nextIndex = (currentIndex + 1) % this.gameState.players.length;
    } else {
      nextIndex = currentIndex === 0 
        ? this.gameState.players.length - 1 
        : currentIndex - 1;
    }
    
    this.gameState.currentTurn = this.gameState.players[nextIndex].id;
  }

  // Force player to draw cards
  private forceDrawCards(playerId: string, count: number): void {
    const cardsToAdd = this.drawCards(count);
    this.gameState.playerHands[playerId].push(...cardsToAdd);
  }

  // Draw cards from deck
  private drawCards(count: number): UnoCard[] {
    if (this.gameState.deck.length < count) {
      this.reshuffleDiscardPile();
    }
    
    const drawnCards = this.gameState.deck.splice(0, count);
    return drawnCards;
  }

  // Reshuffle discard pile into deck when needed
  private reshuffleDiscardPile(): void {
    if (this.gameState.discardPile.length <= 1) {
      throw new Error('Cannot reshuffle - not enough cards');
    }
    
    const currentCard = this.gameState.discardPile.pop()!;
    const cardsToShuffle = [...this.gameState.discardPile];
    
    // Reset chosen colors on wild cards
    cardsToShuffle.forEach(card => {
      if (card.isWild) {
        delete card.chosenColor;
      }
    });
    
    this.gameState.deck = this.shuffleDeck(cardsToShuffle);
    this.gameState.discardPile = [currentCard];
  }

  // Handle draw card action
  private handleDrawCard(action: UnoAction): UnoGameState {
    const playerId = action.playerId;
    const drawnCards = this.drawCards(1);
    this.gameState.playerHands[playerId].push(...drawnCards);
    
    this.gameState.lastAction = action;
    this.gameState.updatedAt = new Date().toISOString();
    
    return this.gameState;
  }

  // Handle color choice for wild cards
  private handleChooseColor(action: UnoAction): UnoGameState {
    if (!action.chosenColor) {
      throw new Error('No color specified for wild card');
    }
    
    this.gameState.currentCard.chosenColor = action.chosenColor;
    this.gameState.lastAction = action;
    this.gameState.updatedAt = new Date().toISOString();
    
    return this.gameState;
  }

  // Handle Uno callout
  private handleCallUno(action: UnoAction): UnoGameState {
    this.gameState.unoCallouts[action.playerId] = true;
    this.gameState.lastAction = action;
    this.gameState.updatedAt = new Date().toISOString();
    
    return this.gameState;
  }

  // Handle Uno challenge
  private handleChallengeUno(action: UnoAction): UnoGameState {
    const targetPlayer = action.targetPlayer;
    if (!targetPlayer) {
      throw new Error('No target player specified for Uno challenge');
    }
    
    const targetHand = this.gameState.playerHands[targetPlayer];
    const shouldHaveCalledUno = targetHand.length === 1;
    const didCallUno = this.gameState.unoCallouts[targetPlayer];
    
    if (shouldHaveCalledUno && !didCallUno) {
      // Challenge successful - target draws 2 cards
      this.forceDrawCards(targetPlayer, 2);
    }
    
    this.gameState.lastAction = action;
    this.gameState.updatedAt = new Date().toISOString();
    
    return this.gameState;
  }

  // Utility methods
  private findCardById(cardId: string): UnoCard | undefined {
    // Search in all hands and discard pile
    for (const hand of Object.values(this.gameState.playerHands)) {
      const card = hand.find(c => c.id === cardId);
      if (card) return card;
    }
    
    const discardCard = this.gameState.discardPile.find(c => c.id === cardId);
    if (discardCard) return discardCard;
    
    const deckCard = this.gameState.deck.find(c => c.id === cardId);
    return deckCard;
  }

  private generateCardId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private generateDeviceId(): string {
    return `device-${Math.random().toString(36).substr(2, 12)}`;
  }

  // Public getters for game state
  public getGameState(): UnoGameState {
    return { ...this.gameState };
  }

  public getCurrentPlayer(): GamePlayer | undefined {
    return this.gameState.players.find(p => p.id === this.gameState.currentTurn);
  }

  public getPlayerHand(playerId: string): UnoCard[] {
    return [...(this.gameState.playerHands[playerId] || [])];
  }

  public getCurrentCard(): UnoCard {
    return { ...this.gameState.currentCard };
  }

  public getValidMoves(playerId: string): UnoCard[] {
    const hand = this.gameState.playerHands[playerId] || [];
    return hand.filter(card => this.isValidPlay(card, playerId).valid);
  }

  // Physical sync methods
  public getSyncStatus(): PhysicalGameSync {
    return { ...this.physicalSync };
  }

  public markSyncComplete(): void {
    this.physicalSync.pendingActions = [];
    this.physicalSync.syncStatus = 'synced';
    this.physicalSync.lastSyncTimestamp = new Date().toISOString();
  }

  public exportGameState(): string {
    return JSON.stringify({
      gameState: this.gameState,
      syncData: this.physicalSync
    });
  }

  public static importGameState(serializedState: string): UnoGameEngine {
    const { gameState, syncData } = JSON.parse(serializedState);
    const engine = Object.create(UnoGameEngine.prototype);
    engine.gameState = gameState;
    engine.physicalSync = syncData;
    return engine;
  }
} 