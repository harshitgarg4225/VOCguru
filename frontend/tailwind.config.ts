import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Deep Aqua
        aqua: {
          50: '#e6feff',
          100: '#ccfcfe',
          200: '#99f9fd',
          300: '#66f5fb',
          400: '#33f1fa',
          500: '#00eef9',
          600: '#00c4ce',
          700: '#009aa3',
          800: '#006f77',
          900: '#004549', // Very deep aqua - primary brand color
          950: '#002a2d',
        },
        // Neutral grays
        slate: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
        // Keep accent for critical/important items
        accent: {
          50: '#e6feff',
          100: '#ccfcfe',
          200: '#99f9fd',
          300: '#66f5fb',
          400: '#33f1fa',
          500: '#00eef9',
          600: '#00c4ce', // Bright aqua accent
          700: '#009aa3',
          800: '#006f77',
          900: '#004549',
          950: '#002a2d',
        },
        // Status colors
        success: {
          50: '#f0fdf4',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          50: '#fef2f2',
          500: '#ef4444',
          600: '#dc2626',
        },
        // Text/Background
        ink: '#09090b',
        canvas: '#fafafa',
        surface: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
        'elevated': '0 10px 40px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 20px rgba(0, 238, 249, 0.3)',
        'glow-strong': '0 0 40px rgba(0, 238, 249, 0.5)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 238, 249, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 238, 249, 0.5)' },
        },
      },
    },
  },
  plugins: [],
}
export default config
