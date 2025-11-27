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