import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Pretendard"', 'sans-serif'],
      },
      colors: {
        'brand-primary': '#111827', // gray-900
        'brand-secondary': '#1F2937', // gray-800
        'brand-text': '#F9FAFB', // gray-50
        'brand-accent': '#9CA3AF', // gray-400
        'user-bubble': '#F97316', // orange-500
        'bot-bubble': '#374151', // gray-700
      },
      boxShadow: {
        't-md': '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
export default config
