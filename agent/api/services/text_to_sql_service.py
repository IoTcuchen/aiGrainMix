import os
import re
from typing import TypedDict, Dict, Any, List
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_community.utilities import SQLDatabase
from sqlalchemy import create_engine
from langgraph.graph import StateGraph, END

load_dotenv(".env")

class AgentState(TypedDict):
    question: str
    filtered_schema: str
    query: str
    error: str
    raw_results: List[Dict[str, Any]]
    chart_type: str
    final_answer: Dict[str, Any]

# 1. DB Connection setup
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST", "127.0.0.1")
db_port = os.getenv("DB_PORT", "3306")
db_name = os.getenv("DB_NAME")

url = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
engine = create_engine(url)
db = SQLDatabase(engine, include_tables=['SC_COOKER_LOG', 'SC_DEVICE_STATUS', 'SC_RECIPE'])

# 2. LLM Setup
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

# ==================== NODE 1: Router / Schema Filter ====================
def node_1_router(state: AgentState):
    question = state["question"]
    # For MVP, we will extract full schema of 3 tables since it is small.
    # A real implementation would ask LLM to pick tables.
    schema = db.get_table_info()
    return {"filtered_schema": schema}

# ==================== NODE 2: SQL Generator ====================
def node_2_generator(state: AgentState):
    question = state["question"]
    schema = state["filtered_schema"]
    
    prompt = PromptTemplate.from_template(
        """당신은 MySQL 데이터베이스 전문가입니다. 아래 스키마를 참고하여 사용자의 질문에 답하는 SELECT 쿼리만 작성하세요. 
        만약 데이터가 시간의 흐름에 따른 차트를 지향한다면 DATE() 혹은 날짜 포맷팅을 적절히 포함해 주세요.
        결과는 마크다운 코드블록(```sql ... ```) 형식 없이 오직 순수한 SQL 문자열만 반환하세요.
        
        스키마:
        {schema}
        
        질문:
        {question}
        
        순수 쿼리문:"""
    )
    
    chain = prompt | llm
    response = chain.invoke({"schema": schema, "question": question})
    query = response.content.strip()
    
    # 순수 쿼리가 코드블럭 내부로 들어온 경우 정리
    if query.startswith("```sql"):
        query = query[6:]
    if query.startswith("```"):
        query = query[3:]
    if query.endswith("```"):
        query = query[:-3]
    
    return {"query": query.strip()}

# ==================== NODE 3: Validator & Executer ====================
def node_3_validator(state: AgentState):
    query = state["query"]
    
    # 치명적 DML 명령어 정규식 체크 (Fail-Fast Guardia)
    forbidden_pattern = re.compile(r'\b(DELETE|UPDATE|INSERT|DROP|ALTER|TRUNCATE|GRANT|REVOKE)\b', re.IGNORECASE)
    if forbidden_pattern.search(query):
        return {"error": "위험한 SQL 명령어가 감지되어 실행을 차단했습니다."}
    
    # DB 조회
    try:
        # returns list of dicts string representation
        result_str = db.run(query) 
        import ast
        try:
            # parsing the string rep from db.run
            raw_results = ast.literal_eval(result_str)
            
            # map row tuples back to dict using sqlalchemy connection if needed, 
            # but db.run() in langchain usually returns list of tuples or dicts. 
            # We'll re-fetch using sqlalchemy to get list of dicts safely.
        except:
            raw_results = []
            
        # Safer execute:
        with engine.connect() as connection:
            from sqlalchemy import text
            res = connection.execute(text(query))
            keys = res.keys()
            raw_results = [dict(zip(keys, row)) for row in res.fetchall()]
            
        return {"raw_results": raw_results, "error": ""}
    except Exception as e:
        return {"error": f"쿼리 실행 에러: {str(e)}"}

def route_error(state: AgentState):
    if state.get("error"):
        return "end"
    return "continue"

# ==================== NODE 4: Chart Recommender ====================
def node_4_recommender(state: AgentState):
    raw_results = state["raw_results"]
    question = state["question"]
    
    if not raw_results:
        return {"chart_type": "table", "final_answer": {"type": "table", "data": []}}
    
    import json
    # Convert dates and decimals to string/float for JSON serialization
    def convert_val(val):
        from datetime import date, datetime
        from decimal import Decimal
        if isinstance(val, (datetime, date)):
            return val.isoformat()
        if isinstance(val, Decimal):
            return float(val)
        return val
        
    cleaned_results = [{k: convert_val(v) for k, v in row.items()} for row in raw_results]
    sample_data = json.dumps(cleaned_results[:10], ensure_ascii=False)
    
    prompt = PromptTemplate.from_template(
        """당신은 데이터 시각화 전문가입니다. 아래 데이터를 바탕으로 사용자의 질문에 답변을 가장 잘 보여줄 수 있는 차트 타입을 선택하세요.
        선택 가능한 차트 타입: 'bar', 'line', 'pie', 'table'
        데이터가 1건 뿐이거나 차트로 표현하기 모호하면 'table'을 반환하세요.
        시간의 흐름(날짜/시간)이 있으면 'line' 혹은 'bar', 비중을 보여주면 'pie', 랭킹은 'bar'나 'table'이 적합합니다.
        
        사용자 질문: {question}
        데이터 스니펫:
        {sample_data}
        
        오직 응답으로 차트 타입 이름(선택지 중 1개)만 출력하세요. (예: pie)"""
    )
    
    chain = prompt | llm
    chart_type_response = chain.invoke({"question": question, "sample_data": sample_data})
    chart_type = chart_type_response.content.strip().lower()
    if chart_type not in ['bar', 'line', 'pie', 'table']:
        chart_type = 'table'
        
    return {
        "chart_type": chart_type, 
        "final_answer": {
            "type": chart_type, 
            "data": cleaned_results,
            "query": state.get("query")
        }
    }

# ==================== Graph Build ====================
workflow = StateGraph(AgentState)

workflow.add_node("router", node_1_router)
workflow.add_node("generator", node_2_generator)
workflow.add_node("validator", node_3_validator)
workflow.add_node("recommender", node_4_recommender)

workflow.set_entry_point("router")
workflow.add_edge("router", "generator")
workflow.add_edge("generator", "validator")
workflow.add_conditional_edges("validator", route_error, {"continue": "recommender", "end": END})
workflow.add_edge("recommender", END)

app_graph = workflow.compile()

def process_chat_query(question: str) -> Dict[str, Any]:
    initial_state = {"question": question, "error": ""}
    output = app_graph.invoke(initial_state)
    
    if output.get("error"):
        return {"status": "error", "message": output["error"]}
        
    return {
        "status": "success",
        "chart_type": output.get("chart_type", "table"),
        "data": output.get("final_answer", {}).get("data", []),
        "query": output.get("query", "")
    }
