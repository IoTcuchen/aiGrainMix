import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    // [설정] 자바 서버의 exchangeToken 액션 주소
    // ★ Java @UrlBinding 주소를 확인해주세요. (예: /cuchenon/api/ai/exchangeToken.action)
    // 같은 서버(로컬)라면 127.0.0.1 사용, 분리되어 있다면 자바 서버 IP 사용
    const localUrl = process.env.LOCAL_API_URL;

    const JAVA_API_URL = `${localUrl}/cuchenon/api/exchangeToken.action`;

    console.log(`🔄 [Next.js Server] 토큰 교환 요청 시작 (Code: ${code})`);

    // Java Stripes는 Form Data로 보내면 자동으로 파라미터 바인딩이 됩니다.
    const formData = new URLSearchParams();
    formData.append('code', code);

    const res = await fetch(JAVA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded', // Stripes 호환성 최적화
      },
      body: formData.toString(),
    });

    // 자바 서버 응답 파싱
    // 자바에서 getJsonResolution(result)로 보냈으므로 JSON으로 받습니다.
    const data = await res.json();

    console.log("✅ [Next.js Server] 자바 서버 응답:", data);

    if (data.status === 'success') {
      return NextResponse.json({
        success: true,
        token: data.ssoToken,
        user: data.user,      // { memKey, id, name, email }
        device: data.device   // { deviceKey, modelKey }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: data.message || 'Token exchange failed'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ [Next.js Server] 통신 에러:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}