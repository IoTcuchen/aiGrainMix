import { NextResponse } from 'next/server';

const PYTHON_API_BASE = process.env.PYTHON_API_BASE_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const response = await fetch(`${PYTHON_API_BASE}/api/survey/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        {
          code: `PYTHON_${response.status}`,
          message: payload?.detail || payload?.message || '설문 분석 요청에 실패했습니다.',
          retryable: response.status >= 500,
        },
        { status: response.status },
      );
    }

    return NextResponse.json(payload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json(
      { code: 'SURVEY_PROXY_ERROR', message, retryable: true },
      { status: 500 },
    );
  }
}
