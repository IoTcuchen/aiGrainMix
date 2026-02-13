import { NextResponse } from 'next/server';
import { HfInference } from "@huggingface/inference";

// 허깅페이스 클라이언트 초기화
const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();

        // ★ [수정 핵심] Blob을 만들 때 'audio/webm' 이라고 라벨을 붙여줍니다.
        const audioData = new Blob([arrayBuffer], { type: 'audio/webm' });

        console.log("🚀 Hugging Face v3-turbo 전송 시작 (audio/webm)");

        const output = await hf.automaticSpeechRecognition({
            data: audioData,
            model: "openai/whisper-large-v3-turbo",
            provider: "hf-inference",
            parameters: {
                language: "ko",
                task: "transcribe" // 번역(translate)이 아니라 받아쓰기(transcribe)를 하겠다고 명시
            }
        });

        console.log("📩 변환 결과:", output);

        return NextResponse.json({ text: output.text });

    } catch (error: any) {
        console.error("STT 에러 발생:", error);

        // 만약 410 에러나 503(로딩중)이 나면 상세 내용을 알 수 있게 출력
        return NextResponse.json({
            error: error.message,
            detail: "모델이 준비 중이거나 무료 티어 할당량이 초과되었을 수 있습니다."
        }, { status: 500 });
    }
}