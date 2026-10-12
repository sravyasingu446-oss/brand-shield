/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A12',
          900: '#0B1120',
          850: '#0E172B',
          800: '#131F37',
          700: '#1E2E4E',
          600: '#2A3F68',
        },
        shield: {
          orange: '#FF6B00',
          'orange-glow': '#FF8A3D',
          cyan: '#00D4FF',
          blue: '#1E88E5',
          danger: '#FF334B',
          warning: '#FFB800',
          success: '#00E676',
        }
      },
      boxShadow: {
        'glow-orange': '0 0 20px rgba(255, 107, 0, 0.25)',
        'glow-cyan': '0 0 20px rgba(0, 212, 255, 0.25)',
        'glow-danger': '0 0 20px rgba(255, 51, 75, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
