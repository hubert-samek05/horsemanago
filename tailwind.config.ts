import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        deepNavy: '#0B1F33',
        midnightBlue: '#102A43',
        oceanBlue: '#1D4E6E',
        marineBlue: '#295D7A',
        steelBlue: '#3C708C',
        slateBlue: '#4D7E98',
        blueGray: '#6B90A8',
        mistBlue: '#A9C2D4',
        iceBlue: '#D8EAF3',
        arcticBlue: '#EEF7FB',
        pureWhite: '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      animation: {
        'fadeIn': 'fadeIn 1s ease-in-out',
        'slideUp': 'slideUp 1s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
