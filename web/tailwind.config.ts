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
        brand: {
          primary: 'var(--brand-primary)',
          secondary: 'var(--brand-secondary)',
          surface: 'var(--brand-surface)',
          border: 'var(--brand-border)',
          text: 'var(--brand-text)',
          'text-muted': 'var(--brand-text-muted)',
          accent: 'var(--brand-accent)',
          'accent-hover': 'var(--brand-accent-hover)',
        },
        user: {
          bubble: 'var(--user-bubble)',
          text: 'var(--user-text)',
        },
        bot: {
          bubble: 'var(--bot-bubble)',
          text: 'var(--bot-text)',
        },
      },
      boxShadow: {
        't-md': '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
      },
    },
  },
  plugins: [],
}

export default config
