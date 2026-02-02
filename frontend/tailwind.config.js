import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        terracotta: {
          50: '#fdf5f3',
          100: '#fce8e4',
          200: '#fad5cd',
          300: '#f5b8aa',
          400: '#ed8f79',
          500: '#e16b4d',
          600: '#c9503a',
          700: '#a8402e',
          800: '#8b382a',
          900: '#743328',
        },
        sage: {
          50: '#f6f7f4',
          100: '#e3e7dd',
          200: '#c8d0be',
          300: '#a6b396',
          400: '#859574',
          500: '#687858',
          600: '#515f44',
          700: '#414b38',
          800: '#363e30',
          900: '#2f352a',
        },
        sand: {
          50: '#fdfcf9',
          100: '#f9f6ed',
          200: '#f2ead8',
          300: '#e8d9bb',
          400: '#dcc49a',
          500: '#cfab78',
          600: '#c19660',
          700: '#a17a4d',
          800: '#836344',
          900: '#6c523b',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
      },
      keyframes: {
        kenburns: {
          '0%': { 
            transform: 'scale(1) translate(var(--start-x), var(--start-y))' 
          },
          '100%': { 
            transform: 'scale(1.25) translate(var(--end-x), var(--end-y))' 
          },
        },
      },
      animation: {
        kenburns: 'kenburns 10s ease-in-out forwards',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: ["bumblebee"],
  },
};


