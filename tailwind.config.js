/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Crimson-to-black surface system */
        surface: {
          950: '#080000', // near-black
          900: '#0A0808', // charcoal black (dominant background)
          850: '#120E0F', // deep card surface
          800: '#1A1214', // card base & border
          750: '#261619', // elevated border
          700: '#361B20', // subtle crimson border
          600: '#4F242C', // highlight border
        },
        /* Warm off-white contrast panels & typography */
        canvas: {
          0:   '#F1EEEE', // warm off-white
          50:  '#E5E0E0',
          100: '#D8D1D1',
          200: '#B8B0B1',
          300: '#968E8F',
          400: '#706869',
          500: '#4C4546',
        },
        /* Signature crimson gradient system */
        brand: {
          50:  '#FFF0F1',
          100: '#FFE0E2',
          200: '#FFB3B7',
          300: '#FF666E',
          400: '#FF2E3A',
          500: '#FF000E', // vivid red (signature accent)
          600: '#E0000C', // deep crimson
          700: '#B0000A', // dark blood red
          800: '#850009',
          900: '#650008', // burgundy crimson
          950: '#080000', // near-black
        },
        ink: {
          900: '#0A0808',
          700: '#221A1C',
          500: '#5C5456',
          400: '#8E8587',
          300: '#C4BCBD',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Sans"', 'monospace'],
      },
      boxShadow: {
        none: 'none',
      },
    },
  },
  plugins: [],
};
