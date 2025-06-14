import { createGameStateManager } from '../../utils/gameStateManager';

interface AuditEvent {
  id: string;
  timestamp: Date;
  eventType: 'game_created' | 'game_launched' | 'game_stopped' | 'participant_joined' | 
            'participant_removed' | 'vote_submitted' | 'content_flagged' | 'moderation_action' |
            'settings_changed' | 'export_performed' | 'consent_updated';
  eventId: string;
  gameId?: string;
  staffId: string;
  guestId?: string;
  details: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: 'user_action' | 'system_event' | 'moderation' | 'compliance' | 'security';
}

interface AuditFilter {
  eventTypes?: string[];
  staffIds?: string[];
  guestIds?: string[];
  startDate?: Date;
  endDate?: Date;
  severity?: 'info' | 'warning' | 'error' | 'critical';
  category?: 'user_action' | 'system_event' | 'moderation' | 'compliance' | 'security';
  gameId?: string;
}

interface AuditSummary {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByCategory: Record<string, number>;
  uniqueUsers: number;
  uniqueGames: number;
  timeRange: { start: Date; end: Date };
  topActivities: { activity: string; count: number }[];
}

/**
 * Comprehensive audit logging system for games platform
 * Provides compliance tracking, security monitoring, and user activity logging
 */
export class GameAuditLogger {
  private eventId: string;
  private maxLogSize: number = 10000; // Maximum number of log entries to retain

  constructor(eventId: string) {
    this.eventId = eventId;
  }

  /**
   * Log an audit event
   */
  logEvent(event: Omit<AuditEvent, 'id' | 'timestamp' | 'eventId'>): AuditEvent {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: new Date(),
      eventId: this.eventId
    };

    try {
      const existingLogs = this.getAuditLogs();
      const updatedLogs = [...existingLogs, auditEvent];

      // Maintain log size limit (FIFO)
      if (updatedLogs.length > this.maxLogSize) {
        updatedLogs.splice(0, updatedLogs.length - this.maxLogSize);
      }

      this.persistAuditLogs(updatedLogs);

      // Also log to console for development (can be disabled in production)
      this.logToConsole(auditEvent);

      return auditEvent;
    } catch (error) {
      console.error('Failed to log audit event:', error);
      throw error;
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  getAuditLogs(filter?: AuditFilter): AuditEvent[] {
    try {
      const allLogs = this.loadAuditLogs();
      
      if (!filter) {
        return allLogs;
      }

      return allLogs.filter(log => {
        if (filter.eventTypes && !filter.eventTypes.includes(log.eventType)) return false;
        if (filter.staffIds && !filter.staffIds.includes(log.staffId)) return false;
        if (filter.guestIds && log.guestId && !filter.guestIds.includes(log.guestId)) return false;
        if (filter.startDate && log.timestamp < filter.startDate) return false;
        if (filter.endDate && log.timestamp > filter.endDate) return false;
        if (filter.severity && log.severity !== filter.severity) return false;
        if (filter.category && log.category !== filter.category) return false;
        if (filter.gameId && log.gameId !== filter.gameId) return false;
        
        return true;
      });
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Generate audit summary with analytics
   */
  generateAuditSummary(filter?: AuditFilter): AuditSummary {
    const logs = this.getAuditLogs(filter);
    
    if (logs.length === 0) {
      return {
        totalEvents: 0,
        eventsByType: {},
        eventsBySeverity: {},
        eventsByCategory: {},
        uniqueUsers: 0,
        uniqueGames: 0,
        timeRange: { start: new Date(), end: new Date() },
        topActivities: []
      };
    }

    // Count events by type
    const eventsByType: Record<string, number> = {};
    logs.forEach(log => {
      eventsByType[log.eventType] = (eventsByType[log.eventType] || 0) + 1;
    });

    // Count events by severity
    const eventsBySeverity: Record<string, number> = {};
    logs.forEach(log => {
      eventsBySeverity[log.severity] = (eventsBySeverity[log.severity] || 0) + 1;
    });

    // Count events by category
    const eventsByCategory: Record<string, number> = {};
    logs.forEach(log => {
      eventsByCategory[log.category] = (eventsByCategory[log.category] || 0) + 1;
    });

    // Unique users and games
    const uniqueUsers = new Set([...logs.map(log => log.staffId), ...logs.filter(log => log.guestId).map(log => log.guestId!)]).size;
    const uniqueGames = new Set(logs.filter(log => log.gameId).map(log => log.gameId!)).size;

    // Time range
    const timestamps = logs.map(log => log.timestamp);
    const timeRange = {
      start: new Date(Math.min(...timestamps.map(t => t.getTime()))),
      end: new Date(Math.max(...timestamps.map(t => t.getTime())))
    };

    // Top activities
    const topActivities = Object.entries(eventsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([activity, count]) => ({ activity, count }));

    return {
      totalEvents: logs.length,
      eventsByType,
      eventsBySeverity,
      eventsByCategory,
      uniqueUsers,
      uniqueGames,
      timeRange,
      topActivities
    };
  }

  /**
   * Export audit logs in various formats
   */
  exportAuditLogs(format: 'json' | 'csv' | 'txt' = 'json', filter?: AuditFilter): string {
    const logs = this.getAuditLogs(filter);

    switch (format) {
      case 'csv':
        return this.exportAsCSV(logs);
      case 'txt':
        return this.exportAsText(logs);
      case 'json':
      default:
        return JSON.stringify(logs, null, 2);
    }
  }

  /**
   * Search audit logs by keyword
   */
  searchAuditLogs(keyword: string, searchFields: (keyof AuditEvent)[] = ['eventType', 'details']): AuditEvent[] {
    const logs = this.getAuditLogs();
    const lowerKeyword = keyword.toLowerCase();

    return logs.filter(log => {
      return searchFields.some(field => {
        const value = log[field];
        if (typeof value === 'string') {
          return value.toLowerCase().includes(lowerKeyword);
        } else if (typeof value === 'object') {
          return JSON.stringify(value).toLowerCase().includes(lowerKeyword);
        }
        return false;
      });
    });
  }

  /**
   * Get compliance report for auditing purposes
   */
  generateComplianceReport(): {
    period: string;
    totalActivities: number;
    securityEvents: number;
    moderationEvents: number;
    consentTracking: number;
    dataExports: number;
    criticalEvents: number;
    recommendations: string[];
  } {
    const logs = this.getAuditLogs();
    const securityEvents = logs.filter(log => log.category === 'security').length;
    const moderationEvents = logs.filter(log => log.category === 'moderation').length;
    const consentTracking = logs.filter(log => log.eventType === 'consent_updated').length;
    const dataExports = logs.filter(log => log.eventType === 'export_performed').length;
    const criticalEvents = logs.filter(log => log.severity === 'critical').length;

    const recommendations: string[] = [];
    
    if (securityEvents > 10) {
      recommendations.push('High number of security events detected - review security protocols');
    }
    
    if (moderationEvents > 20) {
      recommendations.push('Frequent moderation required - consider reviewing content policies');
    }
    
    if (criticalEvents > 0) {
      recommendations.push('Critical events logged - immediate review recommended');
    }
    
    if (consentTracking === 0) {
      recommendations.push('No consent tracking events - ensure proper consent management');
    }

    return {
      period: `${this.eventId} - Full Activity Period`,
      totalActivities: logs.length,
      securityEvents,
      moderationEvents,
      consentTracking,
      dataExports,
      criticalEvents,
      recommendations
    };
  }

  /**
   * Clear audit logs (use with caution)
   */
  clearAuditLogs(): boolean {
    try {
      // Log the clearing action first
      this.logEvent({
        eventType: 'export_performed',
        staffId: 'system',
        details: { action: 'audit_logs_cleared', reason: 'Manual clearance' },
        severity: 'warning',
        category: 'system_event'
      });

      localStorage.removeItem(this.getStorageKey());
      return true;
    } catch (error) {
      console.error('Failed to clear audit logs:', error);
      return false;
    }
  }

  // Private methods
  private generateEventId(): string {
    return `audit_${this.eventId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getStorageKey(): string {
    return `gameAudit-${this.eventId}`;
  }

  private loadAuditLogs(): AuditEvent[] {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (!stored) return [];

      const parsed = JSON.parse(stored);
      return parsed.map((log: any) => ({
        ...log,
        timestamp: new Date(log.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      return [];
    }
  }

  private persistAuditLogs(logs: AuditEvent[]): void {
    try {
      localStorage.setItem(this.getStorageKey(), JSON.stringify(logs));
    } catch (error) {
      console.error('Failed to persist audit logs:', error);
      throw error;
    }
  }

  private logToConsole(event: AuditEvent): void {
    const logLevel = event.severity === 'critical' || event.severity === 'error' ? 'error' :
                    event.severity === 'warning' ? 'warn' : 'log';
    
    console[logLevel]('[AUDIT]', {
      type: event.eventType,
      severity: event.severity,
      category: event.category,
      staff: event.staffId,
      guest: event.guestId,
      details: event.details
    });
  }

  private exportAsCSV(logs: AuditEvent[]): string {
    if (logs.length === 0) return 'No data to export';

    const headers = ['ID', 'Timestamp', 'Event Type', 'Staff ID', 'Guest ID', 'Game ID', 'Severity', 'Category', 'Details'];
    const rows = logs.map(log => [
      log.id,
      log.timestamp.toISOString(),
      log.eventType,
      log.staffId,
      log.guestId || '',
      log.gameId || '',
      log.severity,
      log.category,
      JSON.stringify(log.details)
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  private exportAsText(logs: AuditEvent[]): string {
    if (logs.length === 0) return 'No audit logs to export';

    return logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.severity.toUpperCase()} - ${log.eventType}\n` +
      `Staff: ${log.staffId}${log.guestId ? `, Guest: ${log.guestId}` : ''}${log.gameId ? `, Game: ${log.gameId}` : ''}\n` +
      `Category: ${log.category}\n` +
      `Details: ${JSON.stringify(log.details, null, 2)}\n` +
      '---'
    ).join('\n\n');
  }
}

/**
 * Factory function to create game audit logger
 */
export function createGameAuditLogger(eventId: string): GameAuditLogger {
  return new GameAuditLogger(eventId);
}

// Export singleton for global use
export const gameAuditLogger = {
  create: createGameAuditLogger
}; 