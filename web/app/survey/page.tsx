'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, ArrowLeftIcon } from '@/components/icons';
import { sendResultToCuchen } from '@/lib/api/cuchen';
import { submitSurveyData } from '@/lib/api/survey';
import { QUESTIONS } from '@/lib/constants';

export default function SurveyPage() {

    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [customAvoid, setCustomAvoid] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');
    const [modelKey, setModelKey] = useState('');
    const [deviceKey, setDeviceKey] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
        }

        const storedModelKey = localStorage.getItem('modelKey');
        if (storedModelKey) {
            setModelKey(storedModelKey);
        }

        const storedDeviceKey = localStorage.getItem('deviceKey');
        if (storedDeviceKey) {
            setDeviceKey(storedDeviceKey);
        }
    }, []);

    const handleChange = (id: string, value: string) => {
        setFormData((prev: any) => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async () => {
        const requiredFields = QUESTIONS.map(q => q.id);
        const missingFields = requiredFields.filter(id => {
            if (id === 'avoid_grains') return false;
            return !formData[id];
        });

        if (missingFields.length > 0) {
            alert("모든 설문 항목을 선택해주세요!");
            return;
        }

        setLoading(true);
        try {
            let finalAvoid = formData.avoid_grains;
            if (finalAvoid === '기입') {
                finalAvoid = customAvoid.trim() || '없음';
            }

            const payload = {
                ...formData,
                avoid_grains: finalAvoid ? [finalAvoid] : ['없음']
            };

            const data = await submitSurveyData(payload);
            setResult(data);

            sendResultToCuchen({
                type: 'survey',
                ...data
            });
        } catch (e) {
            alert("오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleRestart = () => {
        setResult(null);
        setFormData({});
        setCustomAvoid('');
    };

    const handleGoHome = () => {
        router.back();
    };

    const goBackToCuchen = () => {
        if (typeof window === 'undefined') return;

        // 1. 앱 네이티브 기능을 호출하기 위한 Custom Scheme 구성
        // iOS 코드 매칭: if let scheme = url.scheme, scheme == "cuchen"
        if (modelKey && deviceKey) {
            // 예: cuchen://start_cooking?modelKey=123&deviceKey=456
            const targetUrl = `cuchen://start_cooking?modelKey=${modelKey}&deviceKey=${deviceKey}`;

            console.log("앱 네이티브 명령 호출:", targetUrl);

            // 웹뷰가 이 URL로 이동을 시도하면, iOS Native Code가 이를 가로채서 실행합니다.
            window.location.href = targetUrl;
            return;
        }

        else {
            router.back();
        }
    };

    return (
        <div className="bg-[#F9FAFB] dark:bg-[#111827] text-[#111827] dark:text-[#F9FAFB] antialiased h-screen flex flex-col font-['Pretendard'] overflow-hidden">
            <header className="sticky top-0 z-10 bg-white/90 dark:bg-[#111827]/90 backdrop-blur-md border-b border-[#E5E7EB] dark:border-[#374151]">
                {/* 프로그레스 바: 설문 진행률 표시 (임시로 4/5 수준인 80% 적용) */}
                <div className="h-1 w-full bg-[#E5E7EB] dark:bg-[#374151]">
                    <div className="h-1 bg-[#FF6B00] w-4/5 rounded-r-full transition-all duration-300"></div>
                </div>
                <div className="flex items-center justify-between px-5 py-4">
                    <button
                        onClick={handleGoHome}
                        className="p-2 -ml-2 text-[#111827] dark:text-[#F9FAFB] hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div className="font-semibold text-lg">맞춤 잡곡 진단</div>
                    <div className="w-10"></div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto no-scrollbar px-5 pb-32">
                <div className="max-w-2xl mx-auto">
                    {!result ? (
                        <>
                            <div className="mt-8 mb-10">
                                <div className="inline-flex items-center justify-center bg-orange-100 dark:bg-orange-900/30 text-[#FF6B00] px-3 py-1 rounded-full text-sm font-semibold mb-4">
                                    <span>AI 진단</span>
                                </div>
                                <h1 className="text-2xl font-bold leading-tight mb-2">
                                    {userName ? `${userName}님,` : ''} 어떤 효과를 기대하시나요?
                                </h1>
                                <p className="text-[#6B7280] dark:text-[#9CA3AF] text-base">원하시는 건강 목표와 식감을 선택해주세요.</p>
                            </div>

                            <div className="space-y-8 animate-fade-in">
                                {QUESTIONS.map((q, idx) => (
                                    <div key={q.id}>
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className="text-[#FF6B00] font-bold">Q.{idx + 1}</span>
                                            <h3 className="font-bold text-lg">{q.label}</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {q.options.map((opt) => (
                                                <label key={opt} className="cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name={q.id}
                                                        checked={formData[q.id] === opt}
                                                        onChange={() => handleChange(q.id, opt)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className="h-full flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] shadow-sm peer-checked:border-[#FF6B00] peer-checked:border-2 peer-checked:text-[#FF6B00] hover:bg-orange-50 dark:hover:bg-orange-900/10 transition-colors text-center">
                                                        <span className={`font-semibold ${formData[q.id] === opt ? 'text-[#FF6B00]' : 'text-gray-700 dark:text-gray-200'}`}>
                                                            {opt}
                                                        </span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {q.id === 'avoid_grains' && formData['avoid_grains'] === '기입' && (
                                            <div className="mt-3 animate-fade-in">
                                                <input
                                                    type="text"
                                                    value={customAvoid}
                                                    onChange={(e) => setCustomAvoid(e.target.value)}
                                                    placeholder="직접 입력해주세요"
                                                    className="w-full p-4 rounded-xl bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] text-[#111827] dark:text-[#F9FAFB] focus:outline-none focus:border-[#FF6B00] transition-colors"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="animate-fade-in space-y-6 pb-20 mt-8">
                            <div className="bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] p-6 rounded-2xl shadow-sm">
                                <h2 className="text-xl font-bold mb-4 text-[#FF6B00]">추천 결과</h2>
                                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <h3 className="font-bold mb-3">추천 블렌드</h3>
                                    <ul className="space-y-2">
                                        {result?.blend?.map((item: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center bg-white dark:bg-[#1F2937] p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <span className="font-medium">{item.곡물}</span>
                                                <span className="font-bold text-[#FF6B00]">{item.비율}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-[#1F2937] border border-[#E5E7EB] dark:border-[#374151] p-6 rounded-2xl shadow-sm">
                                <h3 className="font-bold mb-3">추천 이유</h3>
                                <ul className="space-y-3">
                                    {result?.reasons?.map((r: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-sm leading-relaxed bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                                            <span className="text-[#FF6B00] font-bold">•</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4 pb-10">
                                <button
                                    onClick={handleRestart}
                                    className="w-full py-4 border border-[#E5E7EB] dark:border-[#374151] text-gray-500 dark:text-gray-400 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    ↺ 다시 하기
                                </button>
                                <button
                                    onClick={goBackToCuchen}
                                    className="w-full py-4 bg-[#FF6B00] text-white rounded-xl font-bold hover:bg-orange-600 transition-colors shadow-lg shadow-orange-500/20"
                                >
                                    취사하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {!result && (
                <div className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-white via-white to-transparent dark:from-[#111827] dark:via-[#111827] dark:to-transparent z-20">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-[#FF6B00] hover:bg-orange-600 text-white font-bold text-lg py-4 px-6 rounded-xl shadow-lg shadow-orange-500/30 transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? '분석 중...' : '결과 보기'}
                    </button>
                </div>
            )}
        </div>
    );
}