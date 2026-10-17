/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Apple-style neutral grays
        glass: {
          50: '#fafafa',
          100: '#f5f5f5',
          200: '#e5e5e5',
          300: '#d4d4d4',
          400: '#a3a3a3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
          950: '#0a0a0a',
        },
        // Accent — cool teal/emerald for CTAs
        accent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // Keep brand for backward compat but shift to teal
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
        // Keep cream for reader themes
        cream: {
          50: '#FFFFFF',
          100: '#fafaf9',
          200: '#f5f5f4',
          300: '#e7e5e4',
          400: '#d6d3d1',
        },
      },
      fontFamily: {
        serif: ['Literata', 'Lora', 'Georgia', 'serif'],
        sans: ['"SF Pro Display"', '"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        soft: '0 4px 20px -2px rgba(0,0,0,0.08)',
        card: '0 2px 12px 0 rgba(0,0,0,0.06)',
        glow: '0 0 60px 10px rgba(20,184,166,0.12)',
        'glow-top': '0 -40px 80px -10px rgba(20,184,166,0.10)',
        'glow-bottom': '0 40px 80px -10px rgba(20,184,166,0.10)',
        'glass': '0 8px 32px 0 rgba(0,0,0,0.12)',
        'glass-sm': '0 4px 16px 0 rgba(0,0,0,0.08)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 4s ease-in-out infinite',
        'slide-up': 'slide-up 0.5s cubic-bezier(0.16,1,0.3,1)',
        'fade-in': 'fade-in 0.4s ease-out',
        'phone-rotate': 'phone-rotate 20s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'phone-rotate': {
          '0%, 100%': { transform: 'perspective(1200px) rotateY(-15deg) rotateX(5deg)' },
          '50%': { transform: 'perspective(1200px) rotateY(15deg) rotateX(-5deg)' },
        },
      },
    },
  },
  plugins: [],
};
