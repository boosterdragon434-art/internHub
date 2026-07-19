/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6', // Primary
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        accent: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24', // Accent/CTA
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        brand: {
          50: '#f4f4f7',
          100: '#e1e1e9',
          200: '#c5c5d3',
          300: '#a0a0b6',
          400: '#757591',
          500: '#525270',
          600: '#3f3f59',
          700: '#303046',
          800: '#27273b', // Muted
          900: '#1e1e32', // Surface
          950: '#0f0f23', // Background
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
