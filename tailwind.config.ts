import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from design system
        brand: {
          blue: '#2563EB',
          purple: '#7C3AED',
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
        },
        // Canvas element colors
        sticky: {
          yellow: '#FEF3C7',
          blue: '#DBEAFE',
          green: '#D1FAE5',
          pink: '#FCE7F3',
          purple: '#E9D5FF',
          orange: '#FED7AA',
          red: '#FEE2E2',
          gray: '#F3F4F6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'Monaco', 'Cascadia Code', 'Roboto Mono', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in': 'slideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'pulse-glow': 'pulseGlow 0.6s ease-out',
        'typing': 'typing 1.4s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0.4)' },
          '70%': { boxShadow: '0 0 0 4px rgba(37, 99, 235, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(37, 99, 235, 0)' },
        },
        typing: {
          '0%, 60%, 100%': { transform: 'translateY(0)' },
          '30%': { transform: 'translateY(-10px)' },
        },
      },
      boxShadow: {
        'glow': '0 0 20px rgba(37, 99, 235, 0.3)',
        'element': '0 2px 8px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}

export default config