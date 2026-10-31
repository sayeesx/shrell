/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Dark zone — header, category strip, hero banner */
        surface: {
          950: '#0B0D11',
          900: '#12161E',
          850: '#161B25',
          800: '#1A202C',
          750: '#212A3A',
          700: '#283244',
          600: '#3E4D65',
        },
        /* Light zone — page body, cards, content */
        canvas: {
          0:   '#FFFFFF',
          50:  '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
        },
        /* Pure red accent — replaces lime green */
        brand: {
          50:  '#FFF0F0',
          100: '#FFD6D6',
          200: '#FFB3B3',
          300: '#FF6666',
          400: '#FF2222',
          500: '#DC0000',
          600: '#B00000',
          700: '#8B0000',
          900: '#5A0000',
          950: '#330000',
        },
        ink: {
          900: '#111827',
          700: '#374151',
          500: '#6B7280',
          400: '#9CA3AF',
          300: '#D1D5DB',
        },
      },
      fontFamily: {
        sans: ['"Inter Tight"', 'sans-serif'],
        mono: ['"Inter Tight"', 'sans-serif'],
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
