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
class RecipeItem(BaseModel):
    recipeKey: str = Field(description="레시피 고유 키")
    recipeNo: str = Field(description="밥솥 전송용 메뉴 번호")
    recipeNm: str = Field(description="메뉴 명칭")

class CookingState(BaseModel):
    ingredient: Optional[str] = Field(description="사용자가 원하는 주재료 (예: 소고기, 돼지고기, 닭고기, 채소류 등)", default=None)
    purpose: Optional[str] = Field(description="취사 목적 (예: 이유식, 다이어트, 건강식 등)", default=None)
    texture: Optional[str] = Field(description="식감 선호 (예: 찰지게, 부드럽게, 고슬고슬하게 등)", default=None)
    specific_menu: Optional[str] = Field(description="사용자가 직접 언급한 구체적인 메뉴명 (예: 갈비찜, 소고기 무국 등)", default=None)

class AppState(BaseModel):
    conversation_stage: str = "start"
    cooking_state: CookingState
    recipe_list: List[RecipeItem] = Field(default_factory=list)

class AgentState(TypedDict):
    messages: List[BaseMessage]
    cooking_state: Dict
    recipe_list: List[Dict]
    next_step: Optional[str]
    final_response: Optional[Dict]
    logs: List[Dict]

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

def add_log(state: AgentState, step: str, content: Any, prompt: str = None):
    entry = {"step": step, "content": content, "prompt": prompt, "timestamp": str(os.urandom(2).hex())}
    print(f"[LOG: {step}] {str(content)[:150]}...") 
    current_logs = state.get("logs", [])
    return current_logs + [entry]

class ExtractedCookingInfo(BaseModel):
    ingredient: Optional[str] = Field(description="주재료 (언급 없으면 None)")
    purpose: Optional[str] = Field(description="취사 목적 (언급 없으면 None)")
    texture: Optional[str] = Field(description="식감 선호 (언급 없으면 None)")
    specific_menu: Optional[str] = Field(description="정확한 메뉴명 (언급 없으면 None)")
    is_ready_to_cook: bool = Field(description="사용자가 특정 메뉴나 목적을 명확히 지정하여 바로 취사해도 되는지 여부")

class SelectedMenuResult(BaseModel):
    recipeKey: str
    recipeNo: str
    recipeNm: str
    reason: str = Field(description="이 메뉴를 확정한 이유 및 친절한 안내 멘트")

# --- 3. LangGraph Nodes ---

def extractor_node(state: AgentState):
    messages = state['messages']
    current_state = state.get('cooking_state', {})
    
    instructions = [
        "- 사용자가 방금 한 말과 이전 대화 맥락을 모두 고려하여 요리 관련 정보를 추출하세요.",
        "- 사용자가 이전 질문에 대답했다면, 그 대답을 반영하여 specific_menu나 ingredient 등을 채우세요.",
        "- '그걸로 해줘', '첫 번째 거' 등의 지시 대명사를 쓰면, 직전에 AI가 제안한 메뉴 중 매칭되는 메뉴명을 찾아 specific_menu에 넣으세요."
    ]

    system_prompt = f"""
    당신은 쿠첸 스마트 밥솥의 요리 매니저입니다.
    사용자의 발화에서 요리 조건이나 특정한 메뉴 자체를 추출하세요.

    [현재까지 파악된 상태]
    {json.dumps(current_state, ensure_ascii=False)}

    [행동 지침]
    {chr(10).join(instructions)}
    """
    
    structured_llm = llm.with_structured_output(ExtractedCookingInfo)
    response = structured_llm.invoke([SystemMessage(content=system_prompt)] + messages)
    
    new_state = current_state.copy()

    if response.ingredient: new_state['ingredient'] = response.ingredient
    if response.purpose: new_state['purpose'] = response.purpose
    if response.texture: new_state['texture'] = response.texture
    if response.specific_menu: new_state['specific_menu'] = response.specific_menu
    
    new_state['is_ready_to_cook'] = response.is_ready_to_cook

    new_logs = add_log(state, "1. Extractor", response.model_dump(), prompt=system_prompt)
    return {"cooking_state": new_state, "logs": new_logs, "next_step": "evaluate"}

def manager_node(state: AgentState):
    s = state['cooking_state']
    recipe_list = state['recipe_list']
    
    is_ready = s.get('is_ready_to_cook', False)
    specific_menu = s.get('specific_menu')
    ingredient = s.get('ingredient')
    purpose = s.get('purpose')

    # 질문성 발화("가장 적합한 메뉴가 뭐야?")인지 파악하기 위해 마지막 메시지를 간단히 검사합니다.
    last_msg = state['messages'][-1].content if state['messages'] else ""
    is_question = any(q in last_msg for q in ["뭐야", "어때", "추천", "알려줘", "뭐가", "좋을까"])

    # 질문이거나, 정보가 불충분하거나, 명확한 취사 의지(is_ready)가 없다면 질문 생성로직으로.
    if is_question or not (is_ready or specific_menu or (ingredient and purpose)):
        decision = "question_generator"
    else:
        decision = "cook_executor"

    new_logs = add_log(state, "2. Router", {"조건": s, "의도": "질문" if is_question else "명령", "결정": decision})
    return {"next_step": decision, "logs": new_logs}

def question_generator_node(state: AgentState):
    s = state['cooking_state']
    recipes = state['recipe_list']
    
    recipes_context = "\n".join([f"- {r['recipeNm']}" for r in recipes])
    
    prompt = f"""
    당신은 쿠첸 스마트 밥솥의 요리 전문 AI 매니저입니다.
    사용자 파악 조건: {s}
    가용한 보유 레시피 목록:
    {recipes_context}

    상황: 사용자가 레시피를 추천해달라고 질문했거나, 정보가 모호하여 취사를 바로 시작할 수 없습니다.
    지침:
    1. 사용자의 질문 내용(예: "갈비찜에 가장 적합한 메뉴가 뭐야?")에 대해, 보유한 레시피 목록 내에서 가장 잘 어울리는 메뉴 1~2개를 찾아 먼저 이유와 함께 답변하세요.
    2. 완전히 일치하는 메뉴가 없다면 비슷한 조리 방식을 가진 메뉴(예: 찜류에는 만능찜 등)를 추천하세요.
    3. 답변 마지막에는 "이 메뉴로 취사를 시작해 드릴까요?" 처럼 사용자의 확답(is_ready_to_cook)을 유도하는 질문을 덧붙이세요.
    4. 친절하고 자연스러운 대화체로, 2~3문장 이내로 작성하세요. 절대 사용 가능한 메뉴 목록 외의 가상의 메뉴를 지어내면 안 됩니다.
    """
    
    response = llm.invoke([SystemMessage(content=prompt)] + state['messages'][-3:])
    
    new_logs = add_log(state, "3. Generator", response.content, prompt=prompt)
    return {
        "messages": state['messages'] + [response],
        "logs": new_logs,
        "final_response": {
            "message": {"role": "bot", "content": response.content},
            "isComplete": False,
            "appState": {
                "cooking_state": s, 
                "conversation_stage": "ask_clarification"
            },
            "debugLogs": new_logs
        }
    }

def cook_executor_node(state: AgentState):
    s = state['cooking_state']
    recipes = state['recipe_list']
    
    recipes_context = "\n".join([f"- {r['recipeNm']} (Key: {r['recipeKey']}, No: {r['recipeNo']})" for r in recipes])

    prompt = f"""
    당신은 쿠첸 스마트 밥솥의 요리 매니저입니다.
    사용자의 요청 조건({s})을 바탕으로, 아래 보유 레시피 중 **단 1개**의 가장 적합한 메뉴를 확정하세요.

    [보유 레시피 목록]
    {recipes_context}

    [규칙]
    1. 사용자가 specific_menu를 지정했다면 해당 이름과 가장 유사한 메뉴를 매칭하세요.
    2. 목적(이유식 등)이나 대상, 식감이 주어졌다면 그에 가장 잘 맞는 메뉴를 골라야 합니다.
    3. 완전히 똑같은 이름이 없더라도 재료나 목적이 가장 유사한 것을 하나 꼭 선택하세요.
    4. 적합한게 정 없다면 가장 기본 메뉴인 '백미' (보통 1번)를 고르세요.
    5. reason 멘트는 "네, 고객님. {s.get('specific_menu') or s.get('ingredient') or '말씀하신 조건'}에 맞춰 [메뉴명] 취사를 바로 시작할게요!" 처럼 친절하고 확신에 찬 어조로 작성하세요.
    """
    
    structured_llm = llm.with_structured_output(SelectedMenuResult)
    result = structured_llm.invoke([SystemMessage(content=prompt)] + state['messages'])
    
    payload = {
        "recipeKey": result.recipeKey,
        "recipeNo": result.recipeNo,
        "recipeNm": result.recipeNm
    }
    
    new_logs = add_log(state, "3. Cook Executor", result.model_dump(), prompt=prompt)
    
    return {
        "messages": state['messages'] + [AIMessage(content=result.reason)],
        "logs": new_logs,
        "final_response": {
            "message": {
                "role": "bot", 
                "content": result.reason, 
                "cook_command": payload
            },
            "isComplete": True,
            "appState": {
                "cooking_state": s, 
                "conversation_stage": "complete",
                "selected_menu": payload
            },
            "debugLogs": new_logs
        }
    }

# --- 4. 그래프 구성 ---
workflow = StateGraph(AgentState)
workflow.add_node("extractor", extractor_node)
workflow.add_node("manager", manager_node)
workflow.add_node("question_generator", question_generator_node)
workflow.add_node("cook_executor", cook_executor_node)

workflow.set_entry_point("extractor")
workflow.add_edge("extractor", "manager")
workflow.add_conditional_edges("manager", lambda x: x['next_step'], {
    "question_generator": "question_generator",
    "cook_executor": "cook_executor"
})
workflow.add_edge("question_generator", END)
workflow.add_edge("cook_executor", END)

app_graph = workflow.compile()

# --- 5. 엔드포인트 ---
class MessageItem(BaseModel):
    role: Literal["user", "bot"]
    content: str

class ChatCookRequest(BaseModel):
    messages: List[MessageItem]
    appState: AppState 

@router.post("/analyze")
async def analyze_voice_command(request: ChatCookRequest):
    # Pydantic 메시지를 Langchain 포맷으로 변환
    langchain_messages = []
    for m in request.messages:
        if m.role == "user":
            langchain_messages.append(HumanMessage(content=m.content))
        else:
            langchain_messages.append(AIMessage(content=m.content))

    initial_state = {
        "messages": langchain_messages,
        "cooking_state": request.appState.cooking_state.model_dump(),
        "recipe_list": [r.model_dump() for r in request.appState.recipe_list],
        "logs": [],
        "next_step": None
    }
    
    try:
        result = await app_graph.ainvoke(initial_state)
        if result.get("final_response"):
            return result["final_response"]
        raise HTTPException(status_code=500, detail="No response generated")
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
