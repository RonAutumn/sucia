/**
 * CLS Optimization Utility
 * Dynamic font loading optimization based on real-time CLS measurements
 */

import { webVitalsMonitor } from './webVitals';

interface OptimizationRule {
  condition: (cls: number) => boolean;
  action: () => void;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

interface FontMetricAdjustment {
  property: string;
  value: string;
  target: string;
}

class CLSOptimizer {
  private isOptimizing = false;
  private optimizationRules: OptimizationRule[] = [];
  private appliedOptimizations: string[] = [];
  private clsHistory: number[] = [];
  private maxHistoryLength = 10;

  constructor() {
    this.initializeOptimizationRules();
    this.startMonitoring();
  }

  /**
   * Initialize optimization rules based on CLS thresholds
   */
  private initializeOptimizationRules(): void {
    this.optimizationRules = [
      {
        condition: (cls) => cls > 0.25,
        action: () => this.applyEmergencyOptimizations(),
        description: 'Apply emergency CLS optimizations (CLS > 0.25)',
        priority: 'high'
      },
      {
        condition: (cls) => cls > 0.1 && cls <= 0.25,
        action: () => this.applyModerateOptimizations(),
        description: 'Apply moderate CLS optimizations (CLS 0.1-0.25)',
        priority: 'medium'
      },
      {
        condition: (cls) => cls > 0.05 && cls <= 0.1,
        action: () => this.applyPreventiveOptimizations(),
        description: 'Apply preventive CLS optimizations (CLS 0.05-0.1)',
        priority: 'low'
      }
    ];
  }

  /**
   * Start monitoring CLS and apply optimizations
   */
  private startMonitoring(): void {
    webVitalsMonitor.onMetricsUpdate((metrics) => {
      if (metrics.cls !== undefined) {
        this.updateClsHistory(metrics.cls);
        this.evaluateOptimizations(metrics.cls);
      }
    });
  }

  /**
   * Update CLS history for trend analysis
   */
  private updateClsHistory(cls: number): void {
    this.clsHistory.push(cls);
    if (this.clsHistory.length > this.maxHistoryLength) {
      this.clsHistory.shift();
    }
  }

  /**
   * Evaluate and apply optimizations based on current CLS
   */
  private evaluateOptimizations(currentCls: number): void {
    if (this.isOptimizing) return;

    // Find applicable rules
    const applicableRules = this.optimizationRules.filter(rule => 
      rule.condition(currentCls) && 
      !this.appliedOptimizations.includes(rule.description)
    );

    // Apply highest priority rule first
    const sortedRules = applicableRules.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    if (sortedRules.length > 0) {
      const rule = sortedRules[0];
      console.log(`🔧 Applying CLS optimization: ${rule.description}`);
      this.isOptimizing = true;
      
      try {
        rule.action();
        this.appliedOptimizations.push(rule.description);
      } catch (error) {
        console.error('Error applying CLS optimization:', error);
      } finally {
        this.isOptimizing = false;
      }
    }
  }

  /**
   * Apply emergency optimizations for severe CLS issues
   */
  private applyEmergencyOptimizations(): void {
    console.warn('🚨 Applying emergency CLS optimizations');

    // Force immediate font loading
    this.forceImmediateFontLoading();
    
    // Apply aggressive font-display settings
    this.applyAggressiveFontDisplay();
    
    // Disable font transitions temporarily
    this.disableFontTransitions();
    
    // Add emergency CSS rules
    this.addEmergencyCSS();
  }

  /**
   * Apply moderate optimizations for moderate CLS issues
   */
  private applyModerateOptimizations(): void {
    console.log('⚠️ Applying moderate CLS optimizations');

    // Adjust font-size-adjust values
    this.adjustFontSizeAdjust();
    
    // Optimize font preloading
    this.optimizeFontPreloading();
    
    // Apply better fallback metrics
    this.applyBetterFallbackMetrics();
  }

  /**
   * Apply preventive optimizations for minor CLS issues
   */
  private applyPreventiveOptimizations(): void {
    console.log('💡 Applying preventive CLS optimizations');

    // Fine-tune font metrics
    this.fineTuneFontMetrics();
    
    // Optimize font loading timing
    this.optimizeFontLoadingTiming();
  }

  /**
   * Force immediate font loading to prevent layout shifts
   */
  private forceImmediateFontLoading(): void {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        font-display: block !important;
      }
      @font-face {
        font-family: 'Playfair Display';
        font-display: block !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Apply aggressive font-display settings
   */
  private applyAggressiveFontDisplay(): void {
    const style = document.createElement('style');
    style.textContent = `
      .font-sans, .font-display {
        font-display: block !important;
        font-synthesis: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Disable font transitions to prevent layout shifts
   */
  private disableFontTransitions(): void {
    const style = document.createElement('style');
    style.textContent = `
      .font-sans, .font-display, h1, h2, h3, h4, h5, h6 {
        transition: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add emergency CSS rules for CLS prevention
   */
  private addEmergencyCSS(): void {
    const style = document.createElement('style');
    style.textContent = `
      /* Emergency CLS prevention */
      * {
        font-synthesis: none !important;
      }
      h1, h2, h3, h4, h5, h6 {
        min-height: 1.5em !important;
        line-height: 1.2 !important;
      }
      .font-display {
        font-size-adjust: 0.5 !important;
      }
      .font-sans {
        font-size-adjust: 0.52 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Adjust font-size-adjust values for better matching
   */
  private adjustFontSizeAdjust(): void {
    const style = document.createElement('style');
    style.textContent = `
      .font-sans {
        font-size-adjust: 0.515 !important;
      }
      .font-display {
        font-size-adjust: 0.485 !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize font preloading by adding missing preload links
   */
  private optimizeFontPreloading(): void {
    const existingPreloads = document.querySelectorAll('link[rel="preload"][as="font"]');
    const existingUrls = new Set(Array.from(existingPreloads).map(link => 
      (link as HTMLLinkElement).href
    ));

    const criticalFonts = [
      'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.woff2',
      'https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDTbtXK-F2qC0s.woff2'
    ];

    criticalFonts.forEach(url => {
      if (!existingUrls.has(url)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'font';
        link.type = 'font/woff2';
        link.crossOrigin = 'anonymous';
        link.href = url;
        document.head.appendChild(link);
      }
    });
  }

  /**
   * Apply better fallback metrics based on measurements
   */
  private applyBetterFallbackMetrics(): void {
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Inter';
        size-adjust: 108% !important;
        ascent-override: 89% !important;
        descent-override: 23% !important;
      }
      @font-face {
        font-family: 'Playfair Display';
        size-adjust: 94% !important;
        ascent-override: 87% !important;
        descent-override: 21% !important;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Fine-tune font metrics for minor improvements
   */
  private fineTuneFontMetrics(): void {
    const style = document.createElement('style');
    style.textContent = `
      .font-sans {
        font-size-adjust: 0.509;
      }
      .font-display {
        font-size-adjust: 0.483;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Optimize font loading timing
   */
  private optimizeFontLoadingTiming(): void {
    // Add slight delay to non-critical font loading
    setTimeout(() => {
      document.documentElement.classList.add('fonts-timing-optimized');
    }, 100);
  }

  /**
   * Get CLS trend analysis
   */
  getClsTrend(): {
    current: number;
    average: number;
    trend: 'improving' | 'stable' | 'worsening';
    recommendation: string;
  } {
    const current = this.clsHistory[this.clsHistory.length - 1] || 0;
    const average = this.clsHistory.reduce((sum, cls) => sum + cls, 0) / this.clsHistory.length;
    
    let trend: 'improving' | 'stable' | 'worsening' = 'stable';
    if (this.clsHistory.length >= 3) {
      const recent = this.clsHistory.slice(-3);
      const older = this.clsHistory.slice(-6, -3);
      const recentAvg = recent.reduce((sum, cls) => sum + cls, 0) / recent.length;
      const olderAvg = older.reduce((sum, cls) => sum + cls, 0) / older.length;
      
      if (recentAvg < olderAvg * 0.9) trend = 'improving';
      else if (recentAvg > olderAvg * 1.1) trend = 'worsening';
    }

    let recommendation = 'CLS is within acceptable range';
    if (current > 0.1) {
      recommendation = 'CLS needs optimization - consider font loading improvements';
    } else if (current > 0.05) {
      recommendation = 'CLS is borderline - monitor and consider preventive measures';
    }

    return { current, average, trend, recommendation };
  }

  /**
   * Generate optimization report
   */
  generateOptimizationReport(): {
    clsTrend: {
      current: number;
      average: number;
      trend: 'improving' | 'stable' | 'worsening';
      recommendation: string;
    };
    appliedOptimizations: string[];
    recommendations: string[];
    nextSteps: string[];
  } {
    const clsTrend = this.getClsTrend();
    
    const recommendations = [
      'Monitor CLS continuously during development',
      'Test font loading on slow connections',
      'Use Lighthouse for comprehensive CLS analysis',
      'Consider using font-display: optional for non-critical fonts'
    ];

    const nextSteps = [];
    if (clsTrend.current > 0.1) {
      nextSteps.push('Implement emergency CLS optimizations');
      nextSteps.push('Review font loading strategy');
    } else if (clsTrend.trend === 'worsening') {
      nextSteps.push('Investigate recent changes causing CLS regression');
    }

    return {
      clsTrend,
      appliedOptimizations: this.appliedOptimizations,
      recommendations,
      nextSteps
    };
  }

  /**
   * Reset optimizer state
   */
  reset(): void {
    this.appliedOptimizations = [];
    this.clsHistory = [];
    this.isOptimizing = false;
  }
}

// Export singleton instance
export const clsOptimizer = new CLSOptimizer();

// Make available globally for debugging (safely)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  try {
    (window as any).clsOptimizer = clsOptimizer;
  } catch (error) {
    console.warn('Failed to expose clsOptimizer globally:', error);
  }
} 