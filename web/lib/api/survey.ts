// lib/api/survey.ts
import { apiClient } from './core';

export async function submitSurveyData(formData: any) {
    return apiClient('/api/survey/submit', {
        method: 'POST',
        body: JSON.stringify(formData),
    });
}
