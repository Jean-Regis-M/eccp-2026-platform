/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        equity: {
          red: '#C8102E',
          dark: '#0F172A',
          navy: '#1E293B',
          gold: '#D4A843',
          light: '#F1F5F9',
          slate: '#64748B',
        },
      },
      backgroundImage: {
        'mesh': 'radial-gradient(at 40% 20%, rgba(200,16,46,0.08) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(30,41,59,0.06) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(212,168,67,0.06) 0px, transparent 50%)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
