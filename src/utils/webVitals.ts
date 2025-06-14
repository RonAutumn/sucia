/**
 * Web Vitals Monitoring System
 * Comprehensive monitoring of Core Web Vitals with focus on CLS optimization
 */

import { onCLS, onFCP, onINP, onLCP, onTTFB } from 'web-vitals';

// TypeScript interface for LayoutShift
interface LayoutShift extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Element;
  }>;
}

interface VitalsMetrics {
  cls: number;
  fcp: number;
  inp: number;
  lcp: number;
  ttfb: number;
  timestamp: number;
}

interface CLSEntry {
  value: number;
  startTime: number;
  sources: string[];
  hadRecentInput: boolean;
}

class WebVitalsMonitor {
  private metrics: Partial<VitalsMetrics> = {};
  private clsEntries: CLSEntry[] = [];
  private observers: PerformanceObserver[] = [];
  private isMonitoring = false;
  private clsThreshold = 0.1; // Good CLS threshold
  private callbacks: Array<(metrics: Partial<VitalsMetrics>) => void> = [];

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize comprehensive Web Vitals monitoring
   */
  private initializeMonitoring(): void {
    if (this.isMonitoring) return;
    this.isMonitoring = true;

    // Monitor CLS with detailed tracking
    onCLS((metric) => {
      this.metrics.cls = metric.value;
      this.metrics.timestamp = Date.now();
      
      // Track individual CLS entries for analysis
      if (metric.entries) {
        metric.entries.forEach((entry: any) => {
          this.clsEntries.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: entry.sources?.map((source: any) => source.node?.tagName || 'unknown') || [],
            hadRecentInput: entry.hadRecentInput || false
          });
        });
      }

      this.logCLSUpdate(metric.value);
      this.notifyCallbacks();
    });

    // Monitor First Contentful Paint
    onFCP((metric) => {
      this.metrics.fcp = metric.value;
      this.metrics.timestamp = Date.now();
      console.log(`📊 FCP: ${metric.value.toFixed(2)}ms`);
      this.notifyCallbacks();
    });

    // Monitor Interaction to Next Paint (replaces FID in v5)
    onINP((metric) => {
      this.metrics.inp = metric.value;
      this.metrics.timestamp = Date.now();
      console.log(`📊 INP: ${metric.value.toFixed(2)}ms`);
      this.notifyCallbacks();
    });

    // Monitor Largest Contentful Paint
    onLCP((metric) => {
      this.metrics.lcp = metric.value;
      this.metrics.timestamp = Date.now();
      console.log(`📊 LCP: ${metric.value.toFixed(2)}ms`);
      this.notifyCallbacks();
    });

    // Monitor Time to First Byte
    onTTFB((metric) => {
      this.metrics.ttfb = metric.value;
      this.metrics.timestamp = Date.now();
      console.log(`📊 TTFB: ${metric.value.toFixed(2)}ms`);
      this.notifyCallbacks();
    });

    // Additional layout shift monitoring for font-specific analysis
    this.setupFontLayoutShiftMonitoring();
  }

  /**
   * Set up specific monitoring for font-related layout shifts
   */
  private setupFontLayoutShiftMonitoring(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const layoutShift = entry as LayoutShift;
            if (!layoutShift.hadRecentInput) {
            
            // Check if layout shift is font-related
            const isFontRelated = this.isFontRelatedLayoutShift(layoutShift);
            
            if (isFontRelated) {
              console.warn(`🔤 Font-related layout shift detected:`, {
                value: layoutShift.value.toFixed(4),
                startTime: layoutShift.startTime.toFixed(2) + 'ms',
                sources: layoutShift.sources?.length || 0
              });
            }
            }
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Layout shift monitoring not supported:', error);
    }
  }

  /**
   * Determine if a layout shift is likely font-related
   */
  private isFontRelatedLayoutShift(entry: LayoutShift): boolean {
    if (!entry.sources) return false;

    return entry.sources.some((source: any) => {
      const node = source.node;
      if (!node) return false;

      // Check if the node or its parents have font-related classes
      const element = node as Element;
      const classList = element.classList;
      const hasDisplayFont = classList?.contains('font-display');
      const hasSansFont = classList?.contains('font-sans');
      
      // Check computed styles for font changes
      const computedStyle = window.getComputedStyle(element);
      const fontFamily = computedStyle.fontFamily;
      const hasBrandFonts = fontFamily.includes('Inter') || fontFamily.includes('Playfair');

      return hasDisplayFont || hasSansFont || hasBrandFonts;
    });
  }

  /**
   * Log CLS updates with status indicators
   */
  private logCLSUpdate(value: number): void {
    const status = this.getClsStatus(value);
    const icon = status === 'good' ? '✅' : status === 'needs-improvement' ? '⚠️' : '❌';
    
    console.log(`${icon} CLS: ${value.toFixed(4)} (${status.toUpperCase()})`);
    
    if (value > this.clsThreshold) {
      console.warn(`🚨 CLS threshold exceeded! Current: ${value.toFixed(4)}, Target: ≤ ${this.clsThreshold}`);
      this.provideCLSOptimizationTips();
    }
  }

  /**
   * Provide CLS optimization tips when threshold is exceeded
   */
  private provideCLSOptimizationTips(): void {
    console.group('💡 CLS Optimization Tips');
    console.log('1. Check font fallback metrics (ascent-override, descent-override)');
    console.log('2. Ensure font-display: swap is working correctly');
    console.log('3. Verify font preloading is functioning');
    console.log('4. Consider using font-size-adjust for better fallback matching');
    console.log('5. Check for images without dimensions causing shifts');
    console.groupEnd();
  }

  /**
   * Get CLS status based on value
   */
  private getClsStatus(value: number): 'good' | 'needs-improvement' | 'poor' {
    if (value <= 0.1) return 'good';
    if (value <= 0.25) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Notify registered callbacks of metric updates
   */
  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error in Web Vitals callback:', error);
      }
    });
  }

  /**
   * Register a callback for metric updates
   */
  onMetricsUpdate(callback: (metrics: Partial<VitalsMetrics>) => void): () => void {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<VitalsMetrics> {
    return { ...this.metrics };
  }

  /**
   * Get detailed CLS analysis
   */
  getClsAnalysis(): {
    currentValue: number;
    status: 'good' | 'needs-improvement' | 'poor';
    entries: CLSEntry[];
    fontRelatedShifts: number;
    recommendations: string[];
  } {
    const currentValue = this.metrics.cls || 0;
    const status = this.getClsStatus(currentValue);
    const fontRelatedShifts = this.clsEntries.filter(entry => 
      entry.sources.some(source => 
        ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'SPAN', 'DIV'].includes(source)
      )
    ).length;

    const recommendations: string[] = [];
    
    if (status !== 'good') {
      recommendations.push('Optimize font fallback metrics');
      recommendations.push('Ensure proper font preloading');
      recommendations.push('Check font-display: swap implementation');
    }
    
    if (fontRelatedShifts > 0) {
      recommendations.push('Review font loading strategy');
      recommendations.push('Consider using font-size-adjust');
    }

    return {
      currentValue,
      status,
      entries: this.clsEntries,
      fontRelatedShifts,
      recommendations
    };
  }

  /**
   * Force immediate metric collection (returns current cached metrics)
   */
  async collectMetrics(): Promise<Partial<VitalsMetrics>> {
    // Return current metrics since web-vitals doesn't provide immediate collection
    return Promise.resolve(this.getMetrics());
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(): {
    metrics: Partial<VitalsMetrics>;
    cls: {
      currentValue: number;
      status: 'good' | 'needs-improvement' | 'poor';
      entries: CLSEntry[];
      fontRelatedShifts: number;
      recommendations: string[];
    };
    summary: {
      overallScore: 'good' | 'needs-improvement' | 'poor';
      criticalIssues: string[];
      recommendations: string[];
    };
  } {
    const metrics = this.getMetrics();
    const cls = this.getClsAnalysis();
    
    const criticalIssues: string[] = [];
    const recommendations: string[] = [];
    
    // Analyze each metric
    if ((metrics.cls || 0) > 0.1) {
      criticalIssues.push('CLS exceeds good threshold (0.1)');
      recommendations.push('Optimize font loading and fallback metrics');
    }
    
    if ((metrics.fcp || 0) > 1800) {
      criticalIssues.push('FCP is slower than good threshold (1.8s)');
      recommendations.push('Optimize font preloading and critical resource loading');
    }
    
    if ((metrics.lcp || 0) > 2500) {
      criticalIssues.push('LCP is slower than good threshold (2.5s)');
      recommendations.push('Optimize largest contentful element and font loading');
    }

    // Determine overall score
    let overallScore: 'good' | 'needs-improvement' | 'poor' = 'good';
    if (criticalIssues.length > 0) {
      overallScore = criticalIssues.length > 2 ? 'poor' : 'needs-improvement';
    }

    return {
      metrics,
      cls,
      summary: {
        overallScore,
        criticalIssues,
        recommendations
      }
    };
  }

  /**
   * Log comprehensive performance report
   */
  logReport(): void {
    const report = this.generateReport();
    
    console.group('📊 Web Vitals Performance Report');
    
    // Metrics summary
    console.log('Core Web Vitals:');
    console.table({
      'CLS': {
        value: (report.metrics.cls || 0).toFixed(4),
        status: report.cls.status,
        threshold: '≤ 0.1'
      },
      'FCP': {
        value: (report.metrics.fcp || 0).toFixed(0) + 'ms',
        status: (report.metrics.fcp || 0) <= 1800 ? 'good' : 'needs-improvement',
        threshold: '≤ 1800ms'
      },
      'LCP': {
        value: (report.metrics.lcp || 0).toFixed(0) + 'ms',
        status: (report.metrics.lcp || 0) <= 2500 ? 'good' : 'needs-improvement',
        threshold: '≤ 2500ms'
      },
              'INP': {
          value: (report.metrics.inp || 0).toFixed(0) + 'ms',
          status: (report.metrics.inp || 0) <= 200 ? 'good' : 'needs-improvement',
                  threshold: '≤ 200ms'
      }
    });

    // CLS Analysis
    if (report.cls.entries.length > 0) {
      console.log(`\nCLS Events: ${report.cls.entries.length}`);
      console.log(`Font-related shifts: ${report.cls.fontRelatedShifts}`);
    }

    // Summary
    console.log(`\nOverall Score: ${report.summary.overallScore.toUpperCase()}`);
    
    if (report.summary.criticalIssues.length > 0) {
      console.warn('Critical Issues:', report.summary.criticalIssues);
    }
    
    if (report.summary.recommendations.length > 0) {
      console.log('Recommendations:', report.summary.recommendations);
    }
    
    console.groupEnd();
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isMonitoring = false;
  }
}

// Export singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();

// Auto-generate report after page load (safely)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait for metrics to be collected
    setTimeout(() => {
      try {
        webVitalsMonitor.logReport();
      } catch (error) {
        console.warn('Web Vitals report generation failed:', error);
      }
    }, 3000);
  });

  // Make monitor available globally for debugging
  try {
    (window as any).webVitalsMonitor = webVitalsMonitor;
  } catch (error) {
    console.warn('Failed to expose webVitalsMonitor globally:', error);
  }
} 