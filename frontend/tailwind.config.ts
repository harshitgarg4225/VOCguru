import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Wine color
        wine: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#f9d2da',
          300: '#f4aebb',
          400: '#ec7f96',
          500: '#df5273',
          600: '#c93359',
          700: '#a92648',
          800: '#8c2341',
          900: '#4C1C24', // Primary Wine
          950: '#2d0f14',
        },
        // Accent Levi's Red
        accent: {
          50: '#fff1f1',
          100: '#ffe1e1',
          200: '#ffc7c7',
          300: '#ffa0a0',
          400: '#ff6868',
          500: '#f83b3b',
          600: '#C90016', // Primary Accent
          700: '#a00012',
          800: '#840214',
          900: '#6e0818',
          950: '#3c0007',
        },
        // Text Black
        ink: '#131313',
        // Canvas off-white
        canvas: '#F4F4F4',
      },
      fontFamily: {
        oswald: ['Oswald', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(19, 19, 19, 0.08)',
        'card-hover': '0 4px 16px rgba(19, 19, 19, 0.12)',
        'elevated': '0 8px 24px rgba(19, 19, 19, 0.15)',
      },
    },
  },
  plugins: [],
}
export default config

