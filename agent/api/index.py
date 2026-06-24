import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")

from api.routes import chat, survey, cooking
# from api.routes import manager_chat  # 통계 기능 임시 비활성화 (DB 터널/연결 정리 후 복구)

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록 (조립)
app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])
app.include_router(survey.router, prefix="/api/survey", tags=["Survey"])
app.include_router(cooking.router, prefix="/api/cooking", tags=["Cooking"])
# app.include_router(manager_chat.router, prefix="/api/manager_chat", tags=["Manager Chat"])  # 통계 기능 임시 비활성화

# 로컬 실행용
if __name__ == "__main__":
    import uvicorn
    print("🚀 Local Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)