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
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Primary Sky
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316', // Accent Orange
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
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
        // Dark OLED surface scale from design-system/internhub/MASTER.md
        // (Background #0F0F23, Muted #27273B). Purple primary (#8B5CF6) and
        // gold accent (#FBBF24) aren't duplicated here — they're exactly
        // Tailwind's built-in violet-500 and amber-400, so violet-*/amber-*
        // are used directly wherever the new pages need them.
        ink: {
          50: '#f4f4fa',
          100: '#e8e8f5',
          200: '#c6c6e0',
          300: '#a3a3ca',
          400: '#6e6e9a',
          500: '#4a4a72',
          600: '#35354f',
          700: '#27273B',
          800: '#1c1c30',
          850: '#161628',
          900: '#131324',
          950: '#0F0F23',
        },
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        serif: ['"Instrument Serif"', 'Georgia', 'serif'],
        // InternHub "Bento/Terminal" identity (design-system/internhub/MASTER.md).
        // Added alongside the existing families above — nothing here overrides
        // font-sans/font-display, so pages that don't opt in are unaffected.
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'glow-iris': '0 0 50px -12px rgba(139, 92, 246, 0.5)',
        'glow-iris-sm': '0 0 25px -8px rgba(139, 92, 246, 0.4)',
        'glow-gold': '0 0 40px -10px rgba(251, 191, 36, 0.45)',
      },
      animation: {
        blink: 'blink 1.1s step-end infinite',
      },
      keyframes: {
        blink: { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } },
      },
    },
  },
  plugins: [],
}
