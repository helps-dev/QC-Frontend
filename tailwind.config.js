/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        atlantis: {
          950: '#050714',
          900: '#0a0d1f',
          800: '#111631',
          700: '#1a2044',
          600: '#252d5a',
          500: '#323d70',
        },
        primary: {
          400: '#22d3ee',
          500: '#00d4ff',
          600: '#0099ff',
        },
        secondary: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        promo: {
          yellow: '#f59e0b',
          orange: '#fb923c',
          pink: '#ec4899',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 212, 255, 0.3)',
        'glow-lg': '0 0 40px rgba(0, 212, 255, 0.4)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.3)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #00d4ff 0%, #5a67d8 50%, #8b5cf6 100%)',
        'gradient-button': 'linear-gradient(135deg, #00d4ff 0%, #5a67d8 100%)',
        'gradient-promo-yellow': 'linear-gradient(135deg, #f59e0b 0%, #fb923c 100%)',
        'gradient-promo-pink': 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.3)' },
          '50%': { boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
