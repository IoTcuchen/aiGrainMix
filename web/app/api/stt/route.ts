import { NextResponse } from 'next/server';
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HF_TOKEN);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { code: 'STT_FILE_MISSING', message: '음성 파일이 없습니다.', retryable: false },
        { status: 400 },
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const audioData = new Blob([arrayBuffer], { type: 'audio/webm' });

    const output = await hf.automaticSpeechRecognition({
      data: audioData,
      model: 'openai/whisper-large-v3-turbo',
      provider: 'hf-inference',
      parameters: {
        language: 'ko',
        task: 'transcribe',
      },
    });

    return NextResponse.json({ text: output.text || '' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      {
        code: 'STT_PROCESSING_ERROR',
        message,
        retryable: true,
      },
      { status: 500 },
    );
  }
}
