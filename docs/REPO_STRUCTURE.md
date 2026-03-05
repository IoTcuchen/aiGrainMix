# Repository Structure Rules

## 목적

운영 배포(E C2) 기준으로 리포지토리를 작고 명확하게 유지합니다.

## 유지 대상

- `web/`: 서비스 코드, 필수 설정
- `agent/`: API 코드, 필수 데이터(`agent/data/*.csv`)
- `docs/`: 운영/아키텍처 문서

## 커밋 금지 대상

- 빌드 산출물: `.next/`, `out/`, `dist/`
- 의존성 디렉토리: `node_modules/`, `.venv/`, `venv/`
- 캐시/임시: `__pycache__/`, `*.tsbuildinfo`, `*.log`
- 분석 리포트 임시 파일: `ts_prune_results.txt`, `unimported_results*.txt`

## 정리 원칙

1. 배포와 무관한 테스트/임시 파일은 커밋하지 않음
2. 런타임 설정은 `.env`로 분리, 예시는 `.env.example`만 추적
3. 배포 방식 변경 시(`Vercel` -> `EC2`) 불필요 설정 파일 제거
