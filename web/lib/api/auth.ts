// lib/api/auth.ts
import { apiClient } from './core';

export async function exchangeSsoCode(code: string) {
    return apiClient('/api/auth/exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}
