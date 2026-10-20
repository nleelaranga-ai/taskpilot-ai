/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        alexa: {
          blue: '#00CAFF',
          dark: '#0e1e2d',
          accent: '#1e3a5f',
          glow: '#00a3ff',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00CAFF, 0 0 10px #00CAFF' },
          '100%': { boxShadow: '0 0 20px #00CAFF, 0 0 30px #00a3ff' },
        },
      },
    },
  },
  plugins: [],
};
