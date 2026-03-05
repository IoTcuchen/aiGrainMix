import { NextResponse } from 'next/server';
import { InferenceClient } from '@huggingface/inference';

const client = new InferenceClient(process.env.HF_TOKEN);

export async function POST(req: Request) {
  try {
    const { image } = await req.json();
    if (!image || typeof image !== 'string' || !image.includes(',')) {
      return NextResponse.json(
        { code: 'IMAGE_INVALID', message: '유효한 이미지 데이터가 필요합니다.', retryable: false },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(image.split(',')[1], 'base64');
    const data = new Blob([buffer]);

    const output = await client.imageClassification({
      data,
      model: 'google/efficientnet-b0',
      provider: 'hf-inference',
    });

    return NextResponse.json(output);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    const status = message.includes('loading') ? 503 : 500;
    return NextResponse.json(
      {
        code: status === 503 ? 'MODEL_LOADING' : 'IMAGE_ANALYZE_ERROR',
        message,
        retryable: true,
      },
      { status },
    );
  }
}
