'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { HelpCircle, Smartphone, Clock, BarChart2, Zap } from 'lucide-react';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

interface SmartControlDashboardProps {
    externalData?: { metrics: any; startDate: string; endDate: string };
    hideHeader?: boolean;
}

export function SmartControlDashboard({ externalData, hideHeader }: SmartControlDashboardProps = {}) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        appCtrlRatio: { app: 0, manual: 0, total: 1 },
        resvTimeTrend: [],
        modelAppRatio: [],
        hourlyTrend: []
    });

    const fetchMetrics = async (start: string, end: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/manager/metrics?tab=smart&startDate=${start}&endDate=${end}`);
            const data = await res.json();

            if (!data.error) {
                setMetrics({
                    ...data,
                    hourlyTrend: data.hourlyTrend || []
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        if (externalData) {
            setStartDate(externalData.startDate || '');
            setEndDate(externalData.endDate || '');
            if (externalData.metrics) setMetrics({ ...externalData.metrics, hourlyTrend: externalData.metrics.hourlyTrend || [] });
            setLoading(false);
            return;
        }
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
    }, [externalData]);

    const handleSearch = () => {
        if (startDate && endDate) {
            const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
            // if (diffDays > 184) {
            //     alert('최대 조회 기간은 6개월입니다.\nDB 고부하를 방지하기 위해 최대 6개월까지 설정 가능합니다.');
            //     return;
            // }
            localStorage.setItem('dashStart', startDate);
            localStorage.setItem('dashEnd', endDate);
            fetchMetrics(startDate, endDate);
        }
    };

    const handleAllTime = () => {
        const today = new Date();
        const endStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
        const startStr = '2022-08-01';

        setStartDate(startStr);
        setEndDate(endStr);
        localStorage.setItem('dashStart', startStr);
        localStorage.setItem('dashEnd', endStr);
        fetchMetrics(startStr, endStr);
    };

    const setStartByMonth = (m: string) => setStartDate(m ? `${m}-01` : '');
    const setEndByMonth = (m: string) => {
        if (!m) { setEndDate(''); return; }
        const today = new Date();
        const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        if (m === todayMonth) {
            setEndDate(`${m}-${String(today.getDate()).padStart(2, '0')}`);
            return;
        }
        const [y, mo] = m.split('-').map(Number);
        setEndDate(`${m}-${String(new Date(y, mo, 0).getDate()).padStart(2, '0')}`);
    };

    if (!mounted) return null;

    const { appCtrlRatio, resvTimeTrend, modelAppRatio, hourlyTrend } = metrics;
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';
    const appRatioPercent = appCtrlRatio?.total > 0 ? Math.round((appCtrlRatio.app / appCtrlRatio.total) * 100) : 0;

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible">
            {!hideHeader && (
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Smartphone className="text-orange-600" /> 스마트 제어 분석
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        어플리케이션을 통한 원격 제어의 활용도를 분석합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={startDate.slice(0, 7)}
                            onChange={(e) => setStartByMonth(e.target.value)}
                            className="bg-transparent border-none text-sm font-medium focus:ring-0 text-gray-700 dark:text-gray-300 w-[130px]"
                        />
                        <span className="text-gray-400">~</span>
                        <input
                            type="month"
                            value={endDate.slice(0, 7)}
                            onChange={(e) => setEndByMonth(e.target.value)}
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
            )}

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-visible">
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col justify-center overflow-visible">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Smartphone className="text-[#10B981]" size={18} />
                                        스마트 앱 제어 비율
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">앱을 통한 원격 실행 비율</p>
                                        <InfoTooltip text="전체 취사 건수 중 스마트폰 앱으로 제어한 비율을 측정합니다." />
                                    </div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="mb-6"></div>

                            <div className="flex justify-between items-end mb-2">
                                <span className="text-4xl font-black text-[#10B981]">{appRatioPercent}%</span>
                                <span className="text-sm font-medium text-gray-500 mb-1">({appCtrlRatio?.app?.toLocaleString()} / {appCtrlRatio?.total?.toLocaleString()} 건)</span>
                            </div>

                            <div className="w-full h-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex">
                                <div className="h-full bg-[#10B981] transition-all duration-1000 ease-out" style={{ width: appRatioPercent + '%' }}></div>
                                <div className="h-full bg-orange-400 transition-all duration-1000 ease-out" style={{ width: (100 - appRatioPercent) + '%' }}></div>
                            </div>

                            <div className="flex justify-between mt-4">
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-[#10B981]"></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">앱 제어 (Y)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="w-3 h-3 rounded-full bg-orange-400"></span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">수동 제어 (N)</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Zap className="text-[#3B82F6]" size={18} />
                                        시간대별 방식 제어 (앱 vs 수동)
                                    </h3>
                                    <InfoTooltip text="시간대별로 앱 제어 성능과 수동 조작 성능을 비교 분석합니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={hourlyTrend} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={1} />
                                        <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#F59E0B', fontSize: 12 }} dx={-10} />
                                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#3B82F6', fontSize: 12 }} dx={10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Line yAxisId="left" name="수동 취사 (Manual)" type="monotone" dataKey="manualCount" stroke="#F59E0B" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} />
                                        <Line yAxisId="right" name="앱 제어 취사 (App)" type="monotone" dataKey="appCount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 mt-6 overflow-visible">
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart2 className="text-[#3B82F6]" size={18} />
                                        기기 모델별 스마트 제어 비율 (Top 10)
                                    </h3>
                                    <InfoTooltip text="어느 기기 모델이 IoT 기능을 가장 활발하게 사용하는지 탑 10을 선정합니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={modelAppRatio} margin={{ top: 5, right: 0, bottom: 5, left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} />
                                        <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    const app = payload[0].value;
                                                    const manual = payload[1].value;
                                                    const total = app + manual;
                                                    const pct = total > 0 ? ((app / total) * 100).toFixed(1) : 0;
                                                    return (
                                                        <div className="bg-white dark:bg-[#1F2937] p-3 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 font-['Pretendard']">
                                                            <p className="text-[12px] font-bold text-gray-900 dark:text-white mb-2">{payload[0].payload.name}</p>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center gap-4 text-[11px]"><span className="text-blue-600 font-bold">앱 제어</span><span className="font-mono text-gray-700 dark:text-gray-300">{app.toLocaleString()} 건</span></div>
                                                                <div className="flex justify-between items-center gap-4 text-[11px]"><span className="text-red-400 font-bold">수동 취사</span><span className="font-mono text-gray-700 dark:text-gray-300">{manual.toLocaleString()} 건</span></div>
                                                                <div className="border-t border-gray-50 dark:border-gray-800 pt-1 mt-1 flex justify-between items-center gap-4 text-[11px] font-black"><span className="text-gray-900 dark:text-white">앱 비중</span><span className="text-[#FF6B00]">{pct}%</span></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                        <Bar name="앱 제어 취사량" dataKey="app" stackId="a" fill="#3B82F6" barSize={24} />
                                        <Bar name="수동 취사량" dataKey="manual" stackId="a" fill="#FCA5A5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
