import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#0d9488',
        navy: '#0d9488',
        cream: '#f4f6f9',
        card: '#ffffff',
        accent: '#0d9488',
        free: '#15803d',
        occupied: '#d97706',
        expiring: '#dc2626',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'ui-serif', 'Georgia', 'serif'],
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15,23,42,0.04), 0 8px 24px -12px rgba(15,23,42,0.10)',
        card: '0 1px 3px rgba(15,23,42,0.06), 0 12px 32px -16px rgba(15,23,42,0.14)',
      },
    },
  },
  plugins: [],
};

export default config;
