/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FD2062',
          50: '#ffe5ed',
          100: '#ffccdb',
          200: '#ff99b8',
          300: '#ff6694',
          400: '#ff3371',
          500: '#fd2062',
          600: '#ca1a4e',
          700: '#98133b',
          800: '#650d27',
          900: '#330614',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'shine': 'shine 3s infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        shine: {
          '0%': { left: '-100%', opacity: '0' },
          '20%': { opacity: '1' },
          '50%, 100%': { left: '200%', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
