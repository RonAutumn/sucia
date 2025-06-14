/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Primary brand font stack - Bright, friendly queer aesthetic with excellent readability
        sans: [
          'Poppins',
          'Inter',
          'Nunito',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        // Display font stack - Playful, bold, perfect for pride events and queer celebrations
        display: [
          'Fredoka One',
          'Comfortaa',
          'Nunito',
          'Poppins',
          'Helvetica Neue',
          'Arial',
          'sans-serif'
        ],
        // Accent font for special elements - Modern, inclusive monospace
        accent: [
          'JetBrains Mono',
          'Fira Code',
          'SF Mono',
          'Consolas',
          'Menlo',
          'Monaco',
          'Courier New',
          'monospace'
        ]
      },
      colors: {
        // Primary brand colors - electric magenta/hot pink (Sucia's signature)
        // Now also available as CSS custom properties for dynamic theming
        primary: {
          50: 'rgb(var(--color-primary-50) / <alpha-value>)',
          100: 'rgb(var(--color-primary-100) / <alpha-value>)',
          200: 'rgb(var(--color-primary-200) / <alpha-value>)',
          300: 'rgb(var(--color-primary-300) / <alpha-value>)',
          400: 'rgb(var(--color-primary-400) / <alpha-value>)',
          500: 'rgb(var(--color-primary-500) / <alpha-value>)',
          600: 'rgb(var(--color-primary-600) / <alpha-value>)',
          700: 'rgb(var(--color-primary-700) / <alpha-value>)',
          800: 'rgb(var(--color-primary-800) / <alpha-value>)',
          900: 'rgb(var(--color-primary-900) / <alpha-value>)',
          950: 'rgb(var(--color-primary-950) / <alpha-value>)',
        },
        // Secondary brand colors - desert earth tones (Latinx heritage nods)
        secondary: {
          50: 'rgb(var(--color-secondary-50) / <alpha-value>)',
          100: 'rgb(var(--color-secondary-100) / <alpha-value>)',
          200: 'rgb(var(--color-secondary-200) / <alpha-value>)',
          300: 'rgb(var(--color-secondary-300) / <alpha-value>)',
          400: 'rgb(var(--color-secondary-400) / <alpha-value>)',
          500: 'rgb(var(--color-secondary-500) / <alpha-value>)',
          600: 'rgb(var(--color-secondary-600) / <alpha-value>)',
          700: 'rgb(var(--color-secondary-700) / <alpha-value>)',
          800: 'rgb(var(--color-secondary-800) / <alpha-value>)',
          900: 'rgb(var(--color-secondary-900) / <alpha-value>)',
          950: 'rgb(var(--color-secondary-950) / <alpha-value>)',
        },
        // Accent colors - neon green (digital glitch effects)
        accent: {
          50: 'rgb(var(--color-accent-50) / <alpha-value>)',
          100: 'rgb(var(--color-accent-100) / <alpha-value>)',
          200: 'rgb(var(--color-accent-200) / <alpha-value>)',
          300: 'rgb(var(--color-accent-300) / <alpha-value>)',
          400: 'rgb(var(--color-accent-400) / <alpha-value>)',
          500: 'rgb(var(--color-accent-500) / <alpha-value>)',
          600: 'rgb(var(--color-accent-600) / <alpha-value>)',
          700: 'rgb(var(--color-accent-700) / <alpha-value>)',
          800: 'rgb(var(--color-accent-800) / <alpha-value>)',
          900: 'rgb(var(--color-accent-900) / <alpha-value>)',
          950: 'rgb(var(--color-accent-950) / <alpha-value>)',
        },
        // Cyan highlights - for club lighting effects
        cyan: {
          50: 'rgb(var(--color-cyan-50) / <alpha-value>)',
          100: 'rgb(var(--color-cyan-100) / <alpha-value>)',
          200: 'rgb(var(--color-cyan-200) / <alpha-value>)',
          300: 'rgb(var(--color-cyan-300) / <alpha-value>)',
          400: 'rgb(var(--color-cyan-400) / <alpha-value>)',
          500: 'rgb(var(--color-cyan-500) / <alpha-value>)',
          600: 'rgb(var(--color-cyan-600) / <alpha-value>)',
          700: 'rgb(var(--color-cyan-700) / <alpha-value>)',
          800: 'rgb(var(--color-cyan-800) / <alpha-value>)',
          900: 'rgb(var(--color-cyan-900) / <alpha-value>)',
          950: 'rgb(var(--color-cyan-950) / <alpha-value>)',
        },
        // Neutral colors - warm grays for better visual hierarchy
        neutral: {
          50: 'rgb(var(--color-neutral-50) / <alpha-value>)',
          100: 'rgb(var(--color-neutral-100) / <alpha-value>)',
          200: 'rgb(var(--color-neutral-200) / <alpha-value>)',
          300: 'rgb(var(--color-neutral-300) / <alpha-value>)',
          400: 'rgb(var(--color-neutral-400) / <alpha-value>)',
          500: 'rgb(var(--color-neutral-500) / <alpha-value>)',
          600: 'rgb(var(--color-neutral-600) / <alpha-value>)',
          700: 'rgb(var(--color-neutral-700) / <alpha-value>)',
          800: 'rgb(var(--color-neutral-800) / <alpha-value>)',
          900: 'rgb(var(--color-neutral-900) / <alpha-value>)',
          950: 'rgb(var(--color-neutral-950) / <alpha-value>)',
        },
        // Semantic colors for status and feedback
        success: {
          50: 'rgb(var(--color-success-50) / <alpha-value>)',
          100: 'rgb(var(--color-success-100) / <alpha-value>)',
          200: 'rgb(var(--color-success-200) / <alpha-value>)',
          300: 'rgb(var(--color-success-300) / <alpha-value>)',
          400: 'rgb(var(--color-success-400) / <alpha-value>)',
          500: 'rgb(var(--color-success-500) / <alpha-value>)',
          600: 'rgb(var(--color-success-600) / <alpha-value>)',
          700: 'rgb(var(--color-success-700) / <alpha-value>)',
          800: 'rgb(var(--color-success-800) / <alpha-value>)',
          900: 'rgb(var(--color-success-900) / <alpha-value>)',
          950: 'rgb(var(--color-success-950) / <alpha-value>)',
        },
        warning: {
          50: 'rgb(var(--color-warning-50) / <alpha-value>)',
          100: 'rgb(var(--color-warning-100) / <alpha-value>)',
          200: 'rgb(var(--color-warning-200) / <alpha-value>)',
          300: 'rgb(var(--color-warning-300) / <alpha-value>)',
          400: 'rgb(var(--color-warning-400) / <alpha-value>)',
          500: 'rgb(var(--color-warning-500) / <alpha-value>)',
          600: 'rgb(var(--color-warning-600) / <alpha-value>)',
          700: 'rgb(var(--color-warning-700) / <alpha-value>)',
          800: 'rgb(var(--color-warning-800) / <alpha-value>)',
          900: 'rgb(var(--color-warning-900) / <alpha-value>)',
          950: 'rgb(var(--color-warning-950) / <alpha-value>)',
        },
        error: {
          50: 'rgb(var(--color-error-50) / <alpha-value>)',
          100: 'rgb(var(--color-error-100) / <alpha-value>)',
          200: 'rgb(var(--color-error-200) / <alpha-value>)',
          300: 'rgb(var(--color-error-300) / <alpha-value>)',
          400: 'rgb(var(--color-error-400) / <alpha-value>)',
          500: 'rgb(var(--color-error-500) / <alpha-value>)',
          600: 'rgb(var(--color-error-600) / <alpha-value>)',
          700: 'rgb(var(--color-error-700) / <alpha-value>)',
          800: 'rgb(var(--color-error-800) / <alpha-value>)',
          900: 'rgb(var(--color-error-900) / <alpha-value>)',
          950: 'rgb(var(--color-error-950) / <alpha-value>)',
        },
        info: {
          50: 'rgb(var(--color-info-50) / <alpha-value>)',
          100: 'rgb(var(--color-info-100) / <alpha-value>)',
          200: 'rgb(var(--color-info-200) / <alpha-value>)',
          300: 'rgb(var(--color-info-300) / <alpha-value>)',
          400: 'rgb(var(--color-info-400) / <alpha-value>)',
          500: 'rgb(var(--color-info-500) / <alpha-value>)',
          600: 'rgb(var(--color-info-600) / <alpha-value>)',
          700: 'rgb(var(--color-info-700) / <alpha-value>)',
          800: 'rgb(var(--color-info-800) / <alpha-value>)',
          900: 'rgb(var(--color-info-900) / <alpha-value>)',
          950: 'rgb(var(--color-info-950) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
} 