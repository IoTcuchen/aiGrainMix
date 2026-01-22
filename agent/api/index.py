import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
load_dotenv(dotenv_path=".env")

from api.routes import chat, survey 

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

# 로컬 실행용
if __name__ == "__main__":
    import uvicorn
    print("🚀 Local Server running on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)