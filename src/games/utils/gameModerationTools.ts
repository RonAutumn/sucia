import { GameVote, Guest } from '../../types';

interface ContentAnalysisResult {
  flagged: boolean;
  confidence: number;
  reasons: string[];
  category: 'safe' | 'warning' | 'inappropriate' | 'harmful';
}

interface ModerationRule {
  id: string;
  name: string;
  pattern: RegExp;
  action: 'flag' | 'block' | 'warn';
  severity: 'low' | 'medium' | 'high';
  enabled: boolean;
}

interface ParticipantBehaviorAnalysis {
  guestId: string;
  participationRate: number;
  responseQuality: number;
  flaggedContent: number;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

/**
 * Advanced moderation tools for games platform
 * Provides content analysis, automated moderation, and behavior tracking
 */
export class GameModerationTools {
  private defaultRules: ModerationRule[] = [
    {
      id: 'hate_speech',
      name: 'Hate Speech Detection',
      pattern: /\b(hate|racist|sexist|homophobic|transphobic)\b/i,
      action: 'block',
      severity: 'high',
      enabled: true
    },
    {
      id: 'harassment',
      name: 'Harassment Detection',
      pattern: /\b(harassment|bully|threat|abuse)\b/i,
      action: 'flag',
      severity: 'high',
      enabled: true
    },
    {
      id: 'inappropriate_language',
      name: 'Inappropriate Language',
      pattern: /\b(inappropriate|offensive|vulgar)\b/i,
      action: 'warn',
      severity: 'medium',
      enabled: true
    },
    {
      id: 'spam_detection',
      name: 'Spam Detection',
      pattern: /(.)\1{4,}|([A-Z]){10,}/g, // Repeated characters or excessive caps
      action: 'flag',
      severity: 'low',
      enabled: true
    },
    {
      id: 'personal_info',
      name: 'Personal Information',
      pattern: /\b(\d{3}-\d{3}-\d{4}|\d{10}|\w+@\w+\.\w+)\b/g, // Phone, email patterns
      action: 'flag',
      severity: 'medium',
      enabled: true
    }
  ];

  private customRules: ModerationRule[] = [];

  /**
   * Analyze content for moderation issues
   */
  analyzeContent(content: string): ContentAnalysisResult {
    if (!content || content.trim().length === 0) {
      return {
        flagged: false,
        confidence: 1.0,
        reasons: [],
        category: 'safe'
      };
    }

    const allRules = [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);
    const flaggedRules: ModerationRule[] = [];
    let highestSeverity: 'low' | 'medium' | 'high' | null = null;

    // Test content against all rules
    allRules.forEach(rule => {
      if (rule.pattern.test(content)) {
        flaggedRules.push(rule);
        if (highestSeverity === null || this.getSeverityLevel(rule.severity) > this.getSeverityLevel(highestSeverity)) {
          highestSeverity = rule.severity;
        }
      }
    });

    // Calculate confidence based on number of matches and severity
    const confidence = Math.min(1.0, (flaggedRules.length * 0.3) + (this.getSeverityLevel(highestSeverity || 'low') * 0.3));

    // Determine category
    let category: 'safe' | 'warning' | 'inappropriate' | 'harmful' = 'safe';
    if (flaggedRules.length > 0 && highestSeverity !== null) {
      if (highestSeverity === 'high') {
        category = 'harmful';
      } else if (highestSeverity === 'medium') {
        category = 'inappropriate';
      } else if (highestSeverity === 'low') {
        category = 'warning';
      }
    }

    return {
      flagged: flaggedRules.length > 0,
      confidence,
      reasons: flaggedRules.map(rule => rule.name),
      category
    };
  }

  /**
   * Batch analyze multiple pieces of content
   */
  batchAnalyzeContent(contents: string[]): ContentAnalysisResult[] {
    return contents.map(content => this.analyzeContent(content));
  }

  /**
   * Analyze participant behavior patterns
   */
  analyzeParticipantBehavior(
    guestId: string, 
    votes: GameVote[], 
    totalGames: number,
    flaggedContentCount: number = 0
  ): ParticipantBehaviorAnalysis {
    const participantVotes = votes.filter(vote => vote.guestId === guestId);
    
    // Calculate participation rate
    const participationRate = totalGames > 0 ? participantVotes.length / totalGames : 0;
    
    // Calculate response quality (simple heuristic based on response length and content)
    let totalQuality = 0;
    let qualityCount = 0;
    
    participantVotes.forEach(vote => {
      if (vote.response) {
        const contentAnalysis = this.analyzeContent(vote.response);
        const responseLength = vote.response.length;
        
        // Quality based on length (10-200 chars optimal) and content safety
        let quality = 0.5; // Base quality
        
        if (responseLength >= 10 && responseLength <= 200) {
          quality += 0.3;
        }
        
        if (!contentAnalysis.flagged) {
          quality += 0.2;
        } else {
          quality -= contentAnalysis.confidence * 0.4;
        }
        
        totalQuality += Math.max(0, Math.min(1, quality));
        qualityCount++;
      }
    });
    
    const responseQuality = qualityCount > 0 ? totalQuality / qualityCount : 0.5;
    
    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    const recommendations: string[] = [];
    
    if (flaggedContentCount > 2 || responseQuality < 0.3) {
      riskLevel = 'high';
      recommendations.push('Monitor closely for inappropriate content');
    } else if (flaggedContentCount > 0 || responseQuality < 0.5 || participationRate < 0.3) {
      riskLevel = 'medium';
      recommendations.push('Encourage positive participation');
    }
    
    if (participationRate < 0.5) {
      recommendations.push('Consider engagement strategies');
    }
    
    if (responseQuality < 0.4) {
      recommendations.push('Provide participation guidelines');
    }
    
    return {
      guestId,
      participationRate,
      responseQuality,
      flaggedContent: flaggedContentCount,
      riskLevel,
      recommendations
    };
  }

  /**
   * Auto-moderate content based on rules
   */
  autoModerate(content: string): { 
    allowed: boolean; 
    action: 'allow' | 'flag' | 'block' | 'warn';
    reason?: string;
  } {
    const analysis = this.analyzeContent(content);
    
    if (!analysis.flagged) {
      return { allowed: true, action: 'allow' };
    }
    
    // Find the most severe rule that was triggered
    const allRules = [...this.defaultRules, ...this.customRules].filter(rule => rule.enabled);
    let mostSevereAction: 'flag' | 'block' | 'warn' | null = null;
    let triggeringRule: string = '';
    
    allRules.forEach(rule => {
      if (rule.pattern.test(content)) {
        if (mostSevereAction === null || this.getActionSeverity(rule.action) > this.getActionSeverity(mostSevereAction)) {
          mostSevereAction = rule.action;
          triggeringRule = rule.name;
        }
      }
    });
    
    return {
      allowed: mostSevereAction !== 'block',
      action: mostSevereAction || 'flag',
      reason: `Content flagged by ${triggeringRule}`
    };
  }

  /**
   * Generate moderation summary for a game session
   */
  generateModerationSummary(
    votes: GameVote[], 
    participants: Guest[],
    flaggedContent: GameVote[]
  ): {
    totalParticipants: number;
    totalResponses: number;
    flaggedResponses: number;
    riskDistribution: { low: number; medium: number; high: number };
    topConcerns: string[];
  } {
    const participantAnalyses = participants.map(guest => 
      this.analyzeParticipantBehavior(
        guest.id, 
        votes, 
        1, // Assuming single game session
        flaggedContent.filter(vote => vote.guestId === guest.id).length
      )
    );
    
    const riskDistribution = {
      low: participantAnalyses.filter(a => a.riskLevel === 'low').length,
      medium: participantAnalyses.filter(a => a.riskLevel === 'medium').length,
      high: participantAnalyses.filter(a => a.riskLevel === 'high').length
    };
    
    // Analyze flagged content for top concerns
    const concernCounts = new Map<string, number>();
    flaggedContent.forEach(vote => {
      if (vote.response) {
        const analysis = this.analyzeContent(vote.response);
        analysis.reasons.forEach(reason => {
          concernCounts.set(reason, (concernCounts.get(reason) || 0) + 1);
        });
      }
    });
    
    const topConcerns = Array.from(concernCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([concern, count]) => `${concern} (${count})`);
    
    return {
      totalParticipants: participants.length,
      totalResponses: votes.length,
      flaggedResponses: flaggedContent.length,
      riskDistribution,
      topConcerns
    };
  }

  /**
   * Add custom moderation rule
   */
  addCustomRule(rule: Omit<ModerationRule, 'id'>): ModerationRule {
    const newRule: ModerationRule = {
      ...rule,
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.customRules.push(newRule);
    return newRule;
  }

  /**
   * Remove custom rule
   */
  removeCustomRule(ruleId: string): boolean {
    const index = this.customRules.findIndex(rule => rule.id === ruleId);
    if (index > -1) {
      this.customRules.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all active rules
   */
  getAllRules(): ModerationRule[] {
    return [...this.defaultRules, ...this.customRules];
  }

  /**
   * Toggle rule enabled status
   */
  toggleRule(ruleId: string): boolean {
    const rule = this.getAllRules().find(r => r.id === ruleId);
    if (rule) {
      rule.enabled = !rule.enabled;
      return true;
    }
    return false;
  }

  private getSeverityLevel(severity: 'low' | 'medium' | 'high'): number {
    switch (severity) {
      case 'low': return 1;
      case 'medium': return 2;
      case 'high': return 3;
      default: return 0;
    }
  }

  private getActionSeverity(action: 'flag' | 'block' | 'warn'): number {
    switch (action) {
      case 'warn': return 1;
      case 'flag': return 2;
      case 'block': return 3;
      default: return 0;
    }
  }
}

// Export singleton instance
export const gameModerationTools = new GameModerationTools(); 