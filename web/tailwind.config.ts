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
        // globals.css에 정의된 CSS 변수와 매핑
        brand: {
          primary: 'var(--brand-primary)',       // 전체 배경 (흰색)
          secondary: 'var(--brand-secondary)',   // 서브 배경 (연회색)
          text: 'var(--brand-text)',             // 기본 텍스트 (짙은 회색)
          'text-muted': 'var(--brand-text-muted)', // 보조 텍스트 (연한 회색)
          accent: 'var(--brand-accent)',         // 포인트 (주황색)
          'accent-hover': 'var(--brand-accent-hover)', // 호버 색상
        },
        user: {
          bubble: 'var(--user-bubble)',          // 내 말풍선 (주황색)
          text: 'var(--user-text)',              // 내 말풍선 글씨 (흰색)
        },
        bot: {
          bubble: 'var(--bot-bubble)',           // 봇 말풍선 (연회색)
          text: 'var(--bot-text)',               // 봇 말풍선 글씨 (짙은 회색)
        }
      },
      boxShadow: {
        't-md': '0 -4px 6px -1px rgb(0 0 0 / 0.1), 0 -2px 4px -2px rgb(0 0 0 / 0.1)',
      }
    },
  },
  plugins: [],
}
export default config