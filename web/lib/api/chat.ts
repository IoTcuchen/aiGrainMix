// lib/api/chat.ts
import { apiClient } from './core';
import type { AppState, ChatApiResponse } from '../types';

export async function sendChatMessage(message: string, appState: AppState): Promise<ChatApiResponse> {
    const data = await apiClient('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ message, appState }),
    });

    return {
        message: {
            id: data.message?.id || Date.now().toString(),
            role: 'bot',
            content: data.message?.content || data.content,
            recommendation: data.message?.recommendation,
        },
        appState: data.appState,
        isComplete: data.isComplete,
        debugLogs: data.debugLogs,
    };
}
