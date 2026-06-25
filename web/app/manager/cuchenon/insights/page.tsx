'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { HelpCircle, TrendingUp, Heart, Star, AlertTriangle, UserCheck } from 'lucide-react';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 border border-gray-700 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

export default function InsightsDashboard() {
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [metrics, setMetrics] = useState<any>({
        servingSizeTrend: [],
        customTasteTrend: [],
        tasteLevelDist: [],
        retentionTrend: []
    });

    const fetchMetrics = (start: string, end: string) => {
        setLoading(true);
        fetch(`/api/manager/metrics?tab=insights&startDate=${start}&endDate=${end}`)
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
            const startObj = new Date(today);
            startObj.setDate(today.getDate() - 90); // Insights defaults to 90 days
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

    const { servingSizeTrend, customTasteTrend, tasteLevelDist, retentionTrend, errorCodes, powerUser } = metrics;
    const calculateDays = (start: string, end: string) => {
        if (!start || !end) return 0;
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };
    const periodText = startDate && endDate ? `${startDate} ~ ${endDate} (${calculateDays(startDate, endDate)}일)` : '';

    return (
        <div className="space-y-8 pb-10 animate-fade-in overflow-visible">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">고급 잠재 인사이트</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">심층 데이터를 바탕으로 밥맛 선호도 및 기기 리텐션을 분석합니다.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleAllTime} className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-[#1F2937] dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-semibold border border-gray-200 dark:border-gray-700 shadow-sm text-sm">전체 기간</button>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-800 p-1.5 px-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm text-sm">
                        <input type="month" className="bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 cursor-pointer" value={startDate.slice(0, 7)} onChange={(e) => setStartByMonth(e.target.value)} />
                        <span className="text-gray-400">~</span>
                        <input type="month" className="bg-transparent border-none outline-none text-gray-700 dark:text-gray-300 cursor-pointer" value={endDate.slice(0, 7)} onChange={(e) => setEndByMonth(e.target.value)} />
                        <button onClick={handleSearch} className="px-3 py-1 bg-[#FF6B00] text-white rounded-md hover:bg-orange-600 transition-colors font-medium shadow-sm">조회</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FF6B00]"></div>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 overflow-visible">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Star className="text-[#10B981]" size={18} />
                                    앱 온보딩 후 생존율 (리텐션)
                                </h3>
                                <InfoTooltip text="기기를 최초 등록한 시점부터 현재까지 얼마나 많은 사용자가 이탈하지 않고 유지되고 있는지 분석합니다." />
                            </div>
                            <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-md">Retention Trend</span>
                        </div>
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={retentionTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} />
                                    <Tooltip cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value: any) => [value.toLocaleString() + ' 대', '잔류 기기 수']} />
                                    <Line name="활성 기기 수" type="monotone" dataKey="active" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 overflow-visible">
                        {/* Error Code Distribution */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col overflow-visible">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <AlertTriangle className="text-red-500" size={18} />
                                        디바이스 A/S 고장 코드 접수 현황
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">기기 이상 감지 및 에러 발생 빈도</p>
                                        <InfoTooltip text="제품에서 발생한 하드웨어 에러 코드를 실시간으로 집계한 통계입니다." />
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded-md">Error Tracking</span>
                            </div>
                            <div className="flex-1 overflow-auto max-h-[300px]">
                                <table className="w-full text-sm text-center">
                                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-800 text-gray-500 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-3 border-b dark:border-gray-700">에러 항목 (Code)</th>
                                            <th className="px-4 py-3 border-b dark:border-gray-700">발생 건수</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {errorCodes?.map((err: any, idx: number) => {
                                            const ERROR_MAP: any = {
                                                '1': 'BS OPEN',
                                                '2': 'BS SHORT',
                                                '4': 'TS OPEN',
                                                '8': 'TS SHORT',
                                                '16': 'ES OPEN',
                                                '32': 'ES SHORT',
                                                '64': '내솥 없음',
                                                '128': '취사 중 뚜껑열림'
                                            };
                                            const desc = ERROR_MAP[String(err.code)] || '기타 에러';
                                            return (
                                                <tr key={idx} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-xs text-gray-400 font-normal">Code: {err.code}</span>
                                                            <span className="text-sm">{desc}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-red-600 dark:text-red-400 font-medium">{Number(err.count).toLocaleString()}건</td>
                                                </tr>
                                            );
                                        })}
                                        {(!errorCodes || errorCodes.length === 0) && (
                                            <tr><td colSpan={2} className="py-6 text-gray-500">조회된 에러 내역이 없습니다.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Power User Sequencing */}
                        <div className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 dark:border-gray-800 flex flex-col overflow-visible">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex flex-col gap-1">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <UserCheck className="text-purple-500" size={18} />
                                        최고 헤비 유저 연속 취사 로그
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            최다 취사 사용자의 리얼타임 행동 패턴 트래킹
                                        </p>
                                        <InfoTooltip text="조회 기간 내 가장 많은 취사를 기록한 상위 사용자의 실제 작동 로그 시퀀스입니다." />
                                    </div>
                                </div>
                                <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-md max-w-[120px] truncate" title={powerUser?.deviceId}>
                                    ID: {powerUser?.deviceId}
                                </span>
                            </div>
                            <div className="flex-1 overflow-auto max-h-[300px] border border-gray-100 dark:border-gray-700 rounded-lg p-1 bg-gray-50 dark:bg-gray-900">
                                <ul className="space-y-3 p-3">
                                    {powerUser?.logs?.map((log: any, idx: number) => (
                                        <li key={idx} className="flex flex-col gap-1 p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                                            <div className="flex justify-between items-center w-full">
                                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                    {log.menu} {log.servingSize !== null && log.servingSize !== undefined && <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-1 rounded ml-1">{Number(log.servingSize) + 1}인분</span>}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(log.logTime).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="flex gap-2 text-xs mt-1">
                                                {log.appCtrl === 'Y' ? (
                                                    <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100 flex items-center gap-1">📱 앱 제어</span>
                                                ) : (
                                                    <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">기기 수동 제어</span>
                                                )}
                                                {log.soak > 0 && <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">불림 {log.soak}단</span>}
                                                {log.steam > 0 && <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">뜸 {log.steam}단</span>}
                                            </div>
                                        </li>
                                    ))}
                                    {(!powerUser?.logs || powerUser.logs.length === 0) && (
                                        <li className="py-6 text-center text-gray-500 text-sm">해당 기간의 헤비 유저 활동 로그가 없습니다.</li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
