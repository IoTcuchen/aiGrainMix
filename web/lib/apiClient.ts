import {
  AppState,
  BaseApiResponse,
  ChatResponseData,
  CookingAnalyzeData,
  CookingAppState,
  CookingMessage,
  CuchenSaveResultPayload,
  ImageAnalyzeResult,
  RecipeItem,
  SttData,
  SurveyQuestionPayload,
  SurveySubmitData,
} from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const DEFAULT_TIMEOUT_MS = 15000;

const ENDPOINTS = {
  chat: `${API_BASE_URL}/chat`,
  surveySubmit: `${API_BASE_URL}/survey/submit`,
  cookingAnalyze: `${API_BASE_URL}/cooking/analyze`,
  recipes: `${API_BASE_URL}/recipes`,
  stt: `${API_BASE_URL}/stt`,
  analyzeImage: `${API_BASE_URL}/analyze`,
} as const;

class ApiClientError extends Error {
  code: string;
  retryable: boolean;

  constructor(code: string, message: string, retryable = true) {
    super(message);
    this.code = code;
    this.retryable = retryable;
  }
}

async function requestJson<T>(url: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<BaseApiResponse<T>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        ok: false,
        error: {
          code: payload?.code || `HTTP_${response.status}`,
          message: payload?.detail || payload?.error || payload?.message || '요청 처리에 실패했습니다.',
          retryable: response.status >= 500,
        },
      };
    }

    return { ok: true, data: payload as T };
  } catch (error) {
    const isAbort = error instanceof DOMException && error.name === 'AbortError';
    return {
      ok: false,
      error: {
        code: isAbort ? 'TIMEOUT' : 'NETWORK_ERROR',
        message: isAbort ? '요청 시간이 초과되었습니다.' : '네트워크 오류가 발생했습니다.',
        retryable: true,
      },
    };
  } finally {
    clearTimeout(timer);
  }
}

function unwrap<T>(result: BaseApiResponse<T>): T {
  if (result.ok && result.data !== undefined) {
    return result.data;
  }

  const error = result.error || {
    code: 'UNKNOWN',
    message: '알 수 없는 오류가 발생했습니다.',
    retryable: true,
  };

  throw new ApiClientError(error.code, error.message, error.retryable);
}

export async function sendChatMessage(message: string, appState: AppState): Promise<ChatResponseData> {
  const result = await requestJson<ChatResponseData>(
    ENDPOINTS.chat,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, appState }),
    },
    25000,
  );

  const data = unwrap(result);
  return {
    ...data,
    message: {
      ...data.message,
      id: data.message?.id || Date.now().toString(),
      role: 'bot',
      content: data.message?.content || '',
    },
  };
}

export async function submitSurvey(formData: SurveyQuestionPayload): Promise<SurveySubmitData> {
  const result = await requestJson<SurveySubmitData>(ENDPOINTS.surveySubmit, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData),
  });
  return unwrap(result);
}

export async function analyzeCookingConversation(
  messages: CookingMessage[],
  appState: CookingAppState,
): Promise<CookingAnalyzeData> {
  const result = await requestJson<CookingAnalyzeData>(
    ENDPOINTS.cookingAnalyze,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, appState }),
    },
    25000,
  );
  return unwrap(result);
}

export async function fetchRecipes(deviceKey: string, modelKey: string): Promise<RecipeItem[]> {
  const params = new URLSearchParams({ deviceKey, modelKey });
  const result = await requestJson<RecipeItem[]>(`${ENDPOINTS.recipes}?${params.toString()}`, {
    method: 'GET',
  });
  return unwrap(result);
}

export async function transcribeAudio(formData: FormData): Promise<SttData> {
  const result = await requestJson<SttData>(ENDPOINTS.stt, {
    method: 'POST',
    body: formData,
  }, 30000);
  return unwrap(result);
}

export async function analyzeImageData(image: string): Promise<ImageAnalyzeResult[]> {
  const result = await requestJson<ImageAnalyzeResult[]>(ENDPOINTS.analyzeImage, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image }),
  }, 25000);
  return unwrap(result);
}

export async function sendResultToCuchen(data: CuchenSaveResultPayload): Promise<void> {
  const token = localStorage.getItem('accessToken');
  const formData = new URLSearchParams();

  if (token) {
    formData.append('ssoToken', token);
  }
  formData.append('timestamp', new Date().toISOString());
  formData.append('resultJson', JSON.stringify(data));

  const response = await fetch('/cuchen-proxy/api/saveResult.action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new ApiClientError('CUCHEN_SAVE_FAILED', '쿠첸온 결과 전송에 실패했습니다.', true);
  }
}

export async function sendCookCommand(
  payload: URLSearchParams,
  accessToken: string,
  serviceIdentifier: string,
): Promise<any> {
  const response = await fetch('/cuchenon/api/sendCommand.action?event=sendCommand', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Service-Identifier': serviceIdentifier,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    },
    body: payload,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiClientError('COOK_COMMAND_FAILED', data?.message || '취사 명령 요청에 실패했습니다.', true);
  }

  return data;
}

export function isApiClientError(error: unknown): error is ApiClientError {
  return error instanceof ApiClientError;
}
