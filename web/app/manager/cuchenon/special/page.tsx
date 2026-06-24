'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Target, HelpCircle } from 'lucide-react';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

export default function SpecialTaskDashboard() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        specialTrend: []
    });

    const fetchMetrics = (start: string, end: string) => {
        setLoading(true);
        fetch(`/api/manager/metrics?tab=special&startDate=${start}&endDate=${end}`)
            .then(res => res.json())
            .then(data => {
                if (!data.error) setMetrics(data);
                setLoading(false);
            })
            .catch(e => {
                console.error(e);
                setLoading(false);
            });
    };

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
        fetchMetrics(s, e);
    }, []);

    const handleSearch = () => {
        if (startDate && endDate) {
            localStorage.setItem('dashStart', startDate);
            localStorage.setItem('dashEnd', endDate);
            fetchMetrics(startDate, endDate);
        }
    };

    if (!mounted) return null;

    const { specialTrend } = metrics;
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible">
            {/* Header & Date Picker */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Target className="text-orange-600" /> 과제특화
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        설정 기간 동안 월별 백미와 잡곡의 누적 취사량을 비교 분석합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-300 w-[130px]"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-300 w-[130px]"
                        />
                        <button
                            onClick={handleSearch}
                            className="ml-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all font-bold text-sm shadow-sm"
                        >
                            조회
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 mt-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div className="flex items-center gap-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">백미 vs 잡곡 누적 취사 기울기 비교</h3>
                                <InfoTooltip text={"조회 기간 전체에 걸친 월별 백미(찰진+고슬)와 잡곡의 누적 취사 건수 트렌드와 그 상승 기울기(월 평균 증가량)를 비교합니다."} />
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                        </div>

                        {specialTrend && specialTrend.length > 1 && (
                            <div className="flex gap-4 mb-6">
                                <div className="flex-1 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30">
                                    <p className="text-sm font-semibold text-orange-800 dark:text-orange-400 mb-1">백미 월 평균 상승 기울기</p>
                                    <div className="flex items-end gap-1">
                                        <h4 className="text-2xl font-bold text-orange-600 dark:text-orange-500">
                                            +{Math.round((specialTrend[specialTrend.length - 1].whiteRice - specialTrend[0].whiteRice) / Math.max(1, specialTrend.length - 1)).toLocaleString()}
                                        </h4>
                                        <span className="text-sm font-medium text-orange-600/70 dark:text-orange-500/70 mb-1">건 / 월</span>
                                    </div>
                                </div>
                                <div className="flex-1 bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-400 mb-1">잡곡 월 평균 상승 기울기</p>
                                    <div className="flex items-end gap-1">
                                        <h4 className="text-2xl font-bold text-emerald-600 dark:text-emerald-500">
                                            +{Math.round((specialTrend[specialTrend.length - 1].mixedGrains - specialTrend[0].mixedGrains) / Math.max(1, specialTrend.length - 1)).toLocaleString()}
                                        </h4>
                                        <span className="text-sm font-medium text-emerald-600/70 dark:text-emerald-500/70 mb-1">건 / 월</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="h-[450px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={specialTrend} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                    <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={10} />
                                    <Tooltip
                                        formatter={(value: any, name: any) => [value.toLocaleString() + ' 회', name === 'whiteRice' ? '백미 (누적)' : '잡곡 (누적)']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#FF6B00', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Legend verticalAlign="top" height={36} formatter={(value: any) => <span className="font-medium text-gray-700 dark:text-gray-300 ml-1">{value === 'whiteRice' ? '백미' : '잡곡'}</span>} />
                                    <Line yAxisId="left" name="whiteRice" type="monotone" dataKey="whiteRice" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, fill: '#FF6B00', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#FF6B00', stroke: '#fff', strokeWidth: 2 }} />
                                    <Line yAxisId="right" name="mixedGrains" type="monotone" dataKey="mixedGrains" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
