'use client';

import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import {
    Activity, Router, ChefHat, Database, Smartphone, Cpu, Users,
    TrendingUp, LayoutDashboard, Coffee, Clock, HelpCircle, BarChart2
} from 'lucide-react';

const ORANGE = '#FF6B00';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={13} className="text-gray-400 hover:text-orange-600 cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

type TabKey = 'overview' | 'models' | 'usage' | 'smart';

const TAB_LIST: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: '요약', icon: <LayoutDashboard size={16} /> },
    { key: 'models', label: '기본 모델 현황', icon: <Cpu size={16} /> },
    { key: 'usage', label: '사용 패턴 통계', icon: <TrendingUp size={16} /> },
    { key: 'smart', label: '스마트 제어', icon: <Smartphone size={16} /> },
];

export default function HistoryDetailPage({ params }: { params: { id: string } }) {
    const [cache, setCache] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    useEffect(() => {
        fetch(`/api/manager/cache/${params.id}`)
            .then(r => r.json())
            .then(data => { setCache(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4"></div>
                <p className="text-gray-500">캐시 데이터를 불러오는 중...</p>
            </div>
        </div>
    );

    if (!cache || cache.error) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <div className="text-center text-gray-500"><p>이력을 찾을 수 없습니다.</p></div>
        </div>
    );

    const tabData = cache[activeTab];

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-['Pretendard']">
            {/* Top Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow">
                        <Coffee className="text-white" size={18} />
                    </div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900">쿠첸 관리자 — 조회 이력 상세</h1>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={11} /> 저장: {cache.fetched_at}
                        </p>
                    </div>
                </div>
                <div className="text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full">
                    {cache.start_date} ~ {cache.end_date}
                </div>
            </div>

            {/* Tab Bar */}
            <div className="bg-white border-b border-gray-100 px-6">
                <div className="flex gap-1 max-w-4xl">
                    {TAB_LIST.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            disabled={!cache[t.key]}
                            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed
                                ${activeTab === t.key
                                    ? 'border-orange-600 text-orange-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
                        >
                            {t.icon} {t.label}
                            {!cache[t.key] && <span className="text-[10px] text-gray-300 ml-1">(미저장)</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                {!tabData ? (
                    <div className="text-center py-20 text-gray-400">
                        이 탭의 데이터는 아직 조회된 적 없습니다.<br />
                        대시보드에서 해당 탭을 조회하면 다음부터 여기서 볼 수 있습니다.
                    </div>
                ) : (
                    <>
                        {/* ── OVERVIEW TAB ── */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                {/* KPI Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                                    {[
                                        { title: '활성 기기 (온라인)', value: (tabData.kpi?.activeDevices || 0).toLocaleString(), icon: Router },
                                        { title: '오늘 취사 횟수', value: (tabData.kpi?.totalCooksToday || 0).toLocaleString(), icon: ChefHat },
                                        { title: '총 등록 기기', value: (tabData.kpi?.totalDevices || 0).toLocaleString(), icon: Activity },
                                        { title: '총 가입자수', value: (tabData.dataVolumes?.find((d: any) => d.name === '총 가입자수')?.count || 0).toLocaleString(), icon: Users },
                                    ].map((c, i) => (
                                        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="text-sm font-medium text-gray-500">{c.title}</p>
                                                <div className="p-2 bg-orange-50 rounded-xl text-orange-600"><c.icon size={20} /></div>
                                            </div>
                                            <h3 className="text-3xl font-bold text-gray-900">{c.value}</h3>
                                        </div>
                                    ))}
                                </div>

                                {/* Data Volumes Row */}
                                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                    {tabData.dataVolumes?.map((item: any, i: number) => (
                                        <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                            <div className="flex justify-between items-start mb-3">
                                                <p className="text-xs font-medium text-gray-500">{item.name}</p>
                                                <div className="p-1.5 bg-orange-50 rounded-lg text-orange-600">
                                                    {item.icon === 'Users' ? <Users size={14} /> : item.icon === 'Smartphone' ? <Smartphone size={14} /> : <Database size={14} />}
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <span className="text-2xl font-bold text-gray-900">{item.count?.toLocaleString()}</span>
                                                <span className="text-xs text-gray-400 mb-0.5">{item.name.includes('가입자') ? '명' : item.name.includes('기기') ? '대' : '건'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Cook Trend Chart */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-5">취사량 트렌드</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={tabData.weeklyCookTrend}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                                <Tooltip formatter={(v: any) => [v.toLocaleString() + ' 회', '취사 수']} contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Line type="monotone" dataKey="count" stroke={ORANGE} strokeWidth={3} dot={{ r: 4, fill: ORANGE, stroke: '#fff', strokeWidth: 2 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Model Performance Table */}
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-5 flex items-center gap-2"><Cpu size={18} className="text-orange-600" /> 모델별 앱 제어 현황</h3>
                                    <div className="overflow-hidden border border-gray-100 rounded-xl">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">모델명</th>
                                                    <th className="px-4 py-3 text-right">총 취사</th>
                                                    <th className="px-4 py-3 text-right">앱 제어</th>
                                                    <th className="px-4 py-3 text-right text-orange-600">앱 비중</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {tabData.modelPerformance?.map((row: any, i: number) => {
                                                    const pct = row.total > 0 ? ((row.app / row.total) * 100).toFixed(1) : '0.0';
                                                    return (
                                                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                            <td className="px-4 py-3 font-bold">{row.name}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-gray-600">{row.total?.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-mono text-blue-500">{row.app?.toLocaleString()}</td>
                                                            <td className="px-4 py-3 text-right font-bold text-orange-600">{pct}%</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── MODELS TAB ── */}
                        {activeTab === 'models' && tabData && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-5">모델별 취사 건수 및 앱 제어</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={tabData.cooks?.slice(0, 12)} layout="vertical" margin={{ left: 40 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="modelName" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={100} />
                                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                                <Legend />
                                                <Bar dataKey="totalCooks" name="총 취사" fill={ORANGE} radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="appCooks" name="앱 제어" fill="#10B981" radius={[0, 4, 4, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-5">모델별 신규/누적 연동 수</h3>
                                    <div className="overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                                <tr>
                                                    <th className="px-4 py-3 text-left">모델명</th>
                                                    <th className="px-4 py-3 text-right">신규 연동</th>
                                                    <th className="px-4 py-3 text-right">누적 연동</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {tabData.connections?.map((row: any, i: number) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 font-bold">{row.modelName}</td>
                                                        <td className="px-4 py-3 text-right text-emerald-600 font-mono">+{Number(row.newCount).toLocaleString()}</td>
                                                        <td className="px-4 py-3 text-right font-mono">{Number(row.totalCount).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── USAGE TAB ── */}
                        {activeTab === 'usage' && tabData && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Top Recipes */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-5">인기 메뉴 TOP 10</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={tabData.topRecipes} layout="vertical" margin={{ left: 40 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                    <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={80} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} formatter={(v: any) => [v.toLocaleString() + '건', '취사 수']} />
                                                    <Bar dataKey="count" fill={ORANGE} radius={[0, 4, 4, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Hourly Trend */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-5">시간대별 취사 분포</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={tabData.hourlyTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="hour" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                    <Bar dataKey="count" fill={ORANGE} radius={[4, 4, 0, 0]} name="총 취사" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Day of Week */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-5">요일별 취사 분포</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={tabData.dayOfWeekTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                    <Bar dataKey="count" fill="#10B981" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Warm Time */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-5">보온 시간 분포</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={tabData.warmTimeStatus}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                    <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SMART TAB ── */}
                        {activeTab === 'smart' && tabData && (
                            <div className="space-y-6 animate-in fade-in duration-300">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
                                        <h3 className="text-lg font-bold mb-6">앱 제어 비율</h3>
                                        <div className="h-48 w-48">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={[
                                                        { name: '앱 제어', value: tabData.appCtrlRatio?.app || 0 },
                                                        { name: '직접 제어', value: tabData.appCtrlRatio?.manual || 0 },
                                                    ]} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                                                        <Cell fill={ORANGE} />
                                                        <Cell fill="#E5E7EB" />
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="text-3xl font-bold text-orange-600 mt-2">
                                            {tabData.appCtrlRatio?.total > 0 ? Math.round((tabData.appCtrlRatio.app / tabData.appCtrlRatio.total) * 100) : 0}%
                                        </div>
                                        <p className="text-sm text-gray-400 mt-1">앱 제어 비중</p>
                                    </div>

                                    <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <h3 className="text-lg font-bold mb-5">예약 취사 시간대</h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={tabData.resvTimeTrend}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                    <XAxis dataKey="hour" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                                                    <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                    <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                    <h3 className="text-lg font-bold mb-5">모델별 앱 제어 비율</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={tabData.modelAppRatio?.slice(0, 10)} layout="vertical" margin={{ left: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                                                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={110} />
                                                <Tooltip contentStyle={{ borderRadius: 12, border: 'none' }} />
                                                <Legend />
                                                <Bar dataKey="app" name="앱 제어" fill={ORANGE} stackId="a" radius={[0, 4, 4, 0]} />
                                                <Bar dataKey="manual" name="직접 제어" fill="#E5E7EB" stackId="a" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
