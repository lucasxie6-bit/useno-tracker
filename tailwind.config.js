/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
      },
      colors: {
        // legacy palette (kept for compat)
        cream: '#FAF9F6',
        ink: '#2B2A28',
        muted: '#8A8780',
        sage: { 50: '#F2F6F1', 100: '#E2EBDF', 200: '#C8DBC3', 400: '#94BB8A', 600: '#5E8E55', 800: '#3E5F38' },
        clay: { 50: '#FBF1ED', 100: '#F5DCD2', 400: '#E0A48A', 600: '#C97B57', 800: '#8C4E32' },
        sky:  { 50: '#EFF5F8', 100: '#D9EAF0', 400: '#8FC2D6', 600: '#5594AC', 800: '#386577' },
        sand: { 50: '#FAF6EE', 100: '#F2E9D6', 400: '#DDC18A', 600: '#BB9658', 800: '#7D633A' },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
        card: '0 2px 8px rgba(0,0,0,0.05)',
        lift: '0 8px 24px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
};
