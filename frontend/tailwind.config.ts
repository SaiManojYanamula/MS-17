import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sidebar: '#241d1b',
        navy: '#241d1b',
        cream: '#f4f6f9',
        card: '#ffffff',
        accent: '#7c2d43',
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
