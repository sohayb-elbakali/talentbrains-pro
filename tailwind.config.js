/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a66c2', // LinkedIn blue
          hover: '#004182',
          light: '#e8f4f9',
        },
        secondary: {
          DEFAULT: '#f97316', // Orange
          hover: '#ea580c',
          light: '#ffedd5',
        }
      }
    },
  },
  plugins: [],
};
