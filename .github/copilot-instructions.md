# aiGrainMix를 위한 AI 코딩 에이전트 지침

## 프로젝트 개요
aiGrainMix는 사용자의 건강 상태와 식감 선호도를 분석하여 연구 기반 영양 데이터를 사용하여 최적의 곡물 혼합을 제안하는 풀스택 AI 기반 곡물 추천 서비스입니다. 시스템은 각 곡물이 총 무게의 12%를 초과하지 않도록 보장하면서 곡물 무게를 분배하는 "워터폴 알고리즘"을 사용합니다.

## 아키텍처
- **프론트엔드**: Next.js 14 + TypeScript + Tailwind CSS (한국어 UI)
- **백엔드**: FastAPI + LangChain/LangGraph + OpenAI GPT-4o
- **데이터 흐름**: 사용자 설문/채팅 → LLM 처리 → 곡물 혼합 계산 → 추천 표시
- **주요 알고리즘**: 워터폴 분배는 어떤 곡물도 총 무게의 12%를 초과하지 않도록 보장합니다.

## 주요 워크플로우
- **개발**: `web/`에서 `npm run dev` 실행 (FastAPI의 :8000으로 `/api` 프록시)
- **백엔드**: `python agent/api/index.py` 또는 `uvicorn`을 실행하여 FastAPI 서버 시작
- **API 통합**: 프론트엔드가 `/api/chat` 및 `/api/survey/submit` 호출 (참조: `web/lib/apiClient.ts`)
- **음성 기능**: 한국어 음성 입력을 위한 `useVoiceRecognition` 훅 사용 (Web Speech API)

## 프로젝트별 패턴
- **상태 관리**: 채팅 흐름을 위한 `conversation_stage` 및 `survey_state`와 함께 `AppState` 사용 (참조: `web/lib/types.ts`)
- **LLM 통합**: 대화형 곡물 추천을 위한 LangGraph 상태 머신 (참조: `agent/api/routes/chat.py`)
- **데이터 모델**: 설문 데이터용 Pydantic `BaseModel`, 프론트엔드 상태용 TypeScript 인터페이스
- **한국어 현지화**: 모든 사용자 대면 문자열을 한국어로; 음성 인식에 `ko-KR` 사용
- **오류 처리**: API 호출 전에 설문 완성도 검증 (참조: `web/app/page.tsx`)
- **CORS**: 개발용으로 백엔드가 모든 출처 허용 (참조: `agent/api/index.py`)

## 코드 예시
- **설문 제출**: `apiClient.ts`의 `submitSurvey(formData)`가 구조화된 데이터를 `/api/survey/submit`으로 전송
- **채팅 흐름**: LangGraph 노드가 건강 목표, 식감 선호도를 추출한 후 추천 생성
- **무게 분배**: 워터폴 알고리즘이 곡물을 12%로 제한하고 초과분 재분배 (참조: `README.md` 공식)
- **컴포넌트 구조**: 채팅 컴포넌트 (`ChatWindow`, `MessageInput`)가 실시간 대화 상태 처리

## 규칙
- **임포트**: Next.js에서 `@/` 별칭을 사용한 절대 경로 (예: `@/lib/apiClient`)
- **API 응답**: Python 응답을 TypeScript 타입으로 매핑 (예: `ChatApiResponse`)
- **로깅**: 대화 흐름 디버깅을 위한 LangGraph에서 `add_log()` 사용
- **환경**: 백엔드에서 OpenAI API 키를 위한 `.env.local` 로드

## 의존성
- **프론트엔드**: 캐싱/지속성을 위한 `ai`, `openai`, `firebase`
- **백엔드**: `langchain-openai`, `langgraph`, `fastapi`, `uvicorn`
- **외부 서비스**: 추천용 OpenAI, 인증/데이터용 Firebase, 배포용 Vercel</content>
<parameter name="filePath">d:\dev\ai_grain\aiGrainMix\.github\copilot-instructions.md