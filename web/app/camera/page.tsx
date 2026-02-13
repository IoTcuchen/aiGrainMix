// app/camera/page.tsx 수정본
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImageAnalyzer from '@/components/ImageAnalyzer';
import { ArrowLeftIcon } from '@/components/icons';

export default function CameraPage() {
    const router = useRouter();
    const [analysisSummary, setAnalysisSummary] = useState<string>("");

    const handleAnalysisResult = (results: { label: string; score: number }[]) => {
        if (results.length > 0) {
            setAnalysisSummary(`인식된 재료: ${results[0].label}`);
        }
    };

    return (
        // ★ h-[100dvh]를 사용하여 툴바 크기 변화에 유연하게 대응하고 overflow-hidden으로 튕김 방지
        <div className="flex flex-col h-[100dvh] bg-gray-50 overflow-hidden fixed inset-0">

            {/* 상단 헤더: 고정 높이 */}
            <header className="flex items-center p-4 bg-white border-b shrink-0 z-30">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
                </button>
                <h1 className="ml-2 text-xl font-bold text-gray-800">식재료 인식</h1>
            </header>

            {/* 메인 콘텐츠 영역: 스크롤 가능하게 하되 바운스 억제 */}
            <main className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
                <div className="max-w-md mx-auto py-4">
                    <div className="px-6 mb-4">
                        <h2 className="text-lg font-semibold text-gray-700">
                            재료를 카메라에 비춰주세요
                        </h2>
                    </div>

                    <ImageAnalyzer onAnalysisResult={handleAnalysisResult} />

                    {analysisSummary && (
                        <div className="mt-4 px-6 pb-10">
                            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center shadow-sm">
                                <p className="text-green-800 font-medium mb-3">{analysisSummary}</p>
                                <button
                                    onClick={() => router.push('/chat')}
                                    className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg"
                                >
                                    이 재료로 추천받기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}