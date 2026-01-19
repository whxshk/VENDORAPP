/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255, 255, 255, 0.1)',
        input: 'rgba(30, 41, 59, 0.6)',
        ring: 'rgba(59, 130, 246, 0.5)',
        background: '#0c1829',
        foreground: '#f1f5f9',
        primary: {
          DEFAULT: '#3b82f6',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#9333ea',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: 'rgba(241, 245, 249, 0.6)',
          foreground: 'rgba(241, 245, 249, 0.8)',
        },
        accent: {
          DEFAULT: 'rgba(59, 130, 246, 0.1)',
          foreground: '#3b82f6',
        },
        card: {
          DEFAULT: 'rgba(30, 41, 59, 0.6)',
          foreground: '#f1f5f9',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      boxShadow: {
        glow: '0 0 30px rgba(59, 130, 246, 0.3)',
      },
    },
  },
  plugins: [],
}
