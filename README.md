# aiGrainMix

AI 기반 잡곡 추천/취사 연동 프로젝트입니다. 현재 운영 배포 기준은 **EC2**이며, `web(Next.js)` + `agent(FastAPI)` 2개 서비스 구조입니다.

## 디렉토리 구조

```text
aiGrainMix/
  web/      # 사용자 웹앱(Next.js)
  agent/    # AI/오케스트레이션 API(FastAPI)
  docs/     # 운영/배포 문서
```

## 로컬 실행

### 1) Agent API

```bash
cd agent
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn api.index:app --host 0.0.0.0 --port 8000
```

### 2) Web

```bash
cd web
npm install
npm run dev
```

## 배포

- EC2 배포 가이드는 [docs/DEPLOYMENT_EC2.md](docs/DEPLOYMENT_EC2.md) 참고
- 리포지토리 정리 기준은 [docs/REPO_STRUCTURE.md](docs/REPO_STRUCTURE.md) 참고
