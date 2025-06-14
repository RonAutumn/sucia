/**
 * Font Performance Monitoring Utility
 * Tracks font loading performance and CLS metrics
 */

interface FontMetrics {
  loadTime: number;
  renderTime: number;
  cls: number;
  fcp: number;
  lcp: number;
}

class FontPerformanceMonitor {
  private metrics: Partial<FontMetrics> = {};
  private observer: PerformanceObserver | null = null;
  private clsValue = 0;
  private clsEntries: LayoutShift[] = [];

  constructor() {
    this.initializeObservers();
  }

  /**
   * Initialize performance observers for CLS and other metrics
   */
  private initializeObservers(): void {
    // CLS Observer
    if ('PerformanceObserver' in window) {
      try {
        this.observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
              const layoutShiftEntry = entry as LayoutShift;
              if (!layoutShiftEntry.hadRecentInput) {
                this.clsValue += layoutShiftEntry.value;
                this.clsEntries.push(layoutShiftEntry);
              }
            }
          }
        });

        this.observer.observe({ type: 'layout-shift', buffered: true });
      } catch (error) {
        console.warn('CLS monitoring not supported:', error);
      }
    }

    // Listen for font loading events
    if ('fonts' in document) {
      document.fonts.ready.then(() => {
        this.measureFontLoadTime();
      });
    }

    // Measure other Web Vitals
    this.measureWebVitals();
  }

  /**
   * Measure font loading time
   */
  private measureFontLoadTime(): void {
    const navigationStart = performance.timeOrigin;
    const fontLoadTime = performance.now();
    
    this.metrics.loadTime = fontLoadTime;
    
    console.log(`📊 Font Loading Metrics:`, {
      loadTime: `${fontLoadTime.toFixed(2)}ms`,
      cls: this.clsValue.toFixed(4),
      fontsLoaded: document.fonts.size
    });
  }

  /**
   * Measure Web Vitals (FCP, LCP)
   */
  private measureWebVitals(): void {
    // First Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
      }
    }).observe({ type: 'paint', buffered: true });

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.metrics.lcp = lastEntry.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  }

  /**
   * Get current CLS value
   */
  getCLS(): number {
    return this.clsValue;
  }

  /**
   * Get all performance metrics
   */
  getMetrics(): Partial<FontMetrics> {
    return {
      ...this.metrics,
      cls: this.clsValue
    };
  }

  /**
   * Check if CLS meets performance threshold
   */
  isClsOptimal(): boolean {
    return this.clsValue <= 0.1; // Good CLS threshold
  }

  /**
   * Log detailed performance report
   */
  logPerformanceReport(): void {
    const metrics = this.getMetrics();
    
    console.group('🚀 Font Performance Report');
    console.log('Font Load Time:', metrics.loadTime ? `${metrics.loadTime.toFixed(2)}ms` : 'Not available');
    console.log('First Contentful Paint:', metrics.fcp ? `${metrics.fcp.toFixed(2)}ms` : 'Not available');
    console.log('Largest Contentful Paint:', metrics.lcp ? `${metrics.lcp.toFixed(2)}ms` : 'Not available');
    console.log('Cumulative Layout Shift:', metrics.cls?.toFixed(4) || '0.0000');
    console.log('CLS Status:', this.isClsOptimal() ? '✅ GOOD (≤ 0.1)' : '❌ NEEDS IMPROVEMENT (> 0.1)');
    console.log('Total Fonts Loaded:', document.fonts?.size || 0);
    
    if (this.clsEntries.length > 0) {
      console.log('CLS Events:', this.clsEntries.length);
      console.table(this.clsEntries.map(entry => ({
        value: entry.value.toFixed(4),
        startTime: entry.startTime.toFixed(2) + 'ms',
        sources: entry.sources?.length || 0
      })));
    }
    
    console.groupEnd();
  }

  /**
   * Create performance report for debugging
   */
  getPerformanceReport(): {
    metrics: Partial<FontMetrics>;
    status: {
      cls: 'good' | 'needs-improvement' | 'poor';
      fcp: 'good' | 'needs-improvement' | 'poor';
      lcp: 'good' | 'needs-improvement' | 'poor';
    };
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // CLS Status
    let clsStatus: 'good' | 'needs-improvement' | 'poor';
    if (this.clsValue <= 0.1) {
      clsStatus = 'good';
    } else if (this.clsValue <= 0.25) {
      clsStatus = 'needs-improvement';
      recommendations.push('Consider optimizing font fallback matching to reduce layout shift');
    } else {
      clsStatus = 'poor';
      recommendations.push('CRITICAL: Font loading causing significant layout shift. Review font-display and fallback strategies');
    }

    // FCP Status
    let fcpStatus: 'good' | 'needs-improvement' | 'poor';
    if (!metrics.fcp) {
      fcpStatus = 'needs-improvement';
    } else if (metrics.fcp <= 1800) {
      fcpStatus = 'good';
    } else if (metrics.fcp <= 3000) {
      fcpStatus = 'needs-improvement';
      recommendations.push('Consider preloading critical fonts to improve First Contentful Paint');
    } else {
      fcpStatus = 'poor';
      recommendations.push('CRITICAL: First Contentful Paint is slow. Review font loading strategy');
    }

    // LCP Status
    let lcpStatus: 'good' | 'needs-improvement' | 'poor';
    if (!metrics.lcp) {
      lcpStatus = 'needs-improvement';
    } else if (metrics.lcp <= 2500) {
      lcpStatus = 'good';
    } else if (metrics.lcp <= 4000) {
      lcpStatus = 'needs-improvement';
      recommendations.push('Optimize font loading for better Largest Contentful Paint');
    } else {
      lcpStatus = 'poor';
      recommendations.push('CRITICAL: Largest Contentful Paint is poor. Font loading may be blocking render');
    }

    return {
      metrics,
      status: {
        cls: clsStatus,
        fcp: fcpStatus,
        lcp: lcpStatus
      },
      recommendations
    };
  }

  /**
   * Cleanup observers
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export singleton instance
export const fontPerformanceMonitor = new FontPerformanceMonitor();

// Auto-generate report after page load (safely)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait a bit for all metrics to be collected
    setTimeout(() => {
      try {
        fontPerformanceMonitor.logPerformanceReport();
      } catch (error) {
        console.warn('Font performance report generation failed:', error);
      }
    }, 2000);
  });
} 