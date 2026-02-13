// web/lib/cuchenApi.ts

import { AiResult } from '@/types/cuchen';

/**
 * [프론트엔드용 함수]
 * 브라우저에서 Next.js API Route (/api/cuchen)를 호출합니다.
 * 실제 데이터 변환과 자바 서버 전송은 서버사이드(route.ts)에서 처리됩니다.
 */
export async function sendRecipeToLegacy(aiResult: AiResult) {
    try {
        // 1. Next.js 내부 API (/api/cuchen) 호출
        const response = await fetch('/api/cuchen', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(aiResult),
        });

        const result = await response.json();

        // 2. 응답 체크
        if (!response.ok || !result.success) {
            throw new Error(result.error || '레시피 전송 실패');
        }

        return result.data; // 자바 서버로부터 받은 성공 메시지 반환

    } catch (error) {
        console.error("API Route 호출 실패:", error);
        throw error;
    }
}