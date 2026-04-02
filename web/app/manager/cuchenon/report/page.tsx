'use client';

import React, { useState, useEffect } from 'react';
import {
    FileText,
    Zap,
    Loader2,
    CheckCircle2,
    Calendar,
    Search,
    BrainCircuit,
    ChevronRight,
    ArrowRightCircle,
    Printer,
    Download
} from 'lucide-react';

export default function AIReportPage() {
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [step, setStep] = useState(0);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        let s = localStorage.getItem('dashStart');
        let e = localStorage.getItem('dashEnd');

        const today = new Date();
        const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

        if (!s) {
            const startObj = new Date(today.getFullYear(), 0, 1);
            s = new Date(startObj.getTime() - (startObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            localStorage.setItem('dashStart', s);
        }
        if (!e) {
            e = todayStr;
            localStorage.setItem('dashEnd', e);
        }

        setStartDate(s);
        setEndDate(e);
    }, []);

    const handleSearch = () => {
        localStorage.setItem('dashStart', startDate);
        localStorage.setItem('dashEnd', endDate);
        generateReport();
    };

    const generateReport = async () => {
        if (!startDate || !endDate) return;

        setLoading(true);
        setReport(null);
        setStep(1);

        try {
            // Simulated steps for UI feedback as sequentially fetching happens
            const timer = setInterval(() => {
                setStep(prev => prev < 4 ? prev + 1 : prev);
            }, 3000);

            const res = await fetch(`/api/manager/ai-report?startDate=${startDate}&endDate=${endDate}`);
            const data = await res.json();

            clearInterval(timer);
            setStep(5);

            if (data.report) {
                setReport(data.report);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        "분석 데이터 수집 준비",
        "기기 및 취사 통계 데이터 순차적 수집 중...",
        "수집된 데이터 가공 및 정밀 분석 중...",
        "AI 리포트 생성 및 인사이트 도출 중...",
        "리포트 생성 완료"
    ];

    if (!mounted) return null;

    return (
        <div className="space-y-8 pb-20 animate-in fade-in duration-700 font-['Pretendard']">
            {/* Standard Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                        <FileText className="text-orange-600" /> AI 분석 리포트
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        데이터를 순차적으로 분석하여 인공지능이 작성한 비즈니스 리포트를 생성합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-200"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-orange-600/20 active:scale-95"
                    >
                        <Zap size={16} /> 리포트 생성
                    </button>
                </div>
            </div>

            {!report && !loading && (
                <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-[#1F2937] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
                        <BrainCircuit className="text-orange-600 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">분석을 시작해 주세요</h3>
                    <p className="text-gray-500 text-center max-w-md px-4">
                        상단의 날짜를 선택하고 '리포트 생성' 버튼을 클릭하면,<br />
                        AI가 수백만 건의 데이터를 순차적으로 분석하여 인사이트를 도출합니다.
                    </p>
                </div>
            )}

            {loading && (
                <div className="bg-white dark:bg-[#1F2937] p-10 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-8">
                        <div className="absolute inset-0 border-4 border-orange-100 dark:border-orange-900/30 rounded-full animate-pulse"></div>
                        <div className="absolute inset-0 border-t-4 border-orange-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="text-orange-600 animate-spin" size={32} />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-6">AI 분석 리포트 생성 중...</h3>

                    <div className="w-full max-w-md space-y-4">
                        {steps.map((s, i) => (
                            <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${step > i + 1 ? 'opacity-100' : step === i + 1 ? 'opacity-100 font-bold' : 'opacity-30'}`}>
                                {step > i + 1 ? (
                                    <CheckCircle2 size={18} className="text-green-500" />
                                ) : step === i + 1 ? (
                                    <Loader2 size={18} className="text-orange-600 animate-spin" />
                                ) : (
                                    <div className="w-[18px] h-[18px] rounded-full border-2 border-gray-300"></div>
                                )}
                                <span className="text-sm">{s}</span>
                            </div>
                        ))}
                    </div>

                    <p className="mt-10 text-xs text-gray-400">
                        * 대량의 데이터를 순차적으로 처리하므로 최대 30초~1분 정도 소요될 수 있습니다.
                    </p>
                </div>
            )}

            {report && (
                <div className="bg-white dark:bg-[#1F2937] rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in slide-in-from-bottom-5 duration-700">
                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <div className="flex items-center gap-2 text-orange-400 text-sm font-bold mb-2 uppercase tracking-widest">
                                <Zap size={14} /> AI Analysis Insight
                            </div>
                            <h3 className="text-2xl font-bold italic font-serif">Cuchen IoT Service Intelligence Report</h3>
                            <p className="text-gray-400 text-sm mt-1">Period: {startDate} ~ {endDate}</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20">
                                <Printer size={18} />
                            </button>
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/20">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="p-8 md:p-12">
                        <div className="prose dark:prose-invert max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed font-['Pretendard']">
                                {report}
                            </div>
                        </div>

                        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-400">
                            <div>Generated by Cuchen AI Intelligence Engine (GPT-4o)</div>
                            <div>Copyright © Cuchen Co., Ltd. All rights reserved.</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
