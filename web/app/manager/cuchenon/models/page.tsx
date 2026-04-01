'use client';

import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';
import { Cpu, Server, Activity, Database, HelpCircle } from 'lucide-react';

const COLORS = ['#FF6B00', '#F3F4F6', '#10B981', '#3B82F6', '#8B5CF6', '#6366F1'];

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

export default function ModelsDashboard() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        connections: [],
        cooks: [],
        servings: [],
        warmTimes: []
    });

    const fetchMetrics = (start: string, end: string) => {
        setLoading(true);
        fetch(`/api/manager/metrics?tab=models&startDate=${start}&endDate=${end}`)
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
        if (!s || !e) {
            const today = new Date();
            const startObj = new Date(today.getFullYear(), 0, 1);
            s = new Date(startObj.getTime() - (startObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            e = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
            localStorage.setItem('dashStart', s);
            localStorage.setItem('dashEnd', e);
        }
        setStartDate(s || '');
        setEndDate(e || '');
        fetchMetrics(s || '', e || '');

        const handleGlobalSearch = () => {
            const gs = localStorage.getItem('dashStart');
            const ge = localStorage.getItem('dashEnd');
            if (gs && ge) {
                setStartDate(gs);
                setEndDate(ge);
                fetchMetrics(gs, ge);
            }
        };
        window.addEventListener('dashboard-search', handleGlobalSearch);
        return () => window.removeEventListener('dashboard-search', handleGlobalSearch);
    }, []);

    const handleSearch = () => {
        if (startDate && endDate) {
            const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 184) {
                alert('최대 조회 기간은 6개월입니다.\nDB 고부하를 방지하기 위해 최대 6개월까지 설정 가능합니다.');
                return;
            }
            localStorage.setItem('dashStart', startDate);
            localStorage.setItem('dashEnd', endDate);
            fetchMetrics(startDate, endDate);
            window.dispatchEvent(new CustomEvent('dashboard-search'));
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
        window.dispatchEvent(new CustomEvent('dashboard-search'));
    };

    if (!mounted) return null;

    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';

    // Process Servings Cross-Tabulation
    const menus = Array.from(new Set(metrics.servings.map((s: any) => s.menu)));
    const models = Array.from(new Set(metrics.servings.map((s: any) => s.modelName)));

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-visible pb-10">
            {/* Header & Date Picker */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Cpu className="text-[#FF6B00]" /> 기본 모델 현황
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        디바이스 모델별 연동 규모, 제어 활성도 및 세부 메뉴별 취사 행태를 비교 분석합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-1 border border-gray-100 dark:border-gray-700">
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
                            className="ml-2 px-4 py-2 bg-[#FF6B00] text-white rounded-lg hover:bg-orange-600 transition-all font-bold text-sm shadow-sm"
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
                    {/* Top Row: Connections & Cooks */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* 각 모델별 기기 연결대수 (표로 변경) */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-1 mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Server className="text-[#FF6B00]" size={18} />
                                    각 모델별 연동 기기 현황 (누적 및 신규)
                                </h3>
                                <InfoTooltip text="시스템에 연동된 총 기기 대수(누적)와 선택한 기간 내에 새로 연동된 기기 대수(신규)를 모델별로 상세 표출합니다." />
                            </div>
                            <div className="h-72 overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                                        <tr className="bg-gray-50 dark:bg-gray-800">
                                            <th className="px-4 py-3 font-semibold">모델명</th>
                                            <th className="px-4 py-3 text-right font-semibold">누적 연동</th>
                                            <th className="px-4 py-3 text-right font-semibold text-[#FF6B00]">신규 연동</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {(() => {
                                            const totalAll = metrics.connections.reduce((acc: number, c: any) => acc + (c.totalCount || 0), 0);
                                            const newAll = metrics.connections.reduce((acc: number, c: any) => acc + (c.newCount || 0), 0);

                                            return metrics.connections.map((item: any, idx: number) => (
                                                <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-300">{item.modelName}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-gray-700 dark:text-gray-200">{(item.totalCount || 0).toLocaleString()}</span>
                                                            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                                                                {totalAll > 0 ? ((item.totalCount / totalAll) * 100).toFixed(1) : 0}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-[#FF6B00] font-bold">{(item.newCount || 0).toLocaleString()}</span>
                                                            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold">
                                                                {newAll > 0 ? ((item.newCount / newAll) * 100).toFixed(1) : 0}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* 모델별 총 취사수 / 앱 제어 취사수 (표로 변경) */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-1 mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Activity className="text-[#FF6B00]" size={18} />
                                    기기 모델별 총 취사수 및 스마트앱 제어 분리
                                </h3>
                                <InfoTooltip text="모델이 기록한 총 취사 횟수를 기준으로, 스마트 앱으로 원격 조작한 비율과 앱 제어 비중을 표출합니다." />
                            </div>
                            <div className="h-72 overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
                                        <tr>
                                            <th className="px-4 py-2">모델명</th>
                                            <th className="px-4 py-2 text-right">총 취사</th>
                                            <th className="px-4 py-2 text-right">앱 제어</th>
                                            <th className="px-4 py-2 text-right text-[#FF6B00]">앱 비중(%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[...metrics.cooks].sort((a, b) => {
                                            const aPct = a.totalCooks > 0 ? a.appCooks / a.totalCooks : 0;
                                            const bPct = b.totalCooks > 0 ? b.appCooks / b.totalCooks : 0;
                                            return bPct - aPct;
                                        }).map((item: any, idx: number) => {
                                            const pct = item.totalCooks > 0 ? ((item.appCooks / item.totalCooks) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-100">{item.modelName}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{item.totalCooks.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right font-mono">{item.appCooks.toLocaleString()}</td>
                                                    <td className="px-4 py-2 text-right text-[#FF6B00] font-bold">{pct}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* 모델 용량별 보온 시간 분포 (3인/6인/10인 파이차트) */}
                    <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                        <div className="flex items-center gap-1 mb-6">
                            <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                <Database className="text-[#FF6B00]" size={18} />
                                기기 용량별 보온 지속시간 분포
                            </h3>
                            <InfoTooltip text="모델 용량(3인/6인/10인)별로 보온을 얼마나 유지하는지 비중을 비교합니다. (36시간 초과분 제외)" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[3, 6, 10].map(capacity => {
                                // Capacity Grouping Logic
                                const groupData = metrics.warmTimes.filter((m: any) => {
                                    const name = m.modelName.toUpperCase();
                                    if (capacity === 3) return name.includes('03') || name.includes('3인');
                                    if (capacity === 6) return name.includes('06') || name.includes('6인') || name.includes('ID6');
                                    if (capacity === 10) return name.includes('10') || name.includes('10인');
                                    return false;
                                });

                                if (groupData.length === 0) return null;

                                const aggregated = [
                                    { name: '0-2시간', value: groupData.reduce((acc: number, cur: any) => acc + cur.t0 + cur.t2, 0) },
                                    { name: '2-6시간', value: groupData.reduce((acc: number, cur: any) => acc + cur.t6, 0) },
                                    { name: '6-12시간', value: groupData.reduce((acc: number, cur: any) => acc + cur.t12, 0) },
                                    { name: '12-24시간', value: groupData.reduce((acc: number, cur: any) => acc + cur.t15 + cur.t24, 0) },
                                    { name: '24시간 이상', value: groupData.reduce((acc: number, cur: any) => acc + cur.t36, 0) },
                                ];

                                const PIE_COLORS = ['#94A3B8', '#60A5FA', '#10B981', '#F59E0B', '#FF6B00'];

                                return (
                                    <div key={capacity} className="flex flex-col items-center">
                                        <div className="mb-2 px-3 py-1 bg-gray-50 dark:bg-gray-800 rounded-full text-xs font-bold text-[#FF6B00]">
                                            {capacity}인용 제품군
                                        </div>
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={aggregated}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%" cy="50%"
                                                        outerRadius={70}
                                                        innerRadius={45}
                                                        paddingAngle={2}
                                                        label={({ name, percent, x, y, cx }) => {
                                                            if (!percent || percent < 0.05) return '';
                                                            const isRight = x > cx;
                                                            return (
                                                                <text
                                                                    x={x} y={y}
                                                                    fill="#6B7280"
                                                                    textAnchor={isRight ? 'start' : 'end'}
                                                                    dominantBaseline="central"
                                                                    style={{ fontSize: '10px', fontWeight: 'bold' }}
                                                                >
                                                                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                                                                </text>
                                                            );
                                                        }}
                                                    >
                                                        {aggregated.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(v: any) => [`${v.toLocaleString()}건`, '빈도']} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Cross-Tabulation Table */}
                    {/* Aggregated Cross-Tabulation Tables (3/6/10) */}
                    <div className="space-y-8">
                        {[3, 6, 10].map(capacity => {
                            // 1. Filter all data for this capacity across all models
                            const groupData = metrics.servings.filter((s: any) => {
                                const name = s.modelName.toUpperCase();
                                if (capacity === 3) return name.includes('03') || name.includes('3인');
                                if (capacity === 6) return name.includes('06') || name.includes('6인') || name.includes('ID6');
                                if (capacity === 10) return name.includes('10') || name.includes('10인');
                                return false;
                            });

                            if (groupData.length === 0) return null;

                            // 2. Aggregate by menu across all models in the group
                            const menuList = Array.from(new Set(groupData.map((s: any) => s.menu)));
                            const aggregatedResults = menuList.map(menu => {
                                const menuData = groupData.filter((s: any) => s.menu === menu);
                                const counts = Array.from({ length: capacity }).map((_, i) => {
                                    return menuData.filter((s: any) => Number(s.servingSize) === i)
                                        .reduce((acc: number, curr: any) => acc + Number(curr.count), 0);
                                });
                                const total = counts.reduce((acc, c) => acc + c, 0);
                                return { menu, counts, total };
                            }).sort((a, b) => b.total - a.total).slice(0, 10); // Sort by popularity, show top 10

                            return (
                                <div key={capacity} className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-x-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-1">
                                            <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                                <Database className="text-[#FF6B00]" size={18} />
                                                {capacity}인용 제품군 통합 메뉴별 / 인분별 심층 분석
                                            </h3>
                                            <InfoTooltip text={`${capacity}인용 모든 제품들의 지표를 합산하여 메뉴별 선호 인분수를 분석합니다.`} />
                                        </div>
                                        <span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-1 rounded-lg">
                                            {capacity}인용 합산
                                        </span>
                                    </div>

                                    <div className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-xl">
                                        <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                                            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 sticky top-0 z-20">
                                                <tr>
                                                    <th scope="col" className="px-6 py-3 font-semibold sticky left-0 bg-gray-50 dark:bg-gray-700 z-10 border-r dark:border-gray-600 min-w-[200px]">메뉴명 (통합)</th>
                                                    {Array.from({ length: capacity }).map((_, i) => (
                                                        <th key={i} scope="col" className="px-4 py-3 text-center min-w-[70px]">{i + 1}인분</th>
                                                    ))}
                                                    <th scope="col" className="px-4 py-3 text-center min-w-[100px] bg-gray-100 dark:bg-gray-800">합계</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {aggregatedResults.map((res: any) => (
                                                    <tr key={res.menu} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-orange-50 dark:hover:bg-gray-700 transition-colors">
                                                        <td className="px-6 py-3 font-bold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                            {res.menu}
                                                        </td>
                                                        {res.counts.map((count: number, i: number) => (
                                                            <td key={i} className="px-4 py-3 text-center font-medium">
                                                                {count > 0 ? count.toLocaleString() : '-'}
                                                            </td>
                                                        ))}
                                                        <td className="px-4 py-3 text-center font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800">
                                                            {res.total.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
