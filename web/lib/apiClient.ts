import { AppState, ChatApiResponse } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function sendChatMessage(
  message: string,
  appState: AppState
): Promise<ChatApiResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        appState,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || 'Network response was not ok');
    }

    const data = await response.json();
    
    // Python 서버 응답을 프론트엔드 타입에 맞게 매핑
    return {
      message: {
        id: data.message?.id || Date.now().toString(),
        role: 'bot',
        content: data.message?.content || data.content,
        recommendation: data.message?.recommendation,
      },
      appState: data.appState,
      isComplete: data.isComplete,
      debugLogs: data.debugLogs
        };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

export async function submitSurvey(formData: any) {
  try {
    const response = await fetch(`${API_BASE_URL}/survey/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    if (!response.ok) {
      throw new Error('서버 통신 오류');
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting survey:', error);
    throw error;
  }
}

export async function sendResultToCuchen(data: any) {
  try {
    const token = localStorage.getItem('accessToken');
    
    // [설정] 쿠첸온 서버 주소
    const CUCHEN_API_URL = "/cuchen-proxy/api/saveResult.action";
    console.log("쿠첸온으로 Form Data 전송 시도:", data);

    // 데이터를 폼(Form) 형식으로 변환
    const formData = new URLSearchParams();
    
    // 토큰 (String)
    if (token) formData.append('ssoToken', token); 
    
    // 타임스탬프 (String)
    formData.append('timestamp', new Date().toISOString());

    // 복잡한 객체(result)는 문자열로 변환해서 'resultJson'이라는 파라미터 1개에 담음
    formData.append('resultJson', JSON.stringify(data));

    const response = await fetch(CUCHEN_API_URL, {
      method: 'POST',
      headers: {
        // 헤더를 Form Data 타입으로 지정
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      // 변환된 폼 데이터 문자열 전송
      body: formData.toString(),
    });

    if (response.ok) {
      console.log("쿠첸온 전송 성공!");
    } else {
      console.error("쿠첸온 전송 실패:", response.status);
    }
  } catch (error) {
    console.error("데이터 전송 중 에러 발생:", error);
  }
}
