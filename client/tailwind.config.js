/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      keyframes: { fadeIn: { '0%': { opacity: 0 }, '100%': { opacity: 1 } } },
      animation: { fadeIn: 'fadeIn 0.2s ease' },
      fontFamily: { sans: ['Geist', 'system-ui', 'sans-serif'], mono: ['Geist Mono', 'monospace'] }
    },
  },
  plugins: [],
}

