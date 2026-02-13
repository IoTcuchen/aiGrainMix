import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const localUrl = process.env.LOCAL_API_URL;
    const JAVA_API_URL = `${localUrl}/cuchenon/api/exchangeToken.action`;

    console.log(`🔄 [Next.js Server] 토큰 교환 요청 (Code: ${code})`);

    const formData = new URLSearchParams();
    formData.append('code', code);

    const res = await fetch(JAVA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const data = await res.json();
    console.log("✅ [Next.js Server] 자바 서버 응답 원본:", JSON.stringify(data));

    // ★ 자바 서버 응답의 'bean' 객체 안에 데이터가 들어있음
    const bean = data.bean;

    if (data.success && bean && bean.status === 'success') {
      return NextResponse.json({
        success: true,
        token: bean.ssoToken, // 자바의 ssoToken을 token으로 매핑
        user: bean.user,      // memKey, name 등 포함
        device: bean.device   // deviceKey, modelKey 포함
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || '인증 정보 교환 실패'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ [Next.js Server] 통신 에러:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}