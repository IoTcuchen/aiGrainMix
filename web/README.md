# Web (Next.js)

사용자 UI와 API 프록시 라우트를 담당합니다.

## 실행

```bash
npm install
npm run dev
```

## 운영 기준

- Vercel 전용 설정은 제거했습니다.
- EC2/Nginx 뒤에서 Node 프로세스로 실행하는 구조를 기준으로 유지합니다.
- Python Agent는 기본 `http://127.0.0.1:8000` 기준 프록시합니다.

## 환경 변수

- `PYTHON_API_BASE_URL` (optional, 기본값 `http://127.0.0.1:8000`)
- `HF_TOKEN`
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`(optional)
