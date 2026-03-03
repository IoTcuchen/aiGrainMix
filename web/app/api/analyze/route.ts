import { NextResponse } from 'next/server';
import { InferenceClient } from "@huggingface/inference";

// 서버 사이드이므로 process.env.HF_TOKEN을 바로 사용합니다.
const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
    try {
        const { image } = await req.json();
        const buffer = Buffer.from(image.split(',')[1], 'base64');

        console.log("-----------------------------------------");
        console.log("🚀 [서버] EfficientNet-B0 모델로 분석 시작");
        const data = new Blob([buffer]);

        const output = await client.imageClassification({
            data,
            model: "google/efficientnet-b0", // 사용자 요청 모델
            provider: "hf-inference", // 추가된 프로바이더 설정
        }, {
            fetch: (url, options) => fetch(url, {
                ...options,
                headers: {
                    ...options?.headers,
                    "ngrok-skip-browser-warning": "any"
                }
            })
        });

        console.log("✅ [서버] 분석 성공:", output[0]?.label);
        return NextResponse.json(output);

    } catch (error: any) {
        console.error("❌ [서버 터미널 에러]:", error.message);

        // 모델 로딩 중일 때 (503)
        if (error.message.includes("loading")) {
            return NextResponse.json({ error: "모델이 깨어나는 중입니다. 15초 뒤 다시 시도해 주세요." }, { status: 503 });
        }

        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}