# GrainFlow - 사용자 맞춤형 잡곡 추천 챗봇

사용자의 건강 고민, 소화력, 알러지 정보 등을 대화를 통해 파악하고, 최적의 잡곡(Grain)과 비율을 추천해주는 AI 챗봇 애플리케이션입니다.

## 🛠 기술 스택 (Tech Stack)

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI/LLM**: OpenAI API (GPT-4 / MINI)
- **Database**: Firebase Firestore (참조 데이터 및 프롬프트 관리)
- **State Management**: React Hooks (useState, useReducer)
- **Deployment**: Vercel (Test 및 시연 용도) -> 추후 EC2 구축 예정

## ✨ 주요 기능 (Features)

1.  **AI 잡곡 추천 챗봇**:
    - 자연어 대화를 통해 사용자의 건강 상태(당뇨, 다이어트 등), 소화력, 선호 식감 등을 수집합니다.
    - 수집된 정보를 바탕으로 알고리즘 및 LLM을 활용하여 개인화된 잡곡 혼합 비율을 제안합니다.
    
2.  **실시간 정보 추출 (Information Extraction)**:
    - 대화 중 사용자의 핵심 정보를 실시간으로 구조화(JSON)하여 상태를 업데이트합니다.
    
3.  **프롬프트 관리자 (Prompt Manager)**:
    - `/manage` 경로를 통해 개발자가 논문 크롤링 후 성분 추출하여 DB 업데이트를 진행할 수 있습니다.
    
4.  **음성 인식 (STT)**:
    - Web Speech API를 활용한 음성 입력 기능을 지원합니다.

## 🚀 실행 방법 (Getting Started)

**사전 요구사항 (Prerequisites):** Node.js 18.17.0 이상

1.  **프로젝트 클론 및 이동**
    ```bash
    git clone [repository-url]
    cd grain-recommender-openai-custom
    ```

2.  **의존성 설치**
    ```bash
    npm install
    ```

3.  **환경 변수 설정**
    - 프로젝트 루트에 `.env.local` 파일을 생성하고 아래 내용을 입력하세요.

    ```env
    # OpenAI API Key (필수)
    OPENAI_API_KEY=sk-...

    # Firebase 설정 (선택 사항: 프롬프트 관리 및 DB 연동 시 필요)
    FIREBASE_PROJECT_ID=your-project-id
    FIREBASE_CLIENT_EMAIL=your-client-email
    FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
    ```

4.  **개발 서버 실행**
    ```bash
    npm run dev
    ```
    - 브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

## 🔑 환경 변수 가이드 (Environment Variables)

| 변수명 | 설명 | 필수 여부 |
| --- | --- | :---: |
| `OPENAI_API_KEY` | OpenAI API 호출을 위한 키입니다. | ✅ |
| `FIREBASE_PROJECT_ID` | Firebase 프로젝트 ID입니다. | ⚠️ |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin SDK용 클라이언트 이메일입니다. | ⚠️ |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin SDK용 비공개 키입니다. (`\n` 처리 주의) | ⚠️ |
