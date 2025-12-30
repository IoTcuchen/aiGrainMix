'use server';

// 이 파일은 Next.js 서버(터미널)에서 실행됩니다.
export async function exchangeTokenServerAction(code: string) {
  // 1. 터미널에 로그 출력
  console.log('----------------------------------------------------');
  console.log(`[Server Action] 1. 토큰 교환 시작 (Code: ${code})`);

  // ★ Java 서버 주소 (서버 간 통신이므로 실제 IP 또는 localhost 사용 가능)
  // Docker 등을 사용하지 않는다면 localhost도 가능하지만, 확실하게 하기 위해 IP 권장
  const JAVA_SERVER_URL = 'http://192.168.128.54:8080/cuchenon/api/exchangeToken.action';

  try {
    const response = await fetch(`${JAVA_SERVER_URL}?code=${code}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 항상 최신 데이터 요청
    });

    console.log(`[Server Action] 2. Java 서버 응답 상태: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Server Action] 에러 발생: ${errorText}`);
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();

    // 3. 응답 데이터 터미널 출력
    // 12/30 수정 응답 데이터: 1. user, 2. device
    console.log(`[Server Action] 3. Java 서버 응답 데이터:`, JSON.stringify(data, null, 2));
    console.log('----------------------------------------------------');

    return data;

  } catch (error: any) {
    console.error('[Server Action] 치명적 오류:', error);
    return {
      status: 'error',
      message: error.message || 'Server Action Error'
    };
  }
}