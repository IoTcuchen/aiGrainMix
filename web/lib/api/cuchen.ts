// lib/api/cuchen.ts
import { apiClient } from './core';

export async function sendResultToCuchen(data: any) {
    try {
        const token = localStorage.getItem('accessToken');
        const CUCHEN_API_URL = "/cuchen-proxy/api/saveResult.action";

        const formData = new URLSearchParams();
        if (token) formData.append('ssoToken', token);
        formData.append('timestamp', new Date().toISOString());
        formData.append('resultJson', JSON.stringify(data));

        await apiClient(CUCHEN_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        });
        console.log("쿠첸온 전송 성공!");
    } catch (error) {
        console.error("데이터 전송 중 에러 발생:", error);
    }
}

export async function sendCookCommand(params: {
    recipeKey: string;
    recipeNo: string;
    deviceKey: string;
    modelKey: string;
    accessToken: string;
}) {
    return apiClient('/api/cuchen/sendCommand', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}
