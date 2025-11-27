from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage

router = APIRouter()

# LLM 설정
llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

# 설문 데이터 모델
class SurveyRequest(BaseModel):
    target_gender: str = Field(description="주 섭취 대상 성별")
    target_age: str = Field(description="주 섭취 대상 나이")
    texture_pref: str = Field(description="선호식감")
    disease: str = Field(description="질병 보유")
    constitution1: str = Field(description="체질 개선1")
    constitution2: str = Field(description="체질 개선2")
    expectation: str = Field(description="효과 기대")
    avoid_grains: List[str] = Field(description="기피곡물")
    frequency: str = Field(description="섭취 빈도")

# 응답 모델
class BlendItem(BaseModel):
    곡물: str
    비율: int

class RecommendationResult(BaseModel):
    mode: str = "survey"
    blend: List[BlendItem]
    reasons: List[str]

# 엔드포인트 정의
@router.post("/submit")
async def submit_survey(data: SurveyRequest):
    print("Received survey data:", data)
    prompt = f"""
    당신은 잡곡 소믈리에입니다. 아래 설문 결과를 분석하여 최적의 잡곡 혼합 비율(100%)을 추천해주세요.

    [설문 결과]
    - 대상: {data.target_gender}, {data.target_age}
    - 식감: {data.texture_pref}
    - 건강상태: 질병({data.disease}), 체질1({data.constitution1}), 체질2({data.constitution2})
    - 목표: {data.expectation}
    - 기피곡물: {data.avoid_grains}
    - 빈도: {data.frequency}

    [규칙]
    1. 기피 곡물은 절대 포함하지 마세요.
    2. 한국인에게 적합한 대중적인 잡곡 위주로 구성하세요.
    3. 이유를 3가지 이상 의학적/영양학적 근거로 설명하세요.
    4. Base가 되는 곡물은 50% 이상 포함하세요.
    """

    structured_llm = llm.with_structured_output(RecommendationResult)
    result = structured_llm.invoke([SystemMessage(content=prompt)])
    
    return result