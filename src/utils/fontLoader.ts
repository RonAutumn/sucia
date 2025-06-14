/**
 * Font Loading Utility for Progressive Font Loading
 * Implements CSS Font Loading API to optimize performance and prevent FOIT
 */

interface FontConfig {
  family: string;
  weight: string;
  style: string;
  display: string;
}

const BRAND_FONTS: FontConfig[] = [
  {
    family: 'Inter',
    weight: '400',
    style: 'normal',
    display: 'swap'
  },
  {
    family: 'Inter',
    weight: '500',
    style: 'normal',
    display: 'swap'
  },
  {
    family: 'Inter',
    weight: '600',
    style: 'normal',
    display: 'swap'
  },
  {
    family: 'Playfair Display',
    weight: '400',
    style: 'normal',
    display: 'swap'
  },
  {
    family: 'Playfair Display',
    weight: '600',
    style: 'normal',
    display: 'swap'
  }
];

class FontLoader {
  private loadedFonts = new Set<string>();
  private loadingPromises = new Map<string, Promise<FontFace>>();
  
  /**
   * Check if CSS Font Loading API is supported
   */
  private isSupported(): boolean {
    return 'fonts' in document && 'FontFace' in window;
  }

  /**
   * Generate a unique key for a font configuration
   */
  private getFontKey(family: string, weight: string, style: string): string {
    return `${family}-${weight}-${style}`;
  }

  /**
   * Check if font is available in document.fonts
   */
  private isFontAvailable(family: string, weight: string, style: string): boolean {
    if (!this.isSupported()) return false;
    
    // Check if font is already loaded in document.fonts
    const testString = 'abcdefghijklmnopqrstuvwxyz';
    return document.fonts.check(`${weight} 12px "${family}"`, testString);
  }

  /**
   * Wait for a font to be loaded via Google Fonts CSS
   */
  private async waitForFont(config: FontConfig): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('CSS Font Loading API not supported, falling back to CSS');
      return false;
    }

    const fontKey = this.getFontKey(config.family, config.weight, config.style);
    
    // Return true if font is already loaded
    if (this.loadedFonts.has(fontKey)) {
      return true;
    }

    // Check if font is already available
    if (this.isFontAvailable(config.family, config.weight, config.style)) {
      this.loadedFonts.add(fontKey);
      console.log(`✅ Font already available: ${config.family} ${config.weight}`);
      return true;
    }

    try {
      // Wait for font to load via document.fonts.ready or timeout
      const fontLoadPromise = document.fonts.load(`${config.weight} 12px "${config.family}"`);
      const timeoutPromise = new Promise<FontFace[]>((_, reject) => 
        setTimeout(() => reject(new Error('Font load timeout')), 3000)
      );

      await Promise.race([fontLoadPromise, timeoutPromise]);
      
      // Verify font is now available
      if (this.isFontAvailable(config.family, config.weight, config.style)) {
        this.loadedFonts.add(fontKey);
        console.log(`✅ Font loaded via CSS: ${config.family} ${config.weight}`);
        return true;
      } else {
        console.warn(`⚠️ Font not available after load: ${config.family} ${config.weight}`);
        return false;
      }

    } catch (error) {
      console.warn(`❌ Failed to wait for font: ${config.family} ${config.weight}`, error);
      return false;
    }
  }

  /**
   * Wait for critical fonts to load (Inter 400, Playfair 400)
   */
  async loadCriticalFonts(): Promise<void> {
    const criticalFonts = BRAND_FONTS.filter(font => 
      (font.family === 'Inter' && font.weight === '400') ||
      (font.family === 'Playfair Display' && font.weight === '400')
    );

    try {
      const loadPromises = criticalFonts.map(font => this.waitForFont(font));
      const results = await Promise.all(loadPromises);
      
      // Add font-loaded class to document for CSS targeting if any fonts loaded
      if (results.some(result => result)) {
        document.documentElement.classList.add('fonts-critical-loaded');
      }
      
    } catch (error) {
      console.warn('Some critical fonts failed to load:', error);
    }
  }

  /**
   * Wait for all brand fonts to load progressively
   */
  async loadAllFonts(): Promise<void> {
    try {
      const loadPromises = BRAND_FONTS.map(font => this.waitForFont(font));
      const results = await Promise.all(loadPromises);
      
      // Add font-loaded class to document for CSS targeting if any fonts loaded
      if (results.some(result => result)) {
        document.documentElement.classList.add('fonts-all-loaded');
      }
      
    } catch (error) {
      console.warn('Some fonts failed to load:', error);
    }
  }

  /**
   * Check font loading status
   */
  checkFontStatus(): void {
    BRAND_FONTS.forEach(font => {
      const fontKey = this.getFontKey(font.family, font.weight, font.style);
      const isLoaded = this.loadedFonts.has(fontKey);
      const isAvailable = this.isFontAvailable(font.family, font.weight, font.style);
      
      console.log(`📊 Font ${font.family} ${font.weight}: loaded=${isLoaded}, available=${isAvailable}`);
    });
  }

  /**
   * Initialize font loading with performance monitoring
   */
  async initialize(): Promise<void> {
    const startTime = performance.now();
    
    try {
      // Step 1: Check current font status
      this.checkFontStatus();
      
      // Step 2: Wait for critical fonts first
      await this.loadCriticalFonts();
      
      // Step 3: Load remaining fonts in background
      this.loadAllFonts(); // Don't await - load in background
      
      const loadTime = performance.now() - startTime;
      console.log(`🚀 Font loading initialized in ${loadTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('Font loading initialization failed:', error);
    }
  }

  /**
   * Get font loading status for debugging
   */
  getStatus(): { loaded: string[], loading: string[] } {
    return {
      loaded: Array.from(this.loadedFonts),
      loading: Array.from(this.loadingPromises.keys())
    };
  }
}

// Export singleton instance
export const fontLoader = new FontLoader();

// Auto-initialize when module loads (safely)
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      try {
        fontLoader.initialize();
      } catch (error) {
        console.warn('Font loader initialization failed:', error);
      }
    });
  } else {
    // Use setTimeout to ensure this runs after current execution stack
    setTimeout(() => {
      try {
        fontLoader.initialize();
      } catch (error) {
        console.warn('Font loader initialization failed:', error);
      }
    }, 0);
  }
} 