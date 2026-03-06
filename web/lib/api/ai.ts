// lib/api/ai.ts
import { apiClient } from './core';

export async function analyzeImageWithAI(image: string) {
    return apiClient('/api/analyze', {
        method: 'POST',
        body: JSON.stringify({ image }),
    });
}

export async function convertSpeechToText(audioBlob: Blob, mimeType: string) {
    const formData = new FormData();
    formData.append('file', audioBlob, `voice.${mimeType.split('/')[1]}`);
    return apiClient('/api/stt', {
        method: 'POST',
        body: formData,
    });
}
