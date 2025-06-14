/**
 * Font Loading Test Utility
 * Tests font loading behavior and performance under different conditions
 */

import { fontLoader } from './fontLoader';
import { fontPerformanceMonitor } from './fontPerformance';

interface TestResult {
  testName: string;
  passed: boolean;
  metrics: any;
  message: string;
}

class FontLoadingTester {
  private results: TestResult[] = [];

  /**
   * Test 1: Verify CSS Font Loading API Support
   */
  testBrowserSupport(): TestResult {
    const supported = 'fonts' in document && 'FontFace' in window;
    
    return {
      testName: 'Browser Support',
      passed: supported,
      metrics: { 
        fontApiSupported: supported,
        performanceApiSupported: 'PerformanceObserver' in window 
      },
      message: supported 
        ? 'CSS Font Loading API is supported' 
        : 'CSS Font Loading API not supported, falling back to CSS loading'
    };
  }

  /**
   * Test 2: Verify Font Preloading
   */
  testFontPreloading(): TestResult {
    const preloadLinks = document.querySelectorAll('link[rel="preload"][as="font"]');
    const hasInterPreload = Array.from(preloadLinks).some(link => 
      (link as HTMLLinkElement).href.includes('inter')
    );
    const hasPlayfairPreload = Array.from(preloadLinks).some(link => 
      (link as HTMLLinkElement).href.includes('playfair')
    );

    const passed = preloadLinks.length >= 2 && hasInterPreload && hasPlayfairPreload;

    return {
      testName: 'Font Preloading',
      passed,
      metrics: {
        preloadLinks: preloadLinks.length,
        hasInterPreload,
        hasPlayfairPreload,
        preloadUrls: Array.from(preloadLinks).map(link => (link as HTMLLinkElement).href)
      },
      message: passed 
        ? `Font preloading configured correctly (${preloadLinks.length} preload links)` 
        : 'Font preloading not configured properly'
    };
  }

  /**
   * Test 3: Verify Fallback Fonts are Applied Initially
   */
  testFallbackFonts(): TestResult {
    const bodyStyle = window.getComputedStyle(document.body);
    const bodyFontFamily = bodyStyle.fontFamily;
    
    // Check if fallback fonts are being used initially
    const hasFallbackFonts = bodyFontFamily.includes('system-ui') || 
                            bodyFontFamily.includes('BlinkMacSystemFont') ||
                            bodyFontFamily.includes('Segoe UI');

    return {
      testName: 'Fallback Fonts',
      passed: hasFallbackFonts,
      metrics: {
        bodyFontFamily,
        hasSystemFonts: hasFallbackFonts
      },
      message: hasFallbackFonts 
        ? 'Fallback fonts are properly configured' 
        : 'Fallback fonts may not be configured correctly'
    };
  }

  /**
   * Test 4: Check Font Loading Status
   */
  async testFontLoadingStatus(): Promise<TestResult> {
    const fontStatus = fontLoader.getStatus();
    const documentFontsReady = document.fonts.status === 'loaded';

    return {
      testName: 'Font Loading Status',
      passed: fontStatus.loaded.length > 0 || documentFontsReady,
      metrics: {
        loadedFonts: fontStatus.loaded,
        loadingFonts: fontStatus.loading,
        documentFontsStatus: document.fonts.status,
        documentFontsSize: document.fonts.size
      },
      message: `Fonts loading status: ${fontStatus.loaded.length} loaded, ${fontStatus.loading.length} loading`
    };
  }

  /**
   * Test 5: Verify Progressive Enhancement Classes
   */
  testProgressiveEnhancement(): TestResult {
    const html = document.documentElement;
    const hasCriticalClass = html.classList.contains('fonts-critical-loaded');
    const hasAllClass = html.classList.contains('fonts-all-loaded');

    return {
      testName: 'Progressive Enhancement',
      passed: hasCriticalClass || hasAllClass,
      metrics: {
        hasCriticalClass,
        hasAllClass,
        htmlClasses: Array.from(html.classList)
      },
      message: hasCriticalClass 
        ? 'Progressive font loading classes are applied' 
        : 'Progressive font loading classes not yet applied (fonts may still be loading)'
    };
  }

  /**
   * Test 6: Performance Metrics Check
   */
  testPerformanceMetrics(): TestResult {
    const metrics = fontPerformanceMonitor.getMetrics();
    const clsOptimal = fontPerformanceMonitor.isClsOptimal();

    return {
      testName: 'Performance Metrics',
      passed: clsOptimal && (metrics.fcp || 0) < 3000,
      metrics,
      message: clsOptimal 
        ? 'Performance metrics look good' 
        : `CLS needs improvement: ${fontPerformanceMonitor.getCLS().toFixed(4)}`
    };
  }

  /**
   * Test 7: CLS Optimization System
   */
  testClsOptimization(): TestResult {
    // Import dynamically to avoid circular dependencies
    const clsOptimizer = (window as any).clsOptimizer;
    
    if (!clsOptimizer) {
      return {
        testName: 'CLS Optimization',
        passed: false,
        metrics: {},
        message: 'CLS optimizer not available'
      };
    }

    const trend = clsOptimizer.getClsTrend();
    const passed = trend.current <= 0.1;

    return {
      testName: 'CLS Optimization',
      passed,
      metrics: {
        currentCls: trend.current,
        averageCls: trend.average,
        trend: trend.trend,
        recommendation: trend.recommendation
      },
      message: passed 
        ? `CLS optimization working: ${trend.current.toFixed(4)}` 
        : `CLS needs attention: ${trend.current.toFixed(4)} (${trend.recommendation})`
    };
  }

  /**
   * Test 8: Web Vitals Integration
   */
  testWebVitalsIntegration(): TestResult {
    const webVitalsMonitor = (window as any).webVitalsMonitor;
    
    if (!webVitalsMonitor) {
      return {
        testName: 'Web Vitals Integration',
        passed: false,
        metrics: {},
        message: 'Web Vitals monitor not available'
      };
    }

    const metrics = webVitalsMonitor.getMetrics();
    const clsAnalysis = webVitalsMonitor.getClsAnalysis();
    
    const passed = clsAnalysis.status === 'good' && Object.keys(metrics).length > 0;

    return {
      testName: 'Web Vitals Integration',
      passed,
      metrics: {
        ...metrics,
        clsStatus: clsAnalysis.status,
        fontRelatedShifts: clsAnalysis.fontRelatedShifts
      },
      message: passed 
        ? 'Web Vitals monitoring active and healthy' 
        : `Web Vitals issues detected: ${clsAnalysis.status} CLS status`
    };
  }

  /**
   * Simulate Slow Network for Testing
   */
  simulateSlowNetwork(): void {
    if ('serviceWorker' in navigator) {
      console.log('🐌 To test slow network, open DevTools > Network tab > set throttling to "Slow 3G"');
    }
  }

  /**
   * Run all font loading tests
   */
  async runAllTests(): Promise<TestResult[]> {
    console.group('🧪 Font Loading Test Suite');

    this.results = [];

    // Test 1: Browser Support
    this.results.push(this.testBrowserSupport());

    // Test 2: Font Preloading
    this.results.push(this.testFontPreloading());

    // Test 3: Fallback Fonts
    this.results.push(this.testFallbackFonts());

    // Test 4: Font Loading Status (async)
    this.results.push(await this.testFontLoadingStatus());

    // Test 5: Progressive Enhancement
    this.results.push(this.testProgressiveEnhancement());

    // Test 6: Performance Metrics
    this.results.push(this.testPerformanceMetrics());

    // Test 7: CLS Optimization System
    this.results.push(this.testClsOptimization());

    // Test 8: Web Vitals Integration
    this.results.push(this.testWebVitalsIntegration());

    // Log results
    this.logResults();

    console.groupEnd();

    return this.results;
  }

  /**
   * Log test results in a formatted way
   */
  private logResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`\n📊 Test Results: ${passed}/${total} tests passed\n`);

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      
      if (!result.passed && result.metrics) {
        console.log('   Metrics:', result.metrics);
      }
    });

    if (passed === total) {
      console.log('\n🎉 All font loading tests passed!');
    } else {
      console.log('\n⚠️  Some tests failed. Check implementation or wait for fonts to load.');
    }

    // Additional recommendations
    console.log('\n💡 Recommendations:');
    console.log('- Open DevTools > Network tab and throttle to "Slow 3G" to test font loading');
    console.log('- Check Console for font loading progress messages');
    console.log('- Monitor CLS in DevTools > Performance tab');
    console.log('- Use Lighthouse to measure Core Web Vitals');
  }

  /**
   * Get test summary
   */
  getTestSummary(): {
    passed: number;
    total: number;
    failedTests: string[];
    recommendations: string[];
  } {
    const failed = this.results.filter(r => !r.passed);
    
    return {
      passed: this.results.filter(r => r.passed).length,
      total: this.results.length,
      failedTests: failed.map(r => r.testName),
      recommendations: [
        'Test on slow network connections',
        'Monitor CLS scores with Lighthouse',
        'Verify FOIT prevention in DevTools',
        'Check font loading in incognito mode'
      ]
    };
  }
}

// Export singleton
export const fontTester = new FontLoadingTester();

// Auto-run tests in development (safely)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Only run in development
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      // Wait for font loader to initialize
      setTimeout(() => {
        try {
          fontTester.runAllTests();
        } catch (error) {
          console.warn('Font tests failed to run:', error);
        }
      }, 3000);
    });
  }

  // Make tester available globally for manual testing
  try {
    (window as any).fontTester = fontTester;
  } catch (error) {
    console.warn('Failed to expose fontTester globally:', error);
  }
} 