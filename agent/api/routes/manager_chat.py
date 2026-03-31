from fastapi import APIRouter
from pydantic import BaseModel
from api.services.text_to_sql_service import process_chat_query

router = APIRouter()

class ChatRequest(BaseModel):
    message: str

@router.post("/")
async def chat_to_sql(req: ChatRequest):
    result = process_chat_query(req.message)
    return result
