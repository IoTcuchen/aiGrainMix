import { NextResponse } from 'next/server';
import { InferenceClient } from "@huggingface/inference";
import OpenAI from 'openai';

// 서버 사이드이므로 process.env 변수들을 사용합니다.
const hfClient = new InferenceClient(process.env.HF_TOKEN);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // .env에 있는 OpenAI Key 사용

export async function POST(req: Request) {
    try {
        const payload = await req.json();

        // 클라이언트에서 전달한 base64 문자열을 Buffer와 Blob 객체로 변환
        const buffer = Buffer.from(payload.inputs, 'base64');
        const data = new Blob([buffer], { type: 'image/jpeg' });

        console.log("-----------------------------------------");
        console.log("🚀 [서버] 1단계: GLM-OCR 모델로 이미지 텍스트 추출 (via Hugging Face)");

        // 1. Hugging Face GLM-OCR을 통해 보이는 글자 전부 추출 (약상자의 HTML 등)
        const output = await hfClient.imageToText(
            {
                data,
                model: "zai-org/GLM-OCR",
                provider: "zai-org",
            } as any,
            {
                fetch: (url, options) => fetch(url, {
                    ...options,
                    headers: {
                        ...options?.headers,
                        "ngrok-skip-browser-warning": "any"
                    }
                })
            }
        );

        // API 버전이나 구조에 따라 키 값이 다를 수 있으므로 안전하게 추출
        const rawText: string = (output as any).generated_text || (output as any).generatedText || JSON.stringify(output);
        console.log("✅ [서버] OCR 추출 완료. 글자 수:", rawText.length);

        console.log("🧠 [서버] 2단계: OpenAI(GPT)를 사용하여 데이터 정제 및 종류 판별");

        // 2. OpenAI GPT-4o-mini를 활용하여 난해한 OCR 텍스트(표, 오타 등)에서 원하는 '종류'만 핵심값 추출
        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: `당신은 OCR 추출 텍스트에서 포함된 성분이나 품목의 '종류'만 깔끔하게 찾아내는 AI 데이터 파서입니다. 
사용자가 상품 패키지를 촬영한 뒤 OCR로 추출한 텍스트를 줄 것입니다. (약상자, 일반의약품, 잡곡/쌀 봉지 등)
규칙 1: 텍스트의 내용을 해석하고 어떤 물품의 사진인지 유추하여 'type'으로 반환하세요. (예: "약상자", "잡곡류", "기타용품")
규칙 2: 안에 들어있는 주 성분, 곡물 종류, 약 종류 등 핵심 아이템들을 배열 형태인 'items'에 나열하세요.
규칙 3: 오직 JSON 규격으로만 응답하세요. 백틱(\`\`\`)을 붙이면 안됩니다.

[응답 포맷 예시 - 잡곡일 경우]
{
  "title": "혼합곡 15종 분석 결과",
  "type": "곡물/잡곡류",
  "items": ["현미", "찰흑미", "귀리", "찰보리", "서리태"]
}

[응답 포맷 예시 - 현재 약상자일 경우]
{
  "title": "일반의약품 (감기약) 성분",
  "type": "의약품",
  "items": ["길경", "연교", "박하", "감초", "우황"]
}`
                },
                {
                    role: "user",
                    content: `다음 OCR 추출 텍스트를 분석해서 규격화된 JSON으로 정리해주세요:\n\n${rawText}`
                }
            ]
        });

        // 결과 파싱
        const parsedJsonStr = aiResponse.choices[0].message.content || '{"title": "분석 실패", "type": "알 수 없음", "items": []}';
        const finalAnalysis = JSON.parse(parsedJsonStr);

        console.log("🔥 [서버] 최종 파싱 성공:", finalAnalysis.title);

        // 프론트엔드로 GLM-OCR 원본과 GPT가 깔끔하게 파싱한 요약결과 모두 전달
        return NextResponse.json({
            raw_text: rawText,
            analysis: finalAnalysis
        });

    } catch (error: any) {
        console.error("❌ [서버 터미널 에러]:", error.message);

        // 모델이 메모리/GPU에 로드 중일 때 처리 (503)
        if (error.message.includes("loading") || error.message.includes("503")) {
            return NextResponse.json({ error: "HF AI 모델이 깨어나는 중입니다. 15~30초 뒤 다시 시도해 주세요." }, { status: 503 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
