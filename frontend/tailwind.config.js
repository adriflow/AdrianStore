/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        leaf: {
          50: '#f2f9ec',
          100: '#e1f1d4',
          200: '#c5e4ab',
          300: '#9fd278',
          400: '#7cb342',
          500: '#5d9630',
          600: '#467722',
          700: '#385b1e',
          800: '#2e491d',
          900: '#283e1c',
        },
        cream: '#f6f8f1',
        mist: '#eef4e7',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 40px -24px rgba(13, 36, 24, 0.18)',
        lift: '0 28px 60px -24px rgba(13, 36, 24, 0.3)',
      },
      keyframes: {
        floaty: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseRing: {
          '0%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.45)' },
          '70%': { boxShadow: '0 0 0 18px rgba(37, 211, 102, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' },
        },
      },
      animation: {
        floaty: 'floaty 6s ease-in-out infinite',
        'pulse-ring': 'pulseRing 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
};
