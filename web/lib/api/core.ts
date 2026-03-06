// lib/api/core.ts
export async function apiClient(endpoint: string, options: RequestInit = {}) {
    const isFormData = options.body instanceof FormData;
    const headers: Record<string, string> = {
        ...((options.headers as Record<string, string>) || {})
    };

    if (!isFormData && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(endpoint, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorData: any = {};
        try {
            errorData = await response.json();
        } catch (e) {
            // JSON 파싱 실패 무시
        }
        throw new Error(errorData.detail || errorData.message || errorData.error || 'Server error occurred');
    }

    const text = await response.text();
    return text ? JSON.parse(text) : {};
}
