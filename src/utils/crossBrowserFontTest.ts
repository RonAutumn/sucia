/**
 * Cross-Browser Font Testing Utility
 * Comprehensive testing for font performance across different browsers and conditions
 */

import { fontTester } from './fontTest';
import { fontPerformanceMonitor } from './fontPerformance';

interface BrowserInfo {
  name: string;
  version: string;
  engine: string;
  platform: string;
  mobile: boolean;
}

interface CrossBrowserTestResult {
  testName: string;
  browser: BrowserInfo;
  passed: boolean;
  metrics: any;
  message: string;
  timestamp: number;
}

interface NetworkCondition {
  name: string;
  downloadThroughput: number; // Kbps
  uploadThroughput: number; // Kbps
  latency: number; // ms
}

class CrossBrowserFontTester {
  private results: CrossBrowserTestResult[] = [];
  private browserInfo: BrowserInfo;

  constructor() {
    this.browserInfo = this.detectBrowser();
  }

  /**
   * Detect current browser information
   */
  private detectBrowser(): BrowserInfo {
    const ua = navigator.userAgent;
    const platform = navigator.platform;
    const mobile = /Mobi|Android/i.test(ua);

    let name = 'Unknown';
    let version = 'Unknown';
    let engine = 'Unknown';

    // Chrome
    if (ua.includes('Chrome') && !ua.includes('Edg')) {
      name = 'Chrome';
      const match = ua.match(/Chrome\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }
    // Firefox
    else if (ua.includes('Firefox')) {
      name = 'Firefox';
      const match = ua.match(/Firefox\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Gecko';
    }
    // Safari
    else if (ua.includes('Safari') && !ua.includes('Chrome')) {
      name = 'Safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'WebKit';
    }
    // Edge
    else if (ua.includes('Edg')) {
      name = 'Edge';
      const match = ua.match(/Edg\/(\d+)/);
      version = match ? match[1] : 'Unknown';
      engine = 'Blink';
    }

    return { name, version, engine, platform, mobile };
  }

  /**
   * Test CSS Font Loading API support across browsers
   */
  testFontApiSupport(): CrossBrowserTestResult {
    const fontFaceSupport = 'FontFace' in window;
    const documentFontsSupport = 'fonts' in document;
    const fontLoadSupport = documentFontsSupport && 'load' in document.fonts;
    const fontReadySupport = documentFontsSupport && 'ready' in document.fonts;

    const passed = fontFaceSupport && documentFontsSupport;

    return {
      testName: 'Font API Support',
      browser: this.browserInfo,
      passed,
      metrics: {
        fontFaceSupport,
        documentFontsSupport,
        fontLoadSupport,
        fontReadySupport,
        fontApiLevel: passed ? (fontLoadSupport ? 'full' : 'basic') : 'none'
      },
      message: passed 
        ? `Font API fully supported in ${this.browserInfo.name}` 
        : `Limited font API support in ${this.browserInfo.name}`,
      timestamp: Date.now()
    };
  }

  /**
   * Test font-display property support
   */
  testFontDisplaySupport(): CrossBrowserTestResult {
    const testElement = document.createElement('div');
    try {
      (testElement.style as any).fontDisplay = 'swap';
      const supported = (testElement.style as any).fontDisplay === 'swap';

      return {
        testName: 'Font Display Support',
        browser: this.browserInfo,
        passed: supported,
        metrics: {
          fontDisplaySupported: supported,
          browserEngine: this.browserInfo.engine
        },
        message: supported 
          ? `font-display: swap supported in ${this.browserInfo.name}` 
          : `font-display: swap not supported in ${this.browserInfo.name}`,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        testName: 'Font Display Support',
        browser: this.browserInfo,
        passed: false,
        metrics: {
          fontDisplaySupported: false,
          browserEngine: this.browserInfo.engine,
          error: errorMessage
        },
        message: `font-display test failed in ${this.browserInfo.name}: ${errorMessage}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test CSS font-size-adjust support
   */
  testFontSizeAdjustSupport(): CrossBrowserTestResult {
    const testElement = document.createElement('div');
    try {
      (testElement.style as any).fontSizeAdjust = '0.5';
      const supported = (testElement.style as any).fontSizeAdjust === '0.5';

      return {
        testName: 'Font Size Adjust Support',
        browser: this.browserInfo,
        passed: supported,
        metrics: {
          fontSizeAdjustSupported: supported,
          fallbackOptimization: supported ? 'enhanced' : 'basic'
        },
        message: supported 
          ? `font-size-adjust supported in ${this.browserInfo.name}` 
          : `font-size-adjust not supported in ${this.browserInfo.name} (using fallback metrics)`,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        testName: 'Font Size Adjust Support',
        browser: this.browserInfo,
        passed: false,
        metrics: {
          fontSizeAdjustSupported: false,
          fallbackOptimization: 'basic',
          error: errorMessage
        },
        message: `font-size-adjust test failed in ${this.browserInfo.name}: ${errorMessage}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test font loading performance under different network conditions
   */
  async testNetworkConditions(): Promise<CrossBrowserTestResult> {
    const startTime = performance.now();
    
    // Test font loading timing
    const fontLoadPromises = [];
    
    if ('fonts' in document) {
      fontLoadPromises.push(
        document.fonts.load('400 16px Inter'),
        document.fonts.load('400 24px "Playfair Display"')
      );
    }

    try {
      await Promise.all(fontLoadPromises);
      const loadTime = performance.now() - startTime;
      
      const passed = loadTime < 3000; // 3 second threshold

      return {
        testName: 'Network Performance',
        browser: this.browserInfo,
        passed,
        metrics: {
          fontLoadTime: Math.round(loadTime),
          networkType: (navigator as any).connection?.effectiveType || 'unknown',
          downlink: (navigator as any).connection?.downlink || 'unknown'
        },
        message: passed 
          ? `Fonts loaded in ${Math.round(loadTime)}ms` 
          : `Slow font loading: ${Math.round(loadTime)}ms`,
        timestamp: Date.now()
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        testName: 'Network Performance',
        browser: this.browserInfo,
        passed: false,
        metrics: { error: errorMessage },
        message: `Font loading failed: ${errorMessage}`,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Test graceful degradation with JavaScript disabled simulation
   */
  testJavaScriptDisabledFallback(): CrossBrowserTestResult {
    // Check if CSS-only font loading works
    const cssOnlyFonts = document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
    const hasGoogleFontsCSS = cssOnlyFonts.length > 0;
    
    // Check if fallback fonts are properly defined in CSS
    const bodyStyle = window.getComputedStyle(document.body);
    const fontFamily = bodyStyle.fontFamily;
    const hasFallbacks = fontFamily.includes('system-ui') || fontFamily.includes('sans-serif');

    const passed = hasGoogleFontsCSS && hasFallbacks;

    return {
      testName: 'JavaScript Disabled Fallback',
      browser: this.browserInfo,
      passed,
      metrics: {
        googleFontsCssLinks: cssOnlyFonts.length,
        bodyFontFamily: fontFamily,
        hasFallbackFonts: hasFallbacks,
        cssOnlyLoading: hasGoogleFontsCSS
      },
      message: passed 
        ? 'Graceful degradation works without JavaScript' 
        : 'May not work properly without JavaScript',
      timestamp: Date.now()
    };
  }

  /**
   * Test mobile-specific font rendering
   */
  testMobileOptimizations(): CrossBrowserTestResult {
    const isMobile = this.browserInfo.mobile;
    const hasViewportMeta = document.querySelector('meta[name="viewport"]');
    const viewportContent = hasViewportMeta?.getAttribute('content') || '';
    
    // Check for mobile-specific optimizations
    const hasTextSizeAdjust = (document.documentElement.style as any).textSizeAdjust !== undefined;
    const devicePixelRatio = window.devicePixelRatio || 1;

    const passed = !isMobile || (!!hasViewportMeta && devicePixelRatio >= 1);

    return {
      testName: 'Mobile Optimizations',
      browser: this.browserInfo,
      passed,
      metrics: {
        isMobile,
        hasViewportMeta: !!hasViewportMeta,
        viewportContent,
        devicePixelRatio,
        hasTextSizeAdjust,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      },
      message: isMobile 
        ? (passed ? 'Mobile optimizations configured' : 'Mobile optimizations needed')
        : 'Desktop browser - mobile tests not applicable',
      timestamp: Date.now()
    };
  }

  /**
   * Test Core Web Vitals compliance
   */
  async testCoreWebVitals(): Promise<CrossBrowserTestResult> {
    const metrics = fontPerformanceMonitor.getMetrics();
    const cls = fontPerformanceMonitor.getCLS();
    
    // Core Web Vitals thresholds
    const clsGood = cls <= 0.1;
    const fcpGood = (metrics.fcp || 0) <= 1800;
    const lcpGood = (metrics.lcp || 0) <= 2500;

    const passed = clsGood && fcpGood && lcpGood;

    return {
      testName: 'Core Web Vitals',
      browser: this.browserInfo,
      passed,
      metrics: {
        cls: Number(cls.toFixed(4)),
        fcp: metrics.fcp || 0,
        lcp: metrics.lcp || 0,
        clsStatus: clsGood ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor',
        fcpStatus: fcpGood ? 'good' : (metrics.fcp || 0) <= 3000 ? 'needs-improvement' : 'poor',
        lcpStatus: lcpGood ? 'good' : (metrics.lcp || 0) <= 4000 ? 'needs-improvement' : 'poor'
      },
      message: passed 
        ? 'All Core Web Vitals are good' 
        : `Core Web Vitals need improvement: CLS=${cls.toFixed(4)}, FCP=${metrics.fcp}ms, LCP=${metrics.lcp}ms`,
      timestamp: Date.now()
    };
  }

  /**
   * Test font rendering consistency across different text sizes
   */
  testFontRenderingConsistency(): CrossBrowserTestResult {
    const testSizes = ['12px', '16px', '24px', '32px', '48px'];
    const testElement = document.createElement('div');
    testElement.style.position = 'absolute';
    testElement.style.visibility = 'hidden';
    testElement.textContent = 'Test Text Rendering';
    document.body.appendChild(testElement);

    const measurements = testSizes.map(size => {
      testElement.style.fontSize = size;
      testElement.style.fontFamily = 'Inter, system-ui, sans-serif';
      const rect = testElement.getBoundingClientRect();
      return {
        size,
        width: rect.width,
        height: rect.height
      };
    });

    document.body.removeChild(testElement);

    // Check for consistent scaling
    const ratios = measurements.slice(1).map((curr, i) => 
      curr.height / measurements[i].height
    );
    const consistentScaling = ratios.every(ratio => ratio > 1 && ratio < 3);

    return {
      testName: 'Font Rendering Consistency',
      browser: this.browserInfo,
      passed: consistentScaling,
      metrics: {
        measurements,
        scalingRatios: ratios,
        consistentScaling
      },
      message: consistentScaling 
        ? 'Font rendering scales consistently' 
        : 'Font rendering may have scaling issues',
      timestamp: Date.now()
    };
  }

  /**
   * Run comprehensive cross-browser test suite
   */
  async runCrossBrowserTests(): Promise<CrossBrowserTestResult[]> {
    console.group(`🌐 Cross-Browser Font Tests - ${this.browserInfo.name} ${this.browserInfo.version}`);

    this.results = [];

    // Browser capability tests
    this.results.push(this.testFontApiSupport());
    this.results.push(this.testFontDisplaySupport());
    this.results.push(this.testFontSizeAdjustSupport());

    // Performance tests
    this.results.push(await this.testNetworkConditions());
    this.results.push(await this.testCoreWebVitals());

    // Compatibility tests
    this.results.push(this.testJavaScriptDisabledFallback());
    this.results.push(this.testMobileOptimizations());
    this.results.push(this.testFontRenderingConsistency());

    // Log results
    this.logCrossBrowserResults();

    console.groupEnd();

    return this.results;
  }

  /**
   * Log cross-browser test results
   */
  private logCrossBrowserResults(): void {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;

    console.log(`\n📊 Cross-Browser Test Results: ${passed}/${total} tests passed`);
    console.log(`🌐 Browser: ${this.browserInfo.name} ${this.browserInfo.version} (${this.browserInfo.engine})`);
    console.log(`📱 Platform: ${this.browserInfo.platform} ${this.browserInfo.mobile ? '(Mobile)' : '(Desktop)'}\n`);

    this.results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.testName}: ${result.message}`);
      
      if (!result.passed && result.metrics) {
        console.log('   Metrics:', result.metrics);
      }
    });

    if (passed === total) {
      console.log(`\n🎉 All cross-browser tests passed in ${this.browserInfo.name}!`);
    } else {
      console.log(`\n⚠️  ${total - passed} tests failed in ${this.browserInfo.name}`);
      this.logBrowserSpecificRecommendations();
    }
  }

  /**
   * Log browser-specific recommendations
   */
  private logBrowserSpecificRecommendations(): void {
    console.log('\n💡 Browser-Specific Recommendations:');
    
    const failedTests = this.results.filter(r => !r.passed);
    
    failedTests.forEach(test => {
      switch (test.testName) {
        case 'Font API Support':
          console.log(`- ${this.browserInfo.name}: Consider CSS-only font loading fallback`);
          break;
        case 'Font Display Support':
          console.log(`- ${this.browserInfo.name}: Use alternative FOIT prevention methods`);
          break;
        case 'Font Size Adjust Support':
          console.log(`- ${this.browserInfo.name}: Rely on manual fallback font metrics`);
          break;
        case 'Core Web Vitals':
          console.log(`- ${this.browserInfo.name}: Optimize font loading timing and CLS`);
          break;
        case 'Mobile Optimizations':
          console.log(`- ${this.browserInfo.name}: Add mobile-specific font optimizations`);
          break;
      }
    });
  }

  /**
   * Get browser compatibility report
   */
  getBrowserCompatibilityReport(): {
    browser: BrowserInfo;
    passed: number;
    total: number;
    compatibility: 'excellent' | 'good' | 'fair' | 'poor';
    issues: string[];
    recommendations: string[];
  } {
    const passed = this.results.filter(r => r.passed).length;
    const total = this.results.length;
    const percentage = (passed / total) * 100;

    let compatibility: 'excellent' | 'good' | 'fair' | 'poor';
    if (percentage >= 90) compatibility = 'excellent';
    else if (percentage >= 75) compatibility = 'good';
    else if (percentage >= 60) compatibility = 'fair';
    else compatibility = 'poor';

    const issues = this.results.filter(r => !r.passed).map(r => r.testName);
    
    return {
      browser: this.browserInfo,
      passed,
      total,
      compatibility,
      issues,
      recommendations: [
        'Test on multiple devices and screen sizes',
        'Verify font loading on slow networks',
        'Check accessibility with screen readers',
        'Monitor Core Web Vitals in production'
      ]
    };
  }
}

// Export singleton
export const crossBrowserFontTester = new CrossBrowserFontTester();

// Auto-run cross-browser tests in development
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        try {
          crossBrowserFontTester.runCrossBrowserTests();
        } catch (error) {
          console.warn('Cross-browser font tests failed to run:', error);
        }
      }, 5000); // Run after basic font tests
    });
  }

  // Make tester available globally
  try {
    (window as any).crossBrowserFontTester = crossBrowserFontTester;
  } catch (error) {
    console.warn('Failed to expose crossBrowserFontTester globally:', error);
  }
} 