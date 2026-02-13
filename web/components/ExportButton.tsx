'use client';

import { useState } from 'react';
import { AiResult } from '@/types/cuchen';
import { sendRecipeToLegacy } from '@/lib/cuchenApi';

interface Props {
    aiResult: AiResult;
}

export default function ExportButton({ aiResult }: Props) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        if (!confirm('현재 레시피를 쿠첸온 앱으로 전송하시겠습니까?')) return;

        setLoading(true);
        try {
            const result = await sendRecipeToLegacy(aiResult);

            console.log("전송 결과:", result);

            // -----------------------------------------------------------
            // 데이터 경로 변경 (result.bean.status)
            // -----------------------------------------------------------
            // 자바 서버 응답 구조: { bean: { status: "success", message: "..." }, success: true }
            const responseData = result.bean || result;

            if (responseData.status === 'success') {
                alert(`전송 성공! (${responseData.message})`);
            } else {
                alert(`전송 실패: ${responseData.message || '알 수 없는 오류'}`);
            }

        } catch (error: any) {
            console.error("에러 발생:", error);
            alert(`오류 발생: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleExport}
            disabled={loading}
            className={`
        w-full mt-2 px-4 py-2 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2
        ${loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-orange-600 hover:bg-orange-700 active:scale-95 shadow-md'}
      `}
        >
            {loading ? (
                <span>🔄 전송 중...</span>
            ) : (
                <>
                    <span>📤</span>
                    <span>쿠첸 앱으로 레시피 보내기</span>
                </>
            )}
        </button>
    );
}