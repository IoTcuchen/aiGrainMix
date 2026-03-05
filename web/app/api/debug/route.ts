import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const body = await req.text();

    // 여기가 바로 터미널에 찍히는 곳입니다
    console.log("\n🔥🔥🔥🔥🔥 [밥솥 서버 응답 원본] 🔥🔥🔥🔥🔥");
    console.log(body);
    console.log("🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n");

    return NextResponse.json({ ok: true });
}