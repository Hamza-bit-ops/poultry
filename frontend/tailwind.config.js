/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a5f',
          900: '#0f172a',
        },
      },
    },
  },
  plugins: [],
};
