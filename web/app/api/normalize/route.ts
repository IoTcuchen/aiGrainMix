import { NextResponse } from 'next/server';
import { normalizeGrainFields } from '@/lib/grainReferences'; // 기존 로직 import
import { AppState } from '@/lib/types';

// 이 코드는 오직 '서버'에서만 실행됩니다.
export async function POST(request: Request) {
  console.log("[API] 정규화 요청 시작 (Server Side)"); // 터미널에 로그 출력됨

  try {
    const body = await request.json();
    const appState = body.appState as AppState;

    // 서버 환경이므로 firebase-admin이 정상 작동함
    const result = await normalizeGrainFields(appState);
    
    console.log("[API] 정규화 완료:", JSON.stringify(result, null, 2));
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("[API] 정규화 에러:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}