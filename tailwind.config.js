/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Warm paper-and-ink palette; every surface is defined for both themes
        // in index.css via CSS variables, these are the accent ramps.
        ink: {
          50: '#f7f6f3',
          100: '#eeece6',
          200: '#dcd8cd',
          300: '#c0baa9',
          400: '#9c9484',
          500: '#7c7466',
          600: '#615a4f',
          700: '#4a4640',
          800: '#302e2a',
          900: '#1c1b19',
          950: '#121110',
        },
        accent: {
          50: '#eef6ff',
          100: '#d9ecff',
          200: '#bcdcff',
          300: '#8ec6ff',
          400: '#59a5ff',
          500: '#3282f6',
          600: '#1e64db',
          700: '#1a4fb0',
          800: '#1b448c',
          900: '#1b3c6f',
        },
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(-6px) scale(0.985)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        'slide-up': 'slide-up 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
