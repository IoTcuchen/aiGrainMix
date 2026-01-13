'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SparklesIcon, ArrowLeftIcon } from '@/components/icons';
import { sendResultToCuchen } from '@/lib/apiClient';

const QUESTIONS = [
    { id: 'target_gender', label: '1. 주 섭취 대상 성별', options: ['남성', '여성', '혼성', '임산부'] },
    { id: 'target_age', label: '2. 주 섭취 대상 나이', options: ['10대 이하', '20-30대', '40-50대', '60대 이상'] },
    { id: 'texture_pref', label: '3. 선호식감', options: ['고슬밥', '찰진밥', '콩 없는 밥', '상관없음'] },
    { id: 'disease', label: '4. 질병 보유', options: ['당뇨병', '고혈압', '암 예방', '해당없음'] },
    { id: 'constitution1', label: '5. 체질 개선1', options: ['비만', '피로회복', '체내 염증 감소', '항산화/해당없음'] },
    { id: 'constitution2', label: '6. 체질 개선2', options: ['변비', '면역 강화', '간 건강', '혈중 콜레스테롤/해당없음'] },
    { id: 'expectation', label: '7. 효과 기대', options: ['골다공증', '치매 예방', '불면증', '해당 없음'] },
    { id: 'avoid_grains', label: '8. 기피곡물', options: ['없음', '기입', '대두 알러지', '글루텐 프리'] },
    { id: 'frequency', label: '9. 섭취 빈도', options: ['주 1~3회', '주 4~6회', '주 7~9회', '주 10회 이상'] },
];

export default function SurveyPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<any>({});
    const [customAvoid, setCustomAvoid] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const storedName = localStorage.getItem('userName');
        if (storedName) {
            setUserName(storedName);
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

            const res = await fetch('/api/survey/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) throw new Error('서버 통신 오류');

            const data = await res.json();
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

        const savedUrl = localStorage.getItem('returnUrl');
        // const urlParams = new URLSearchParams(window.location.search);
        // const paramUrl = urlParams.get('returnUrl');

        // const targetUrl = savedUrl || paramUrl;

        if (savedUrl) {
            // [핵심 수정] href -> replace
            window.location.replace(savedUrl);
        } else {
            router.back();
        }
    };

    return (
        <div className="h-screen flex flex-col bg-brand-primary text-brand-text relative overflow-hidden">

            {/* 헤더 */}
            <header className="flex-none p-4 border-b border-gray-200 shadow-sm flex items-center justify-between bg-brand-primary z-10">
                <div className="flex items-center gap-3">
                    <button onClick={handleGoHome} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
                    </button>
                    <SparklesIcon className="w-6 h-6 text-brand-accent" />
                    <h1 className="text-xl font-bold text-brand-text">
                        {userName ? `${userName}님` : ''} 맞춤 잡곡 진단
                    </h1>
                </div>
            </header>

            {/* 본문 */}
            <div className="flex-1 overflow-y-auto p-4 pb-10 scroll-smooth">
                <div className="max-w-2xl mx-auto">
                    {!result ? (
                        <div className="space-y-6 animate-fade-in">
                            {QUESTIONS.map((q) => (
                                <div key={q.id} className="bg-brand-secondary border border-gray-200 p-5 rounded-xl shadow-sm">
                                    <label className="block text-sm font-bold mb-3 text-brand-text">
                                        <span className="text-brand-accent mr-1">Q.</span>
                                        {q.label}
                                    </label>

                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => handleChange(q.id, opt)}
                                                className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${formData[q.id] === opt
                                                    ? 'bg-brand-accent border-brand-accent text-white shadow-md'
                                                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>

                                    {q.id === 'avoid_grains' && formData['avoid_grains'] === '기입' && (
                                        <div className="mt-3 animate-fade-in">
                                            <input
                                                type="text"
                                                value={customAvoid}
                                                onChange={(e) => setCustomAvoid(e.target.value)}
                                                placeholder="기피하는 곡물을 직접 입력해주세요"
                                                className="w-full p-3 rounded-lg bg-white border border-gray-300 text-brand-text placeholder-gray-400 focus:outline-none focus:border-brand-accent transition-colors"
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}

                            <div className="mt-12 pt-4">
                                <button
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-colors shadow-lg flex justify-center items-center gap-2
                                        ${loading
                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                            : 'bg-brand-accent text-white hover:bg-brand-accent-hover'
                                        }`}
                                >
                                    {loading ? '분석 중...' : '결과 보기'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-fade-in space-y-6 pb-10">
                            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-xl">
                                <h2 className="text-xl font-bold mb-4 text-brand-accent">추천 결과</h2>
                                <div className="bg-brand-secondary p-4 rounded-xl border border-gray-100">
                                    <h3 className="font-bold mb-3 text-brand-text">추천 블렌드</h3>
                                    <ul className="space-y-2">
                                        {result?.blend?.map((item: any, idx: number) => (
                                            <li key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200 shadow-sm">
                                                <span className="text-gray-700 font-medium">{item.곡물}</span>
                                                <span className="font-bold text-brand-accent">{item.비율}%</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-200 p-6 rounded-xl shadow-xl">
                                <h3 className="font-bold mb-3 text-brand-text">추천 이유</h3>
                                <ul className="space-y-3">
                                    {result?.reasons?.map((r: string, idx: number) => (
                                        <li key={idx} className="flex gap-3 text-gray-600 text-sm leading-relaxed bg-brand-secondary p-3 rounded-lg border border-gray-100">
                                            <span className="text-brand-accent mt-0.5 font-bold">•</span>
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-2 gap-3 mt-4">
                                <button
                                    onClick={handleRestart}
                                    className="w-full py-3 border border-gray-300 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-colors"
                                >
                                    ↺ 다시 하기
                                </button>
                                <button
                                    onClick={goBackToCuchen}
                                    className="w-full py-3 bg-brand-accent text-white rounded-xl font-bold hover:bg-brand-accent-hover transition-colors shadow-lg"
                                >
                                    취사하기
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}