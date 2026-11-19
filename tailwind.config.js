/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        glass:
          'inset 0 1px 1px rgba(255,255,255,0.2), 0 10px 40px -10px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.2)',
        orb: '0 8px 30px -4px rgba(255,255,255,0.35), inset 0 1px 1px rgba(255,255,255,0.9)',
      },
    },
  },
  plugins: [],
};
