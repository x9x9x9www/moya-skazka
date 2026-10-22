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
          300: '#7EBAAA',
          400: '#3D8B74',
          500: '#1F5F4E', // Глубокий сказочный изумруд
          600: '#1A5042',
          700: '#154136',
          800: '#0F2F27',
          900: '#0A201A',
        },
        'moon-gold': {
          DEFAULT: '#F3B755',
          50: '#FDF9F2',
          100: '#FAF0DE',
          200: '#F6DFB7',
          300: '#F3B755',
          400: '#E5A53F',
          500: '#D4922A',
        },
        'powder-peach': {
          DEFAULT: '#FCEEE5',
          100: '#FAF3ED',
          200: '#FCEEE5',
          300: '#F8DCCB',
        },
        cream: {
          50: '#FFFFFF',
          100: '#FAF6F0', // Основной теплый фон
          200: '#F5EBE1', // Карточки и подложки
          300: '#EADFCF', // Границы
          400: '#D5C4AF',
        },
        tale: {
          night: '#16192E',
          darkCard: '#1E2238',
          gold: '#F3B755',
          softGold: '#FEF3C7',
          emerald: '#1F5F4E',
          peach: '#FCEEE5',
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
      backgroundImage: {
        'night-sky': 'linear-gradient(135deg, #16192E 0%, #0F172A 100%)',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(31, 95, 78, 0.08)',
        card: '0 2px 12px 0 rgba(0, 0, 0, 0.04)',
        'glow-gold': '0 8px 32px -4px rgba(243, 183, 85, 0.25)',
        'glow-fairy': '0 12px 40px -8px rgba(31, 95, 78, 0.2)',
        'inner-paper': 'inset 0 2px 4px rgba(0, 0, 0, 0.03)',
      },
    },
  },
  plugins: [],
};
