export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0a0e0d',
          card: '#141918',
          'card-hover': '#1a2220',
          border: 'rgba(45, 212, 168, 0.1)'
        },
        emerald: {
          DEFAULT: '#2dd4a8',
          light: '#3fefbf'
        },
        gold: {
          DEFAULT: '#d4a72c',
          light: '#f5c842'
        },
        text: {
          primary: '#e8f2ed',
          secondary: '#98b5a6',
          muted: '#607a6c'
        }
      },
      fontFamily: {
        display: ['Crimson Pro', 'serif'],
        body: ['Outfit', 'sans-serif']
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #2dd4a8 0%, #d4a72c 100%)',
        'gradient-emerald': 'linear-gradient(135deg, #2dd4a8 0%, #26b893 100%)',
        'gradient-gold': 'linear-gradient(135deg, #d4a72c 0%, #f5c842 100%)',
        'gradient-text': 'linear-gradient(135deg, #e8f2ed 0%, #98b5a6 100%)'
      },
      boxShadow: {
        'card': '0 12px 32px rgba(0, 0, 0, 0.3)',
        'button': '0 4px 16px rgba(45, 212, 168, 0.2)',
        'button-gold': '0 8px 24px rgba(212, 167, 44, 0.3)'
      }
    },
  },
  plugins: [],
}