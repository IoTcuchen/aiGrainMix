from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional
import json
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage

router = APIRouter()

# LLM 설정
llm = ChatOpenAI(model="gpt-4o", temperature=0.1)

# 입력 데이터 모델
class RecipeItem(BaseModel):
    recipeKey: str = Field(description="레시피 고유 키")
    recipeNo: str = Field(description="밥솥 전송용 메뉴 번호")
    recipeNm: str = Field(description="메뉴 명칭")

class VoiceCookingRequest(BaseModel):
    text: str = Field(description="사용자 음성 인식 텍스트")
    recipe_list: List[RecipeItem] = Field(description="DB에서 조회된 유효 레시피 목록")

# LLM 구조화된 응답 모델
class SelectedMenu(BaseModel):
    recipeKey: str
    recipeNo: str
    recipeNm: str
    reason: str = Field(description="이 메뉴를 추천한 이유 (사용자에게 들려줄 멘트)")

@router.post("/analyze")
async def analyze_voice_command(data: VoiceCookingRequest):
    """
    사용자의 음성을 분석하여 DB 레시피 중 가장 적합한 메뉴를 선택합니다.
    """
    
    # 레시피 목록을 텍스트로 변환
    recipes_context = "\n".join([
        f"- {r.recipeNm} (Key: {r.recipeKey}, No: {r.recipeNo})" 
        for r in data.recipe_list
    ])

    prompt = f"""
    당신은 쿠첸ON 스마트 밥솥의 인공지능 비서입니다. 
    사용자의 요청을 분석하여 아래 제공된 [DB 레시피 목록] 중 가장 적합한 메뉴 하나를 선택하세요.

    [사용자 요청]
    "{data.text}"

    [DB 레시피 목록]
    {recipes_context}

    [규칙]
    1. 반드시 목록에 있는 메뉴 중에서만 선택하세요.
    2. 사용자의 건강 상태나 기분, 말투를 분석하여 가장 유사한 메뉴를 매칭하세요.
       (예: "든든하게" -> 영양밥/찰진밥, "부드럽게" -> 죽/슬로우쿡)
    3. 적절한 메뉴가 없다면 가장 기본 메뉴인 '백미' 관련 메뉴를 선택하세요.
    4. 이유(reason)는 "네, 고객님. 건강을 위해 ~를 준비해드릴게요."와 같이 친절한 말투로 작성하세요.
    """

    try:
        structured_llm = llm.with_structured_output(SelectedMenu)
        result = structured_llm.invoke([SystemMessage(content=prompt)])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))