/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#F0F7F4',
          100: '#DDEFEA',
          200: '#BDDFD5',
          500: '#2E6F5E', // Основной изумрудно-зеленый цвет кнопок
          600: '#265C4E',
          700: '#1F4A3F',
          800: '#17372F',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FAF6F0', // Основной теплый фон
          200: '#F5EBE1', // Карточки и подложки
          300: '#EADFCF', // Границы
          400: '#D5C4AF',
        },
        tale: {
          night: '#1C1917',
          darkCard: '#292524',
          gold: '#F59E0B',
          softGold: '#FEF3C7',
          coral: '#F97316',
          purple: '#8B5CF6',
        },
      },
      fontFamily: {
        serif: ['Literata', 'Lora', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(46, 111, 94, 0.08)',
        card: '0 2px 12px 0 rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
