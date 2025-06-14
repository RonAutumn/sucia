import { Game, Trivia, Poll, Icebreaker, Bingo, GameVote } from '../../types';

interface ScoreResult {
  guestId: string;
  score: number;
  rank: number;
  gameType: string;
  details: Record<string, any>;
}

interface LeaderboardEntry extends ScoreResult {
  guestName?: string;
  percentage?: number;
}

/**
 * Comprehensive game score calculator for all game types
 * Handles scoring logic specific to each game type
 */
export class GameScoreCalculator {
  /**
   * Calculate scores for trivia games
   */
  calculateTriviaScores(trivia: Trivia, votes: GameVote[]): ScoreResult[] {
    const participantScores = new Map<string, number>();
    const participantDetails = new Map<string, any>();

    // Initialize scores for all participants
    trivia.participants.forEach(guestId => {
      participantScores.set(guestId, 0);
      participantDetails.set(guestId, {
        correctAnswers: 0,
        totalAnswers: 0,
        averageResponseTime: 0,
        accuracy: 0
      });
    });

    // Process votes for scoring
    votes.forEach(vote => {
      if (!vote.optionId || !trivia.questions) return;

      const questionIndex = trivia.questions.findIndex(q => 
        vote.optionId?.includes(q.id)
      );
      
      if (questionIndex === -1) return;

      const question = trivia.questions[questionIndex];
      const selectedOption = parseInt(vote.optionId.split('_').pop() || '0');
      const isCorrect = selectedOption === question.correctAnswer;

      const currentScore = participantScores.get(vote.guestId) || 0;
      const currentDetails = participantDetails.get(vote.guestId) || {};

      if (isCorrect) {
        // Base points for correct answer
        let points = 100;
        
        // Bonus points for speed (assuming timestamp indicates response speed)
        // This is a simplified implementation
        const responseTimeBonus = Math.max(0, 50 - (Date.now() - vote.timestamp.getTime()) / 1000);
        points += Math.floor(responseTimeBonus);

        participantScores.set(vote.guestId, currentScore + points);
        currentDetails.correctAnswers = (currentDetails.correctAnswers || 0) + 1;
      }

      currentDetails.totalAnswers = (currentDetails.totalAnswers || 0) + 1;
      currentDetails.accuracy = currentDetails.correctAnswers / currentDetails.totalAnswers;
      participantDetails.set(vote.guestId, currentDetails);
    });

    // Convert to results array and rank
    const results: ScoreResult[] = Array.from(participantScores.entries()).map(([guestId, score]) => ({
      guestId,
      score,
      rank: 0, // Will be calculated below
      gameType: 'trivia',
      details: participantDetails.get(guestId) || {}
    }));

    return this.rankResults(results);
  }

  /**
   * Calculate scores for poll games (engagement-based)
   */
  calculatePollScores(poll: Poll, votes: GameVote[]): ScoreResult[] {
    const participantScores = new Map<string, number>();
    const participantDetails = new Map<string, any>();

    // Initialize scores
    poll.participants.forEach(guestId => {
      participantScores.set(guestId, 0);
      participantDetails.set(guestId, {
        hasVoted: false,
        responseTime: 0,
        engagement: 'low'
      });
    });

    // Score based on participation
    votes.forEach(vote => {
      const currentDetails = participantDetails.get(vote.guestId) || {};
      
      // Base participation points
      let points = 50;
      
      // Bonus for early participation
      const gameStartTime = poll.createdAt.getTime();
      const responseTime = vote.timestamp.getTime() - gameStartTime;
      const earlyResponseBonus = Math.max(0, 25 - (responseTime / 1000 / 60)); // Bonus for responding within first minute
      
      points += Math.floor(earlyResponseBonus);
      
      participantScores.set(vote.guestId, points);
      participantDetails.set(vote.guestId, {
        ...currentDetails,
        hasVoted: true,
        responseTime,
        engagement: points > 60 ? 'high' : points > 40 ? 'medium' : 'low'
      });
    });

    const results: ScoreResult[] = Array.from(participantScores.entries()).map(([guestId, score]) => ({
      guestId,
      score,
      rank: 0,
      gameType: 'poll',
      details: participantDetails.get(guestId) || {}
    }));

    return this.rankResults(results);
  }

  /**
   * Calculate scores for icebreaker games (creativity and participation-based)
   */
  calculateIcebreakerScores(icebreaker: Icebreaker, votes: GameVote[]): ScoreResult[] {
    const participantScores = new Map<string, number>();
    const participantDetails = new Map<string, any>();

    // Initialize scores
    icebreaker.participants.forEach(guestId => {
      participantScores.set(guestId, 0);
      participantDetails.set(guestId, {
        responsesSubmitted: 0,
        averageResponseLength: 0,
        creativity: 'medium'
      });
    });

    // Score based on participation and response quality
    votes.forEach(vote => {
      if (!vote.response) return;

      const currentScore = participantScores.get(vote.guestId) || 0;
      const currentDetails = participantDetails.get(vote.guestId) || {};

      // Base participation points
      let points = 30;

      // Points for response length (indicates thoughtfulness)
      const responseLength = vote.response.length;
      const lengthBonus = Math.min(20, Math.floor(responseLength / 10)); // Up to 20 bonus points
      points += lengthBonus;

      // Creativity bonus (simple heuristic based on unique words)
      const uniqueWords = new Set(vote.response.toLowerCase().split(/\s+/)).size;
      const creativityBonus = Math.min(15, uniqueWords * 2);
      points += creativityBonus;

      participantScores.set(vote.guestId, currentScore + points);
      
      const responses = (currentDetails.responsesSubmitted || 0) + 1;
      participantDetails.set(vote.guestId, {
        ...currentDetails,
        responsesSubmitted: responses,
        averageResponseLength: ((currentDetails.averageResponseLength || 0) + responseLength) / responses,
        creativity: points > 50 ? 'high' : points > 35 ? 'medium' : 'low'
      });
    });

    const results: ScoreResult[] = Array.from(participantScores.entries()).map(([guestId, score]) => ({
      guestId,
      score,
      rank: 0,
      gameType: 'icebreaker',
      details: participantDetails.get(guestId) || {}
    }));

    return this.rankResults(results);
  }

  /**
   * Calculate scores for bingo games
   */
  calculateBingoScores(bingo: Bingo, votes: GameVote[]): ScoreResult[] {
    const participantScores = new Map<string, number>();
    const participantDetails = new Map<string, any>();

    // Initialize scores
    bingo.participants.forEach(guestId => {
      participantScores.set(guestId, 0);
      participantDetails.set(guestId, {
        cellsMarked: 0,
        hasWon: false,
        winOrder: 0
      });
    });

    // Score based on completion and win order
    bingo.winners.forEach((winnerId, index) => {
      const points = Math.max(100, 200 - (index * 25)); // First place gets more points
      participantScores.set(winnerId, points);
      
      const currentDetails = participantDetails.get(winnerId) || {};
      participantDetails.set(winnerId, {
        ...currentDetails,
        hasWon: true,
        winOrder: index + 1
      });
    });

    // Participation points for non-winners
    votes.forEach(vote => {
      if (!bingo.winners.includes(vote.guestId)) {
        const currentScore = participantScores.get(vote.guestId) || 0;
        const participationPoints = 10; // Small points for participation
        participantScores.set(vote.guestId, currentScore + participationPoints);
      }
    });

    const results: ScoreResult[] = Array.from(participantScores.entries()).map(([guestId, score]) => ({
      guestId,
      score,
      rank: 0,
      gameType: 'bingo',
      details: participantDetails.get(guestId) || {}
    }));

    return this.rankResults(results);
  }

  /**
   * Rank results by score (higher scores get better ranks)
   */
  private rankResults(results: ScoreResult[]): ScoreResult[] {
    results.sort((a, b) => b.score - a.score);
    
    let currentRank = 1;
    for (let i = 0; i < results.length; i++) {
      if (i > 0 && results[i].score < results[i - 1].score) {
        currentRank = i + 1;
      }
      results[i].rank = currentRank;
    }

    return results;
  }

  /**
   * Calculate aggregate scores across multiple games
   */
  calculateAggregateScores(gameResults: ScoreResult[][]): LeaderboardEntry[] {
    const aggregateScores = new Map<string, { totalScore: number, gamesPlayed: number, details: any[] }>();

    gameResults.forEach(results => {
      results.forEach(result => {
        const current = aggregateScores.get(result.guestId) || { totalScore: 0, gamesPlayed: 0, details: [] };
        aggregateScores.set(result.guestId, {
          totalScore: current.totalScore + result.score,
          gamesPlayed: current.gamesPlayed + 1,
          details: [...current.details, { gameType: result.gameType, score: result.score, rank: result.rank }]
        });
      });
    });

    const leaderboard: LeaderboardEntry[] = Array.from(aggregateScores.entries()).map(([guestId, data]) => ({
      guestId,
      score: data.totalScore,
      rank: 0,
      gameType: 'aggregate',
      details: {
        gamesPlayed: data.gamesPlayed,
        averageScore: Math.round(data.totalScore / data.gamesPlayed),
        gameBreakdown: data.details
      }
    }));

    return this.rankResults(leaderboard) as LeaderboardEntry[];
  }
}

// Export a singleton instance
export const gameScoreCalculator = new GameScoreCalculator(); 