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
        serif: ['system-ui', '-apple-system', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
