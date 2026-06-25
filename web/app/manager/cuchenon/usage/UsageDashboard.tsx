'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, Cell, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { HelpCircle, Clock, Calendar, Hash, BarChart3, Database, TrendingUp, Heart, Zap } from 'lucide-react';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

const renderCustomBarLabel = (props: any, total: number, isVertical: boolean) => {
    const { x, y, width, height, value } = props;
    if (value === undefined || value === null) return null;
    const percentage = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
    if (isVertical) {
        return (
            <text x={x + width + 5} y={y + height / 2 + 1} fill="#6B7280" textAnchor="start" dominantBaseline="central" fontSize={11} fontWeight={600}>
                {Number(value).toLocaleString()}회 / {percentage}%
            </text>
        );
    } else {
        return (
            <text x={x + width / 2} y={y - 10} fill="#6B7280" textAnchor="middle" dominantBaseline="auto" fontSize={11} fontWeight={600}>
                {Number(value).toLocaleString()}회 / {percentage}%
            </text>
        );
    }
};

/** 레시피 이름 정규화 (백미찰진밥 -> 찰진백미 등) */
function normalizeRecipeName(name: string | null): string {
    if (!name) return '기타';
    const n = name.trim();
    if (n.includes('백미찰진밥') || n.includes('찰진백미')) return '찰진백미';
    if (n.includes('백미고슬밥') || n.includes('고슬백미')) return '고슬백미';
    if (n.includes('혼합잡곡밥') || n.includes('혼합잡곡')) return '혼합잡곡';
    if (n.includes('백미쾌속')) return '백미쾌속';
    if (n.includes('가마솥밥')) return '가마솥밥';
    if (n.includes('현미100')) return '현미100';
    if (n.includes('잡곡쾌속')) return '잡곡쾌속';
    return n;
}

/** 레시피 명칭 통합 및 카운트 합산 (클라이언트용) */
function consolidateRecipes(rows: any[], limit = 15) {
    if (!rows) return [];
    const map = new Map<string, number>();
    rows.forEach(r => {
        const name = normalizeRecipeName(r.name);
        map.set(name, (map.get(name) || 0) + (Number(r.count) || 0));
    });
    return Array.from(map.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);
}

interface UsageDashboardProps {
    externalData?: { metrics: any; startDate: string; endDate: string };
    hideHeader?: boolean;
}

export function UsageDashboard({ externalData, hideHeader }: UsageDashboardProps = {}) {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        topRecipes: [],
        topRecipesWeekly: [],
        functionRanking: [],
        hourlyTrend: [],
        warmTimeStatus: [],
        dayOfWeekTrend: [],
        soakSteamDetails: [],
        servingSizeTrend: [],
        customTasteTrend: [],
        resvTimeTrend: [],
        dayOfWeekDetails: {},
        topAppRecipes: []
    });

    const fetchMetrics = (start: string, end: string) => {
        setLoading(true);
        fetch(`/api/manager/metrics?tab=usage&startDate=${start}&endDate=${end}`)
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
        if (externalData) {
            setStartDate(externalData.startDate || '');
            setEndDate(externalData.endDate || '');
            if (externalData.metrics) setMetrics(externalData.metrics);
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

    const {
        topRecipes, hourlyTrend, warmTimeStatus, dayOfWeekTrend,
        soakSteamDetails, servingSizeTrend, customTasteTrend, resvTimeTrend,
        dayOfWeekDetails, topAppRecipes
    } = metrics;
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible">
            {!hideHeader && (
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <TrendingUp className="text-orange-600" /> 사용 패턴 통계
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            사용자들의 선호 메뉴, 취사 시간대 및 인분 수 조절 패턴 등 실측 데이터를 기반으로 분석합니다.
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
                    {/* 상단 요약 표 2종 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 주간 평균 취사 빈도 TOP 5 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Zap className="text-orange-500" size={18} />
                                    주 사용 메뉴 TOP 5 (주간 평균 빈도)
                                </h3>
                                <InfoTooltip text="설정된 기간 동안의 총 취사 횟수를 주 단위로 환산한 평균 빈도입니다.\n(총 횟수 / 기간일수 * 7일)" />
                            </div>
                            <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">순위</th>
                                            <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">메뉴명</th>
                                            <th className="px-4 py-3 text-right font-semibold text-orange-600">주평균 빈도</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {(metrics.topRecipesWeekly || []).map((r: any, idx: number) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{r.name}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-orange-600 bg-orange-50/30 dark:bg-orange-900/10">
                                                    {r.avgWeekly} 회/주
                                                </td>
                                            </tr>
                                        ))}
                                        {(!metrics.topRecipesWeekly || metrics.topRecipesWeekly.length === 0) && (
                                            <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 주요 메뉴 외 기능 랭킹 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Zap className="text-purple-500" size={18} />
                                    메뉴 외 주요 기능 사용 랭킹
                                </h3>
                                <InfoTooltip text="보온, 예약, 내솥불림, 자동세척 등 일반 취사 메뉴 외 기능들의 사용 빈도 랭킹입니다." />
                            </div>
                            <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">순위</th>
                                            <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">기능명</th>
                                            <th className="px-4 py-3 text-right font-semibold text-purple-600">사용 횟수</th>
                                            <th className="px-4 py-3 text-right font-semibold text-orange-500">어플 제어</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {(metrics.functionRanking || []).map((f: any, idx: number) => {
                                            const hasAppInfo = f.name === '보온' || f.name === '내솥불림';
                                            const appPercentage = hasAppInfo && f.count > 0 ? ((f.appCount / f.count) * 100).toFixed(1) : null;

                                            return (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-[13px]">
                                                    <td className="px-4 py-3 font-bold text-gray-400">{idx + 1}</td>
                                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{f.name}</td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold text-purple-600">
                                                        {(f.count || 0).toLocaleString()} 건
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-mono font-bold">
                                                        {appPercentage ? (
                                                            <span className="text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded">
                                                                {appPercentage}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-300">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {(!metrics.functionRanking || metrics.functionRanking.length === 0) && (
                                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">데이터가 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 요일별 취사 행동 분석 */}
                    <DayOfWeekBehaviorDetails data={dayOfWeekDetails} />

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible">
                        {/* 1. 인기 취사 메뉴 랭킹 (전체) */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="text-[#FF6B00]" size={18} />
                                        인기 취사 메뉴 랭킹 (전체)
                                    </h3>
                                    <InfoTooltip text="조회 기간 동안 사용자들이 가장 많이 선택한 모든 취사 메뉴 TOP 15입니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {(() => {
                                        const consolidated = consolidateRecipes(topRecipes);
                                        const total = (topRecipes || []).reduce((sum: number, r: any) => sum + (Number(r.count) || 0), 0);
                                        return (
                                            <BarChart data={consolidated} layout="vertical" margin={{ top: 5, right: 90, bottom: 5, left: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                                <XAxis type="number" axisLine={false} tickLine={false} hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} dx={-10} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value: any) => {
                                                        const p = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                                                        return [`${value.toLocaleString()} 회 (${p}%)`, '취사 수'];
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="#FF6B00" radius={[0, 6, 6, 0]} barSize={24}>
                                                    {consolidated.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={index === 0 ? '#FF6B00' : '#FCA5A5'} />)}
                                                    <LabelList dataKey="count" content={(props: any) => renderCustomBarLabel(props, total, true)} />
                                                </Bar>
                                            </BarChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 2. 인기 취사 메뉴 랭킹 (어플 제어) */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Zap className="text-orange-500" size={18} />
                                        인기 취사 메뉴 랭킹 (어플 주도)
                                    </h3>
                                    <InfoTooltip text="조회 기간 동안 '어플리케이션(App) 제어'를 통해 실행된 취사 메뉴 TOP 15입니다." />
                                </div>
                                <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded-md">Smart App</span>
                            </div>
                            <div className="h-[450px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    {(() => {
                                        const consolidated = consolidateRecipes(topAppRecipes);
                                        const total = (topAppRecipes || []).reduce((sum: number, r: any) => sum + (Number(r.count) || 0), 0);
                                        return (
                                            <BarChart data={consolidated} layout="vertical" margin={{ top: 5, right: 90, bottom: 5, left: 30 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                                <XAxis type="number" axisLine={false} tickLine={false} hide />
                                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} dx={-10} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }}
                                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    formatter={(value: any) => {
                                                        const p = total > 0 ? ((Number(value) / total) * 100).toFixed(1) : '0.0';
                                                        return [`${value.toLocaleString()} 회 (${p}%)`, '취사 수'];
                                                    }}
                                                />
                                                <Bar dataKey="count" fill="#F97316" radius={[0, 6, 6, 0]} barSize={24}>
                                                    {consolidated.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={index === 0 ? '#F97316' : '#FED7AA'} />)}
                                                    <LabelList dataKey="count" content={(props: any) => renderCustomBarLabel(props, total, true)} />
                                                </Bar>
                                            </BarChart>
                                        );
                                    })()}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
                        {/* 3. 요일별 누적 취사량 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col overflow-visible">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Calendar className="text-[#8B5CF6]" size={18} />
                                    요일별 누적 취사량
                                </h3>
                                <InfoTooltip text="요일별 전체 취사 횟수를 집계하여 어느 요일의 사용 빈도가 높은지 분석합니다." />
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">어느 요일에 가장 많이 사용하는지 요일별 비교</p>
                            <div className="flex-1 min-h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dayOfWeekTrend} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 14, fontWeight: 600 }} dx={-10} />
                                        <Tooltip cursor={{ fill: 'rgba(139, 92, 246, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [value.toLocaleString() + ' 건', '취사 수']} />
                                        <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>
                                            {dayOfWeekTrend?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={(entry.name === '토' || entry.name === '일') ? '#A78BFA' : '#8B5CF6'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 4. 시간대별 활동량 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Clock className="text-[#10B981]" size={18} />
                                    시간대별 단일 누적 트렌드
                                </h3>
                                <InfoTooltip text="24시간 중 어느 시간대에 취사가 집중되는지 시간대별 활동량을 보여줍니다." />
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={hourlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={2} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                        <Tooltip formatter={(value: any) => [value.toLocaleString() + ' 회', '취사 수']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                        <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
                        {/* 5. 예약 설정 시간대 패턴 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Clock className="text-[#8B5CF6]" size={18} />
                                        예약 설정 시간대 패턴
                                    </h3>
                                    <InfoTooltip text="사용자들이 예약 취사 기능을 어느 시간대에 가장 많이 설정하는지 분석합니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={resvTimeTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={1} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }} formatter={(value: any) => [value.toLocaleString() + ' 건', '예약 설정 수']} />
                                        <Line name="예약 횟수" type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 6. 보온 시간 분포 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Database className="text-[#3B82F6]" size={18} />
                                    보온 시간 분포 (시간대별)
                                </h3>
                                <InfoTooltip text="취사 완료 후 보온 상태가 얼마나 지속되는지 시간대별 분포를 보여줍니다." />
                                <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">보온 사용 현황</span>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={warmTimeStatus} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                        <Tooltip cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [value.toLocaleString() + ' 건', '보온 로그 수']} />
                                        <Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
                        {/* 7. 취사 인분 수 추이 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <TrendingUp className="text-[#F43F5E]" size={18} />
                                        취사 인분 수 추이
                                    </h3>
                                    <InfoTooltip text="가장 많이 요리되는 인분 수(규모)를 분석하여 주력 제품 용량을 예측합니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={servingSizeTrend} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} />
                                        <Tooltip cursor={{ fill: 'rgba(244, 63, 94, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [value.toLocaleString() + ' 건', '취사량']} />
                                        <Bar name="취사량" dataKey="count" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 8. 맞춤형 밥맛 실사용률 */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col overflow-visible">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <Heart className="text-[#F59E0B]" size={18} />
                                        맞춤형 밥맛 실사용률
                                    </h3>
                                    <InfoTooltip text="기본 취사 기능 외에 '불림' 또는 '뜸' 단계를 조절하여 사용하는 고급 사용자의 비율입니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">기본 세팅 외 디테일 밥맛 조절 기능 사용 빈도</p>
                            <div className="flex-1 min-h-[200px] relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={customTasteTrend} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                                            <Cell fill="#F59E0B" />
                                            <Cell fill="#10B981" />
                                            <Cell fill="#E5E7EB" />
                                        </Pie>
                                        <Tooltip formatter={(value: any) => value.toLocaleString() + ' 건'} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-center gap-4 mt-2">
                                {customTasteTrend?.map((entry: any, idx: number) => (
                                    <div key={entry.name} className="flex items-center gap-1">
                                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#F59E0B', '#10B981', '#E5E7EB'][idx] }}></span>
                                        <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">{entry.name} ({entry.value?.toLocaleString()})</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 mt-6 overflow-visible animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Hash className="text-gray-400" size={18} />
                                    메뉴별 불림/뜸 단계 교차 분석
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        주요 메뉴별로 불림과 뜸의 1~3단계 상세 선택 빈도를 비교합니다.
                                    </p>
                                    <InfoTooltip text="디테일 밥맛 조절 기능을 통해 메뉴별로 어느 정도의 불림/뜸 단계를 선호하는지 분석합니다." />
                                </div>
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                        </div>

                        <div className="overflow-visible border border-gray-200 dark:border-gray-700 rounded-xl">
                            <table className="w-full text-sm text-center text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 shadow-sm relative z-10">
                                    <tr>
                                        <th scope="col" rowSpan={2} className="px-6 py-3 border-r border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 font-semibold text-left">
                                            메뉴명
                                        </th>
                                        <th scope="col" colSpan={3} className="px-4 py-2 border-b border-r border-gray-200 dark:border-gray-600 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 font-semibold">
                                            불림 (Soak)
                                        </th>
                                        <th scope="col" colSpan={3} className="px-4 py-2 border-b border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-semibold">
                                            뜸 (Steam)
                                        </th>
                                    </tr>
                                    <tr>
                                        <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 font-medium">1단계</th>
                                        <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 font-medium">2단계</th>
                                        <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 font-medium bg-orange-50 dark:bg-orange-900/20">3단계</th>
                                        <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 font-medium">1단계</th>
                                        <th className="px-3 py-2 border-r border-gray-200 dark:border-gray-600 font-medium">2단계</th>
                                        <th className="px-3 py-2 font-medium bg-blue-50 dark:bg-blue-900/20">3단계</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {soakSteamDetails && Array.from(new Set(soakSteamDetails.map((s: any) => normalizeRecipeName(s.menu)))).slice(0, 15).map((menuName: any, idx: number) => {
                                        const getVal = (type: 'soak' | 'steam', level: number) => {
                                            return soakSteamDetails
                                                .filter((s: any) => normalizeRecipeName(s.menu) === menuName && Number(s[type]) === level)
                                                .reduce((sum: number, s: any) => sum + (Number(s.count) || 0), 0);
                                        };
                                        return (
                                            <tr key={menuName} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                <td className="px-6 py-3 border-r border-gray-200 dark:border-gray-700 font-medium text-gray-900 dark:text-white text-left">
                                                    {menuName}
                                                </td>
                                                <td className="px-3 py-3 font-mono">{getVal('soak', 1).toLocaleString()}</td>
                                                <td className="px-3 py-3 font-mono">{getVal('soak', 2).toLocaleString()}</td>
                                                <td className="px-3 py-3 font-mono border-r border-gray-200 dark:border-gray-700 bg-orange-50/30 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400">
                                                    {getVal('soak', 3).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-3 font-mono">{getVal('steam', 1).toLocaleString()}</td>
                                                <td className="px-3 py-3 font-mono">{getVal('steam', 2).toLocaleString()}</td>
                                                <td className="px-3 py-3 font-mono bg-blue-50/30 dark:bg-blue-900/10 text-blue-700 dark:text-blue-400">
                                                    {getVal('steam', 3).toLocaleString()}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {(!soakSteamDetails || soakSteamDetails.length === 0) && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">데이터가 없습니다.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

/** 요일별 상세 분석 컴포넌트 */
function DayOfWeekBehaviorDetails({ data }: { data: any }) {
    const [selectedDay, setSelectedDay] = useState(new Date().getDay() + 1); // 1(일) ~ 7(토)
    const dayNames = [
        { id: 1, name: '일요일', short: '일' },
        { id: 2, name: '월요일', short: '월' },
        { id: 3, name: '화요일', short: '화' },
        { id: 4, name: '수요일', short: '수' },
        { id: 5, name: '목요일', short: '목' },
        { id: 6, name: '금요일', short: '금' },
        { id: 7, name: '토요일', short: '토' },
    ];

    const COLORS = ['#FF6B00', '#FF8533', '#FFA166', '#FFBD99', '#FFD9CC', '#FFF0E6'];

    return (
        <div data-dayofweek-root className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white text-lg">
                        <Calendar className="text-[#FF6B00]" size={20} />
                        요일별 취사 행동 상세 분석
                    </h3>
                    <InfoTooltip text="선택한 요일에 주로 어떤 메뉴를 취사하고, 몇 인분의 양을 가장 많이 하는지 상세 분석합니다." />
                </div>

                <div className="flex gap-1 bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                    {dayNames.map((d) => (
                        <button
                            key={d.id}
                            data-day-trigger={d.id}
                            onClick={() => setSelectedDay(d.id)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${selectedDay === d.id
                                ? 'bg-white dark:bg-gray-800 text-[#FF6B00] shadow-sm'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                        >
                            {d.short}
                        </button>
                    ))}
                </div>
            </div>

            {dayNames.map((d) => {
                const dayData = data?.[d.id] || { topRecipes: [], servings: [] };
                return (
                    <div
                        key={d.id}
                        data-day-panel={d.id}
                        style={{ display: selectedDay === d.id ? '' : 'none' }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                    >
                        {/* 왼쪽: Top 5 메뉴 */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <TrendingUp size={14} /> 주요 취사 메뉴 TOP 5
                            </h4>
                            <div className="space-y-3">
                                {dayData.topRecipes.length > 0 ? (
                                    dayData.topRecipes.map((r: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-3">
                                            <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center text-xs font-bold shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="font-medium text-gray-900 dark:text-white">{r.name}</span>
                                                    <span className="font-bold text-gray-600 dark:text-gray-400">{r.count.toLocaleString()}건</span>
                                                </div>
                                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                                    <div
                                                        className="bg-[#FF6B00] h-1.5 rounded-full"
                                                        style={{ width: `${(r.count / dayData.topRecipes[0].count) * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-10 text-center text-gray-400 text-sm">데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>

                        {/* 오른쪽: 인분 수 분포 */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                <Hash size={14} /> 인분 수 분포 (1~6인분)
                            </h4>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dayData.servings} layout="vertical" margin={{ left: 10, right: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" opacity={0.5} />
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} width={60} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#111827', border: 'none', borderRadius: '8px', color: '#fff' }}
                                            itemStyle={{ color: '#FF6B00' }}
                                            cursor={{ fill: 'transparent' }}
                                        />
                                        <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
                                            {dayData.servings.map((_entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
