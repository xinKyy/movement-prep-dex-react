/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dex-bg': '#0d0d0d',
        'dex-card': '#141414',
        'dex-border': '#1f1f1f',
        'dex-green': '#0ecb81',
        'dex-red': '#f6465d',
        'dex-yellow': '#f0b90b',
        'dex-cyan': '#00d4aa',
        'dex-text': '#eaecef',
        'dex-text-secondary': '#848e9c',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'SF Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}

