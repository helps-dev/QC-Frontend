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
          950: '#050508',
          900: '#0a0a0f',
          800: '#111118',
          700: '#18181f',
          600: '#222230',
          500: '#2d2d3d',
        },
        primary: {
          300: '#ff8a80',
          400: '#ff6b6b',
          500: '#ff4757',
          600: '#e8384f',
          700: '#c0392b',
        },
        secondary: {
          400: '#ffa502',
          500: '#ff6348',
          600: '#e55039',
        },
        accent: {
          green: '#2ed573',
          red: '#ff4757',
          yellow: '#ffa502',
          blue: '#1e90ff',
          coral: '#ff6348',
        },
        mexa: {
          50: '#fff5f5',
          100: '#ffe0e0',
          200: '#ffb3b3',
          300: '#ff8080',
          400: '#ff4d4d',
          500: '#ff2d2d',
          600: '#e60000',
          700: '#b30000',
          800: '#800000',
          900: '#4d0000',
        }
      },
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(255, 71, 87, 0.3)',
        'glow-lg': '0 0 40px rgba(255, 71, 87, 0.4)',
        'glow-red': '0 0 30px rgba(255, 71, 87, 0.25)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.5)',
        'card-hover': '0 8px 32px rgba(0, 0, 0, 0.6)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-primary': 'linear-gradient(135deg, #ff4757 0%, #ff6348 100%)',
        'gradient-button': 'linear-gradient(135deg, #ff4757 0%, #ff6348 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0a0a0f 0%, #050508 100%)',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 71, 87, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(255, 71, 87, 0.4)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
