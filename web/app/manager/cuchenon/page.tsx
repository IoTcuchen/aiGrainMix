'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { ArrowUpRight, Activity, Router, ChefHat, Database, Smartphone, Cpu, Users, HelpCircle } from 'lucide-react';

const COLORS = ['#FF6B00', '#F3F4F6'];

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

function StatCard({ title, value, label, icon: Icon, trend, tooltip }: any) {
    return (
        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center mb-1">
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                        {tooltip && <InfoTooltip text={tooltip} />}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white">{value}</h3>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-[#FF6B00]">
                    <Icon size={24} />
                </div>
            </div>
            <div className="flex items-center gap-1 text-sm">
                {trend && (
                    <span className="flex items-center text-emerald-500 font-medium">
                        <ArrowUpRight size={16} />
                        {trend}
                    </span>
                )}
                <span className="text-gray-400 dark:text-gray-500 ml-1">{label}</span>
            </div>
        </div>
    );
}

export default function ManagerDashboard() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        deviceStatus: [],
        weeklyCookTrend: [],
        kpi: {}
    });

    const fetchMetrics = (start: string, end: string) => {
        setLoading(true);
        fetch(`/api/manager/metrics?tab=overview&startDate=${start}&endDate=${end}`)
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
            const diffDays = (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24);
            if (diffDays > 184) {
                alert('최대 조회 기간은 6개월입니다.\nDB 고부하를 방지하기 위해 최대 6개월까지 설정 가능합니다.');
                return;
            }
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

    const { deviceStatus, weeklyCookTrend, kpi } = metrics;
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
                        <Activity className="text-orange-600" /> 대시보드 요약
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        전체 모델의 실시간 연동 현황 및 핵심 취사 지표를 한눈에 모니터링합니다.
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="활성 기기 (온라인)" value={(kpi.activeDevices || 0).toLocaleString()} label="전체 연동률 확인" icon={Router} trend="" tooltip="현재 통신이 연결되어 온라인 상태인 기기의 수입니다." />
                        <StatCard title="오늘 취사 횟수" value={(kpi.totalCooksToday || 0).toLocaleString()} label="당일 기준 로그 집계" icon={ChefHat} trend="" tooltip="서버 시간 기준 오늘 하루 동안 발생한 전체 취사 횟수입니다." />
                        <StatCard title="총 등록 기기" value={(kpi.totalDevices || 0).toLocaleString()} label="누적 등록 수" icon={Activity} trend="" tooltip="오프라인 기기를 포함한 데이터베이스 상의 전체 모수 기기입니다." />

                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div>
                                <div className="flex items-center mb-2">
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">기기 연결 상태</h3>
                                    <InfoTooltip text="현재 등록된 전체 밥솥 중 통신이 유효한(온라인) 기기의 실시간 비율입니다." />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {deviceStatus && deviceStatus.length > 0 && Math.round(((deviceStatus.find((d: any) => d.name === '온라인')?.value || 0) / ((deviceStatus.find((d: any) => d.name === '온라인')?.value || 0) + (deviceStatus.find((d: any) => d.name === '오프라인')?.value || 0))) * 100) || 0}%
                                    </span>
                                    <span className="text-sm font-medium text-emerald-500">온라인</span>
                                </div>
                                <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                    접속 {kpi.activeDevices?.toLocaleString() || '0'} / 미접속 {((kpi.totalDevices || 0) - (kpi.activeDevices || 0)).toLocaleString()} 대
                                </div>
                            </div>
                            <div className="h-[70px] w-[70px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie data={deviceStatus} cx="50%" cy="50%" innerRadius={24} outerRadius={35} paddingAngle={3} dataKey="value" stroke="none">
                                            <Cell fill="#10B981" />
                                            <Cell fill="#F3F4F6" />
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* 데이터 볼륨 KPI */}
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
                        {metrics.dataVolumes?.map((item: any, idx: number) => (
                            <div key={idx} className="bg-white dark:bg-[#1F2937] p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.name}</p>
                                        {item.tooltip && <InfoTooltip text={item.tooltip} />}
                                    </div>
                                    <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-[#FF6B00]">
                                        {item.icon === 'Users' ? <Users size={18} /> : item.icon === 'Smartphone' ? <Smartphone size={18} /> : <Database size={18} />}
                                    </div>
                                </div>
                                <div className="flex items-end gap-1">
                                    <span className="text-2xl font-bold text-gray-900 dark:text-white">{item.count?.toLocaleString()}</span>
                                    <span className="text-sm text-gray-400 mb-0.5">{item.name.includes('가입자') ? '명' : item.name.includes('기기') ? '대' : '건'}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 mt-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-1">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">주간 누적 취사량 트렌드</h3>
                                <InfoTooltip text={"조회 기간 전체에 걸친 일자별 누적 취사 작동 건수 추세선입니다.\n(장기간 조회 시 알아서 월별 단위로 자동 합산됩니다)"} />
                            </div>
                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">{periodText}</span>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weeklyCookTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                    <Tooltip
                                        formatter={(value: any) => [value.toLocaleString() + ' 회', '취사 수']}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ stroke: '#FF6B00', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    />
                                    <Line type="monotone" dataKey="count" stroke="#FF6B00" strokeWidth={3} dot={{ r: 4, fill: '#FF6B00', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#FF6B00', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                        {/* 월별 신규 연동 추이 */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Smartphone className="text-[#FF6B00]" size={18} />
                                    월별 신규 스마트 기기 연동(가입) 대수
                                </h3>
                                <InfoTooltip text="매달 새롭게 서버와 연동을 완료한 활성 기기 등록 추이량입니다." />
                            </div>
                            <div className="h-72">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={metrics.monthlyRegistrations}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            formatter={(value) => [`${value} 대`, '신규 연동']}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="count"
                                            stroke="#10B981"
                                            strokeWidth={3}
                                            dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }}
                                            activeDot={{ r: 6 }}
                                            animationDuration={1500}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* 모델별 스마트 파워 (표로 변경) */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                            <div className="mb-4 flex items-center gap-2">
                                <h3 className="font-bold flex items-center gap-2 text-gray-900 dark:text-white">
                                    <Cpu className="text-[#FF6B00]" size={18} />
                                    모델별 스마트앱 제어 활성화 현황
                                </h3>
                                <InfoTooltip text="해당 기기의 총 누적 취사량(전체 모수) 중, 스마트 앱으로 원격 조작한 비율과 앱 제어 비중을 표출합니다." />
                            </div>
                            <div className="overflow-hidden border border-gray-100 dark:border-gray-700 rounded-xl">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">모델명</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">총 취사</th>
                                            <th className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">앱 제어</th>
                                            <th className="px-4 py-3 text-right font-semibold text-[#FF6B00]">앱 비중</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {metrics.modelPerformance?.map((item: any, idx: number) => {
                                            const pct = item.total > 0 ? ((item.app / item.total) * 100).toFixed(1) : '0.0';
                                            return (
                                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white border-r border-gray-50 dark:border-gray-700">{item.name}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">{item.total.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-mono text-blue-500 dark:text-blue-400">{item.app.toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-right font-bold text-[#FF6B00] bg-orange-50/30 dark:bg-orange-950/20">{pct}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
