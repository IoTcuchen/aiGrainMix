// lib/api/cooking.ts
import { apiClient } from './core';

export async function getRecipes(deviceKey: string, modelKey: string) {
    return apiClient(`/api/recipes?deviceKey=${deviceKey}&modelKey=${modelKey}`);
}

export async function analyzeCookingStatus(messages: any[], appState: any) {
    return apiClient('/api/cooking/analyze', {
        method: 'POST',
        body: JSON.stringify({ messages, appState }),
    });
}
