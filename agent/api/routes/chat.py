import os
import json
from typing import List, Optional, Literal, Dict, Any
from typing_extensions import TypedDict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from langgraph.graph import StateGraph, END
from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage
from langchain_openai import ChatOpenAI

# --- 1. FastAPI 앱 설정 ---
router = APIRouter()
# --- 2. 데이터 모델 ---
class LogEntry(BaseModel):
    step: str
    content: Dict | str
    prompt: Optional[str] = None

class SurveyState(BaseModel):
    health_goals: List[str] = Field(default_factory=list)
    texture_preference: Optional[Literal['고슬밥', '찰진밥', '콩없는 밥', '선호없음']] = None
    own_grains: List[str] = Field(default_factory=list)
    avoid_or_allergy: List[str] = Field(default_factory=list)

class AppState(BaseModel):
    conversation_stage: str = "start"
    survey_state: SurveyState

class AgentState(TypedDict):
    messages: List[BaseMessage]
    survey_state: Dict
    next_step: Optional[str]
    final_response: Optional[Dict]
    logs: List[Dict]

llm = ChatOpenAI(model="gpt-4o", temperature=0.2)

def add_log(state: AgentState, step: str, content: Any, prompt: str = None):
    entry = {"step": step, "content": content, "prompt": prompt, "timestamp": str(os.urandom(2).hex())}
    print(f"[LOG: {step}] {str(content)[:100]}...") 
    current_logs = state.get("logs", [])
    return current_logs + [entry]

class ExtractedInfo(BaseModel):
    health_goals: Optional[List[str]] = Field(description="건강 고민 키워드 (언급 없으면 None)")
    texture_preference: Optional[Literal['고슬밥', '찰진밥', '콩없는 밥', '선호없음']] = Field(description="식감 선호도 (언급 없으면 None)")
    own_grains: Optional[List[str]] = Field(description="보유 잡곡 (언급 없으면 None)")
    avoid_or_allergy: Optional[List[str]] = Field(description="기피 곡물 (언급 없으면 None)")
    fields_to_reset: Optional[List[str]] = Field(description="초기화할 필드명")

class BlendItem(BaseModel):
    곡물: str
    비율: int

class RecommendationResult(BaseModel):
    mode: str
    blend: List[BlendItem]
    reasons: List[str]

# --- 3. LangGraph Nodes ---

def extractor_node(state: AgentState):
    messages = state['messages']
    current_state = state.get('survey_state', {})
    
    has_goals = bool(current_state.get('health_goals') and len(current_state.get('health_goals', [])) > 0)
    has_texture = bool(current_state.get('texture_preference'))

    instructions = []
    instructions.append("- 사용자가 직접 언급한 내용만 추출하세요. 추측 금지.")
    instructions.append("- 인사말('안녕')에는 아무것도 추출하지 마세요(None).")
    
    if not has_goals:
        instructions.append("- '건강 고민'을 추출해 health_goals에 담으세요.")
        instructions.append("- **주의**: 사용자가 '건강은 상관없어'라고 명시할 때만 ['선호없음']을 넣으세요.")
    
    if not has_texture:
        instructions.append("- '식감 선호'를 추출해 texture_preference에 담으세요.")
        instructions.append("- **주의**: 사용자가 '식감은 상관없어'라고 명시할 때만 '선호없음'을 넣으세요.")
        
    if has_goals and has_texture:
        instructions.append("- 현재 정보가 모두 있습니다. 사용자가 '수정'이나 '변경'을 원할 때만 값을 바꾸세요.")

    system_prompt = f"""
    당신은 정보 관리자입니다.
    [현재 상태]
    {json.dumps(current_state, ensure_ascii=False)}

    [행동 지침]
    {chr(10).join(instructions)}
    
    * 언급되지 않은 필드는 절대 건드리지 마세요(None 반환).
    """
    
    structured_llm = llm.with_structured_output(ExtractedInfo)
    response = structured_llm.invoke([SystemMessage(content=system_prompt)] + messages[-1:])
    
    new_state = current_state.copy()
    updated_logs = []

    if response.fields_to_reset:
        for field in response.fields_to_reset:
            if field in new_state:
                new_state[field] = [] if isinstance(new_state[field], list) else None
                updated_logs.append(f"Reset: {field}")

    if response.health_goals is not None: new_state['health_goals'] = response.health_goals
    if response.texture_preference is not None: new_state['texture_preference'] = response.texture_preference
    if response.own_grains is not None: new_state['own_grains'] = response.own_grains
    if response.avoid_or_allergy is not None: new_state['avoid_or_allergy'] = response.avoid_or_allergy

    new_logs = add_log(state, "1. Extractor", {
        "동적지침": instructions, 
        "추출": response.model_dump()
    }, prompt=system_prompt)

    return {"survey_state": new_state, "logs": new_logs, "next_step": "check_completeness"}

def manager_node(state: AgentState):
    s = state['survey_state']
    has_goals = bool(s.get('health_goals') and len(s['health_goals']) > 0)
    has_texture = bool(s.get('texture_preference'))
    
    decision = "recommend" if has_goals and has_texture else "ask_question"
    new_logs = add_log(state, "2. Router", {"조건": {"goals": has_goals, "texture": has_texture}, "결정": decision})
    return {"next_step": decision, "logs": new_logs}

def question_generator_node(state: AgentState):
    s = state['survey_state']
    missing = []
    if not (s.get('health_goals') and len(s['health_goals']) > 0): missing.append("건강 고민")
    if not s.get('texture_preference'): missing.append("식감")
    
    prompt = f"""
    사용자 정보: {s}
    상황: '{', '.join(missing)}' 정보가 부족합니다.
    지침:
    1. 인사말에는 반갑게 대답하세요.
    2. 부족한 정보만 자연스럽게 물어보세요.
    3. 식감 옵션은 '고슬밥', '찰진밥', '콩없는 밥', '선호없음' 입니다.
    """
    response = llm.invoke([SystemMessage(content=prompt)])
    
    new_logs = add_log(state, "3. Generator", response.content, prompt=prompt)
    return {
        "messages": state['messages'] + [response],
        "logs": new_logs,
        "final_response": {
            "message": {"role": "bot", "content": response.content},
            "isComplete": False,
            "appState": {"survey_state": s, "conversation_stage": "surveying"},
            "debugLogs": new_logs
        }
    }

def recommender_node(state: AgentState):
    s = state['survey_state']
    own_grains = s.get('own_grains', [])
    mode = "hybrid" if own_grains and len(own_grains) > 0 else "catalog"
    
    # [수정된 로직] 모드에 따른 동적 추천 규칙 생성
    rules = []
    rules.append(f"1. Mode: '{mode}'")
    
    if mode == "hybrid":
        # [핵심] 보유 곡물 포함 강제
        rules.append(f"2. [필수] 사용자가 보유한 곡물 **{own_grains}**을(를) 반드시 포함하여 배합하세요.")
        rules.append("3. 보유 곡물 외에 건강 목표에 맞는 곡물을 추가하여 100%를 채우세요.")
    else:
        rules.append("2. 한국에서 구하기 쉬운 대중적인 잡곡 위주로 추천하세요.")
    
    if "선호없음" in s.get('health_goals', []) or s.get('texture_preference') == "선호없음":
        rules.append("4. '선호없음' 항목은 대중적이고 호불호 없는 밸런스(맛/건강) 위주로 추천하세요.")
        
    rules.append("5. 이유를 3가지 이상 상세히 작성하세요.")
    rules.append("6. Base가 되는 곡물은 50% 이상 포함하세요.")

    prompt = f"""
    당신은 잡곡 소믈리에입니다. 
    프로필({s})을 바탕으로 최적의 잡곡 혼합 비율(총합 100%)을 추천하세요.

    [추천 규칙]
    {chr(10).join(rules)}
    """
    
    structured_llm = llm.with_structured_output(RecommendationResult)
    result = structured_llm.invoke([SystemMessage(content=prompt)])
    
    payload = {
        "mode": result.mode,
        "blend": [item.model_dump() for item in result.blend],
        "reasons": result.reasons
    }
    
    msg_content = f"분석 완료! '{mode}' 모드로 최적의 비율을 추천해 드립니다."
    new_logs = add_log(state, "3. Recommender", {
        "규칙": rules, # 로그에서 어떤 규칙이 적용됐는지 확인 가능
        "결과": result.model_dump()
    }, prompt=prompt)
    
    return {
        "messages": state['messages'] + [AIMessage(content=msg_content)],
        "logs": new_logs,
        "final_response": {
            "message": {"role": "bot", "content": msg_content, "recommendation": payload},
            "isComplete": True,
            "appState": {"survey_state": s, "conversation_stage": "complete"},
            "debugLogs": new_logs
        }
    }

# --- 4. 그래프 구성 ---
workflow = StateGraph(AgentState)
workflow.add_node("extractor", extractor_node)
workflow.add_node("manager", manager_node)
workflow.add_node("question_generator", question_generator_node)
workflow.add_node("recommender", recommender_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "manager")
workflow.add_conditional_edges("manager", lambda x: x['next_step'], {
    "ask_question": "question_generator",
    "recommend": "recommender"
})
workflow.add_edge("question_generator", END)
workflow.add_edge("recommender", END)

app_graph = workflow.compile()

# --- 5. 엔드포인트 ---
class ChatRequest(BaseModel):
    message: str
    appState: AppState 

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    initial_state = {
        "messages": [HumanMessage(content=request.message)],
        "survey_state": request.appState.survey_state.model_dump(),
        "logs": [],
        "next_step": None
    }
    result = await app_graph.ainvoke(initial_state)
    if result.get("final_response"):
        return result["final_response"]
    raise HTTPException(status_code=500, detail="No response generated")
