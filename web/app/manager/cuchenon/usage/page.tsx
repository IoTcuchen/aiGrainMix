'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, Cell, PieChart, Pie,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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

export default function UsageDashboard() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        topRecipes: [],
        hourlyTrend: [],
        warmTimeStatus: [],
        dayOfWeekTrend: [],
        soakSteamDetails: [],
        servingSizeTrend: [],
        customTasteTrend: [],
        resvTimeTrend: []
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

    if (!mounted) return null;

    const { topRecipes, hourlyTrend, warmTimeStatus, dayOfWeekTrend, soakSteamDetails, servingSizeTrend, customTasteTrend, resvTimeTrend } = metrics;
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible">
            {/* Header & Date Picker - Standardized White Square */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-orange-600" /> 사용 패턴 통계
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        사용자들의 선호 메뉴, 취사 시간대 및 인분 수 조절 패턴을 실측 데이터 기반으로 분석합니다.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 px-2 border-r border-gray-200 dark:border-gray-700 mr-2">
                        <button
                            onClick={handleAllTime}
                            className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
                        >
                            전체
                        </button>
                    </div>
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible">
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="text-[#FF6B00]" size={18} />
                                        인기 취사 메뉴 랭킹
                                    </h3>
                                    <InfoTooltip text="조회 기간 동안 사용자들이 가장 많이 선택한 취사 메뉴 TOP 10입니다." />
                                </div>
                                <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                            </div>
                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topRecipes} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                        <XAxis type="number" axisLine={false} tickLine={false} hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} dx={-10} />
                                        <Tooltip cursor={{ fill: 'rgba(255, 107, 0, 0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [value.toLocaleString() + ' 회', '취사 수']} />
                                        <Bar dataKey="count" fill="#FF6B00" radius={[0, 6, 6, 0]} barSize={24}>
                                            {topRecipes?.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={index === 0 ? '#FF6B00' : '#FCA5A5'} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
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

                        {/* 예약 설정 시간대 패턴 (From Smart Tab) */}
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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
                        {/* 보온 시간 분포 (Moved Down) */}
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

                        {/* 취사 인분 수 추이 (Moved to share grid) */}
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
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-visible mt-6">
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
                        <div className="invisible lg:visible"></div>
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
                                    {soakSteamDetails && Array.from(new Set(soakSteamDetails.map((s: any) => s.menu))).slice(0, 8).map((menuName: any, idx: number) => {
                                        const getVal = (type: 'soak' | 'steam', level: number) => {
                                            const match = soakSteamDetails.find((s: any) => s.menu === menuName && Number(s[type]) === level);
                                            return match ? Number(match.count) : 0;
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
