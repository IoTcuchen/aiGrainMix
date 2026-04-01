'use client';
import React, { useState, useEffect } from 'react';
import { LineChart, Line, PieChart, Pie, Cell, BarChart, Bar, Legend, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, Router, ChefHat, Database, Smartphone, Cpu, Users, HelpCircle, ArrowUpRight, Server, TrendingUp, BarChart2, BarChart3, Calendar, Clock, Hash, Heart, Zap } from 'lucide-react';

const ORANGE = '#FF6B00';

const InfoTooltip = ({ text }: { text: string }) => (
    <div className="group relative flex items-center ml-1 z-50">
        <HelpCircle size={14} className="text-gray-400 hover:text-[#FF6B00] cursor-help transition-colors" />
        <div className="absolute z-[9999] bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-[220px] bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 shadow-2xl whitespace-pre-wrap text-center pointer-events-none">
            {text}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -ml-1 border-[5px] border-transparent border-t-gray-900"></div>
        </div>
    </div>
);

function StatCard({ title, value, label, icon: Icon, trend, tooltip }: any) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <div className="flex items-center mb-1">
                        <p className="text-sm font-medium text-gray-500">{title}</p>
                        {tooltip && <InfoTooltip text={tooltip} />}
                    </div>
                    <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl text-[#FF6B00]"><Icon size={24} /></div>
            </div>
            <div className="flex items-center gap-1 text-sm">
                {trend && <span className="flex items-center text-emerald-500 font-medium"><ArrowUpRight size={16} />{trend}</span>}
                <span className="text-gray-400 ml-1">{label}</span>
            </div>
        </div>
    );
}

type TabKey = 'overview' | 'models' | 'usage' | 'smart';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '요약' },
    { key: 'models', label: '기본 모델 현황' },
    { key: 'usage', label: '사용 패턴 통계' },
    { key: 'smart', label: '스마트 제어 분석' },
];

export default function HistoryDetailPage({ params }: { params: { id: string } }) {
    const [cache, setCache] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    useEffect(() => {
        fetch(`/api/manager/cache/${params.id}`)
            .then(r => r.json())
            .then(d => { setCache(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [params.id]);

    if (loading) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <div className="text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4" /><p className="text-gray-500">캐시 데이터 로딩 중...</p></div>
        </div>
    );
    if (!cache || cache.error) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <p className="text-gray-500">이력을 찾을 수 없습니다.</p>
        </div>
    );

    const periodText = `${cache.start_date} ~ ${cache.end_date}`;

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-['Pretendard']">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow"><ChefHat className="text-white" size={18} /></div>
                    <div><h1 className="text-base font-bold text-gray-900">쿠첸 관리자 — 조회 이력 상세</h1><p className="text-xs text-gray-400">저장: {cache.fetched_at}</p></div>
                </div>
                <span className="text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full">{periodText}</span>
            </div>

            {/* Tab bar */}
            <div className="bg-white border-b border-gray-100 px-6">
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)} disabled={!cache[t.key]}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === t.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
                            {t.label} {!cache[t.key] && <span className="text-[10px] ml-1">(미저장)</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 max-w-7xl mx-auto pb-16">
                {!cache[activeTab] ? (
                    <div className="text-center py-20 text-gray-400">이 탭 데이터는 아직 조회된 적 없습니다. <br /> 데이터를 조회하시려면 관리자 페이지에서 "{periodText}" 기간에 대한 조회를 진행해주세요. </div>
                ) : (
                    <>
                        {/* ────────── OVERVIEW ────────── */}
                        {activeTab === 'overview' && (() => {
                            const { deviceStatus, weeklyCookTrend, kpi, dataVolumes, monthlyRegistrations, modelPerformance } = cache.overview;
                            const onlineCount = deviceStatus?.find((d: any) => d.name === '온라인')?.value || 0;
                            const offlineCount = deviceStatus?.find((d: any) => d.name === '오프라인')?.value || 0;
                            const onlinePct = onlineCount + offlineCount > 0 ? Math.round((onlineCount / (onlineCount + offlineCount)) * 100) : 0;
                            return (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    {/* KPI 4 cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <StatCard title="활성 기기 (온라인)" value={(kpi?.activeDevices || 0).toLocaleString()} label="전체 연동률 확인" icon={Router} tooltip="현재 통신이 연결되어 온라인 상태인 기기의 수입니다." />
                                        <StatCard title="오늘 취사 횟수" value={(kpi?.totalCooksToday || 0).toLocaleString()} label="당일 기준 로그 집계" icon={ChefHat} tooltip="서버 시간 기준 오늘 하루 동안 발생한 전체 취사 횟수입니다." />
                                        <StatCard title="총 등록 기기" value={(kpi?.totalDevices || 0).toLocaleString()} label="누적 등록 수" icon={Activity} tooltip="오프라인 기기를 포함한 전체 모수 기기입니다." />
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                                            <div>
                                                <div className="flex items-center mb-2"><h3 className="text-sm font-medium text-gray-500">기기 연결 상태</h3><InfoTooltip text="현재 등록된 전체 밥솥 중 온라인 기기의 실시간 비율입니다." /></div>
                                                <div className="flex items-baseline gap-2"><span className="text-3xl font-bold text-gray-900">{onlinePct}%</span><span className="text-sm font-medium text-emerald-500">온라인</span></div>
                                                <div className="text-xs text-gray-400 mt-1">접속 {onlineCount.toLocaleString()} / 미접속 {offlineCount.toLocaleString()} 대</div>
                                            </div>
                                            <div className="h-[70px] w-[70px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart><Pie data={deviceStatus} cx="50%" cy="50%" innerRadius={24} outerRadius={35} paddingAngle={3} dataKey="value" stroke="none"><Cell fill="#10B981" /><Cell fill="#F3F4F6" /></Pie></PieChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Data volumes */}
                                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                                        {dataVolumes?.map((item: any, i: number) => (
                                            <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex items-center gap-2"><p className="text-sm font-medium text-gray-500">{item.name}</p>{item.tooltip && <InfoTooltip text={item.tooltip} />}</div>
                                                    <div className="p-2 bg-orange-50 rounded-xl text-[#FF6B00]">{item.icon === 'Users' ? <Users size={18} /> : item.icon === 'Smartphone' ? <Smartphone size={18} /> : <Database size={18} />}</div>
                                                </div>
                                                <div className="flex items-end gap-1"><span className="text-2xl font-bold text-gray-900">{item.count?.toLocaleString()}</span><span className="text-sm text-gray-400 mb-0.5">{item.name.includes('가입자') ? '명' : item.name.includes('기기') ? '대' : '건'}</span></div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Weekly trend */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-6">
                                            <div className="flex items-center gap-1"><h3 className="text-lg font-bold text-gray-900">주간 누적 취사량 트렌드</h3><InfoTooltip text="조회 기간 전체에 걸친 일자별 누적 취사 작동 건수 추세선입니다." /></div>
                                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span>
                                        </div>
                                        <div className="h-[350px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={weeklyCookTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} />
                                                    <Tooltip formatter={(v: any) => [v.toLocaleString() + ' 회', '취사 수']} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} cursor={{ stroke: ORANGE, strokeWidth: 1, strokeDasharray: '4 4' }} />
                                                    <Line type="monotone" dataKey="count" stroke={ORANGE} strokeWidth={3} dot={{ r: 4, fill: ORANGE, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: ORANGE, stroke: '#fff', strokeWidth: 2 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Monthly reg + model performance */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                            <div className="mb-4 flex items-center gap-2"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Smartphone className="text-[#FF6B00]" size={18} />월별 신규 스마트 기기 연동(가입) 대수</h3><InfoTooltip text="매달 새롭게 서버와 연동을 완료한 활성 기기 등록 추이량입니다." /></div>
                                            <div className="h-72">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={monthlyRegistrations}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fill: '#6B7280', fontSize: 12 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: '#6B7280', fontSize: 12 }} allowDecimals={false} axisLine={false} tickLine={false} />
                                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [`${v} 대`, '신규 연동']} />
                                                        <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                                            <div className="mb-4 flex items-center gap-2"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Cpu className="text-[#FF6B00]" size={18} />모델별 스마트앱 제어 활성화 현황</h3><InfoTooltip text="총 취사량 중 스마트 앱으로 원격 조작한 비율을 표출합니다." /></div>
                                            <div className="overflow-hidden border border-gray-100 rounded-xl">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50"><tr><th className="px-4 py-3 font-semibold text-gray-900">모델명</th><th className="px-4 py-3 text-right font-semibold text-gray-900">총 취사</th><th className="px-4 py-3 text-right font-semibold text-gray-900">앱 제어</th><th className="px-4 py-3 text-right font-semibold text-[#FF6B00]">앱 비중</th></tr></thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {modelPerformance?.map((item: any, i: number) => { const pct = item.total > 0 ? ((item.app / item.total) * 100).toFixed(1) : '0.0'; return (<tr key={i} className="hover:bg-gray-50 transition-colors"><td className="px-4 py-3 font-bold text-gray-900 border-r border-gray-50">{item.name}</td><td className="px-4 py-3 text-right font-mono text-gray-600">{item.total.toLocaleString()}</td><td className="px-4 py-3 text-right font-mono text-blue-500">{item.app.toLocaleString()}</td><td className="px-4 py-3 text-right font-bold text-[#FF6B00] bg-orange-50/30">{pct}%</td></tr>); })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ────────── MODELS ────────── */}
                        {activeTab === 'models' && (() => {
                            const { connections, cooks, warmTimes, servings } = cache.models;
                            return (
                                <div className="space-y-6 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Connections table */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-1 mb-4"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Server className="text-[#FF6B00]" size={18} />각 모델별 연동 기기 현황</h3><InfoTooltip text="시스템에 연동된 총 기기 대수(누적)와 새로 연동된 기기 대수(신규)를 모델별로 표출합니다." /></div>
                                            <div className="h-72 overflow-y-auto pr-2">
                                                <table className="w-full text-sm text-left text-gray-500">
                                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10"><tr className="bg-gray-50"><th className="px-4 py-3 font-semibold">모델명</th><th className="px-4 py-3 text-right font-semibold">누적 연동</th><th className="px-4 py-3 text-right font-semibold text-[#FF6B00]">신규 연동</th></tr></thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {(() => {
                                                            const totalAll = connections?.reduce((a: number, c: any) => a + (c.totalCount || 0), 0) || 1;
                                                            const newAll = connections?.reduce((a: number, c: any) => a + (c.newCount || 0), 0) || 1;
                                                            return connections?.map((item: any, i: number) => (
                                                                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                                    <td className="px-4 py-3 font-medium text-gray-900">{item.modelName}</td>
                                                                    <td className="px-4 py-3 text-right"><div className="flex flex-col items-end"><span className="font-mono text-gray-700">{(item.totalCount || 0).toLocaleString()}</span><span className="text-[10px] text-gray-600">{totalAll > 0 ? ((item.totalCount / totalAll) * 100).toFixed(1) : 0}%</span></div></td>
                                                                    <td className="px-4 py-3 text-right"><div className="flex flex-col items-end"><span className="font-mono text-[#FF6B00] font-bold">{(item.newCount || 0).toLocaleString()}</span><span className="text-[10px] text-orange-600 font-bold">{newAll > 0 ? ((item.newCount / newAll) * 100).toFixed(1) : 0}%</span></div></td>
                                                                </tr>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                        {/* Cooks table */}
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center gap-1 mb-4"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Activity className="text-[#FF6B00]" size={18} />기기 모델별 총 취사수 및 스마트앱 제어 분리</h3><InfoTooltip text="모델이 기록한 총 취사 횟수를 기준으로 스마트 앱으로 원격 조작한 비율을 표출합니다." /></div>
                                            <div className="h-72 overflow-y-auto pr-2">
                                                <table className="w-full text-sm text-left text-gray-500">
                                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-10"><tr><th className="px-4 py-2">모델명</th><th className="px-4 py-2 text-right">총 취사</th><th className="px-4 py-2 text-right">앱 제어</th><th className="px-4 py-2 text-right text-[#FF6B00]">앱 비중(%)</th></tr></thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {[...(cooks || [])].sort((a, b) => (b.totalCooks > 0 ? b.appCooks / b.totalCooks : 0) - (a.totalCooks > 0 ? a.appCooks / a.totalCooks : 0)).map((item: any, i: number) => {
                                                            const pct = item.totalCooks > 0 ? ((item.appCooks / item.totalCooks) * 100).toFixed(1) : 0;
                                                            return (<tr key={i} className="hover:bg-gray-50/50 transition-colors"><td className="px-4 py-2 font-medium text-gray-900 border-r border-gray-100">{item.modelName}</td><td className="px-4 py-2 text-right font-mono">{item.totalCooks.toLocaleString()}</td><td className="px-4 py-2 text-right font-mono">{item.appCooks.toLocaleString()}</td><td className="px-4 py-2 text-right text-[#FF6B00] font-bold">{pct}%</td></tr>);
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Warm time pie charts */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center gap-1 mb-6"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Database className="text-[#FF6B00]" size={18} />기기 용량별 보온 지속시간 분포</h3><InfoTooltip text="모델 용량(3인/6인/10인)별로 보온을 얼마나 유지하는지 비중을 비교합니다." /></div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {[3, 6, 10].map(cap => {
                                                const gd = (warmTimes || []).filter((m: any) => { const n = m.modelName.toUpperCase(); if (cap === 3) return n.includes('03') || n.includes('3인'); if (cap === 6) return n.includes('06') || n.includes('6인') || n.includes('ID6'); return n.includes('10') || n.includes('10인'); });
                                                if (!gd.length) return null;
                                                const agg = [{ name: '0-2시간', value: gd.reduce((a: number, c: any) => a + c.t0 + c.t2, 0) }, { name: '2-6시간', value: gd.reduce((a: number, c: any) => a + c.t6, 0) }, { name: '6-12시간', value: gd.reduce((a: number, c: any) => a + c.t12, 0) }, { name: '12-24시간', value: gd.reduce((a: number, c: any) => a + c.t15 + c.t24, 0) }, { name: '24시간 이상', value: gd.reduce((a: number, c: any) => a + c.t36, 0) }];
                                                const PC = ['#94A3B8', '#60A5FA', '#10B981', '#F59E0B', '#FF6B00'];
                                                return (<div key={cap} className="flex flex-col items-center"><div className="mb-2 px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-[#FF6B00]">{cap}인용 제품군</div><div className="h-64 w-full"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={agg} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45} paddingAngle={2} label={({ name, percent, x, y, cx }: any) => { if (!percent || percent < 0.05) return ''; const r = x > cx; return (<text x={x} y={y} fill="#6B7280" textAnchor={r ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '10px', fontWeight: 'bold' }}>{`${name}(${(percent * 100).toFixed(0)}%)`}</text>); }}>{agg.map((_, i) => <Cell key={i} fill={PC[i % PC.length]} />)}</Pie><Tooltip formatter={(v: any) => [`${v.toLocaleString()}건`, '빈도']} /><Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} /></PieChart></ResponsiveContainer></div></div>);
                                            })}
                                        </div>
                                    </div>

                                    {/* Servings cross-tabs */}
                                    <div className="space-y-6">
                                        {[3, 6, 10].map(cap => {
                                            const gd = (servings || []).filter((s: any) => { const n = s.modelName.toUpperCase(); if (cap === 3) return n.includes('03') || n.includes('3인'); if (cap === 6) return n.includes('06') || n.includes('6인') || n.includes('ID6'); return n.includes('10') || n.includes('10인'); });
                                            if (!gd.length) return null;
                                            const menus = Array.from(new Set(gd.map((s: any) => s.menu)));
                                            const rows = menus.map(menu => { const md = gd.filter((s: any) => s.menu === menu); const counts = Array.from({ length: cap }).map((_, i) => md.filter((s: any) => Number(s.servingSize) === i).reduce((a: number, c: any) => a + Number(c.count), 0)); return { menu, counts, total: counts.reduce((a, c) => a + c, 0) }; }).sort((a, b) => b.total - a.total).slice(0, 10);
                                            return (<div key={cap} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto"><div className="flex items-center justify-between mb-4"><div className="flex items-center gap-1"><h3 className="font-bold flex items-center gap-2 text-gray-900"><Database className="text-[#FF6B00]" size={18} />{cap}인용 제품군 통합 메뉴별/인분별 심층 분석</h3><InfoTooltip text={`${cap}인용 모든 제품들의 지표를 합산하여 메뉴별 선호 인분수를 분석합니다.`} /></div><span className="text-xs font-bold text-[#FF6B00] bg-orange-50 px-2 py-1 rounded-lg">{cap}인용 합산</span></div><div className="overflow-hidden border border-gray-200 rounded-xl"><table className="w-full text-sm text-left text-gray-500"><thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0 z-20"><tr><th className="px-6 py-3 font-semibold sticky left-0 bg-gray-50 border-r min-w-[200px]">메뉴명 (통합)</th>{Array.from({ length: cap }).map((_, i) => <th key={i} className="px-4 py-3 text-center min-w-[70px]">{i + 1}인분</th>)}<th className="px-4 py-3 text-center min-w-[100px] bg-gray-100">합계</th></tr></thead><tbody>{rows.map((r: any) => (<tr key={r.menu} className="bg-white border-b hover:bg-orange-50 transition-colors"><td className="px-6 py-3 font-bold text-gray-900 sticky left-0 bg-white border-r shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">{r.menu}</td>{r.counts.map((c: number, i: number) => <td key={i} className="px-4 py-3 text-center font-medium">{c > 0 ? c.toLocaleString() : '-'}</td>)}<td className="px-4 py-3 text-center font-bold text-gray-900 bg-gray-50">{r.total.toLocaleString()}</td></tr>))}</tbody></table></div></div>);
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ────────── USAGE ────────── */}
                        {activeTab === 'usage' && (() => {
                            const { topRecipes, hourlyTrend, warmTimeStatus, dayOfWeekTrend, soakSteamDetails, servingSizeTrend, customTasteTrend, resvTimeTrend } = cache.usage;
                            return (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex items-center justify-between mb-6"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart3 className="text-[#FF6B00]" size={18} />인기 취사 메뉴 랭킹</h3><InfoTooltip text="조회 기간 동안 사용자들이 가장 많이 선택한 취사 메뉴 TOP 10입니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={topRecipes} layout="vertical" margin={{ top: 5, right: 20, bottom: 5, left: 30 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" /><XAxis type="number" axisLine={false} tickLine={false} hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#374151', fontSize: 13, fontWeight: 500 }} dx={-10} /><Tooltip cursor={{ fill: 'rgba(255,107,0,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [v.toLocaleString() + ' 회', '취사 수']} /><Bar dataKey="count" fill={ORANGE} radius={[0, 6, 6, 0]} barSize={24}>{topRecipes?.map((_: any, i: number) => <Cell key={i} fill={i === 0 ? ORANGE : '#FCA5A5'} />)}</Bar></BarChart></ResponsiveContainer></div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                            <div className="flex items-center justify-between mb-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Calendar className="text-[#8B5CF6]" size={18} />요일별 누적 취사량</h3><InfoTooltip text="요일별 전체 취사 횟수를 집계하여 어느 요일의 사용 빈도가 높은지 분석합니다." /><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <p className="text-sm text-gray-500 mb-6">어느 요일에 가장 많이 사용하는지 요일별 비교</p>
                                            <div className="flex-1 min-h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={dayOfWeekTrend} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 10 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" /><XAxis type="number" axisLine={false} tickLine={false} hide /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#4B5563', fontSize: 14, fontWeight: 600 }} dx={-10} /><Tooltip cursor={{ fill: 'rgba(139,92,246,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [v.toLocaleString() + ' 건', '취사 수']} /><Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={20}>{dayOfWeekTrend?.map((e: any, i: number) => <Cell key={i} fill={(e.name === '토' || e.name === '일') ? '#A78BFA' : '#8B5CF6'} />)}</Bar></BarChart></ResponsiveContainer></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock className="text-[#10B981]" size={18} />시간대별 단일 누적 트렌드</h3><InfoTooltip text="24시간 중 어느 시간대에 취사가 집중되는지 분석합니다." /><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={hourlyTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={2} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} /><Tooltip formatter={(v: any) => [v.toLocaleString() + ' 회', '취사 수']} contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{ stroke: '#10B981', strokeWidth: 1, strokeDasharray: '4 4' }} /><Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#10B981', stroke: '#fff', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Clock className="text-[#8B5CF6]" size={18} />예약 설정 시간대 패턴</h3><InfoTooltip text="사용자들이 예약 취사 기능을 어느 시간대에 가장 많이 설정하는지 분석합니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={resvTimeTrend} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={1} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }} formatter={(v: any) => [v.toLocaleString() + ' 건', '예약 설정 수']} /><Line name="예약 횟수" type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#8B5CF6', stroke: '#fff', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Database className="text-[#3B82F6]" size={18} />보온 시간 분포</h3><InfoTooltip text="취사 완료 후 보온 상태가 얼마나 지속되는지 시간대별 분포를 보여줍니다." /><span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-md">보온 사용 현황</span></div>
                                            <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={warmTimeStatus} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dx={-10} /><Tooltip cursor={{ fill: 'rgba(59,130,246,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [v.toLocaleString() + ' 건', '보온 로그 수']} /><Bar dataKey="count" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={32} /></BarChart></ResponsiveContainer></div>
                                        </div>
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><TrendingUp className="text-[#F43F5E]" size={18} />취사 인분 수 추이</h3><InfoTooltip text="가장 많이 요리되는 인분 수(규모)를 분석합니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={servingSizeTrend} margin={{ top: 5, right: 20, bottom: 5, left: -10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} /><Tooltip cursor={{ fill: 'rgba(244,63,94,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }} formatter={(v: any) => [v.toLocaleString() + ' 건', '취사량']} /><Bar name="취사량" dataKey="count" fill="#F43F5E" radius={[4, 4, 0, 0]} barSize={32} /></BarChart></ResponsiveContainer></div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
                                            <div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Heart className="text-[#F59E0B]" size={18} />맞춤형 밥맛 실사용률</h3><InfoTooltip text="기본 취사 기능 외에 '불림' 또는 '뜸' 단계를 조절하는 사용 비율입니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <p className="text-sm text-gray-500 mb-2">기본 세팅 외 디테일 밥맛 조절 기능 사용 빈도</p>
                                            <div className="flex-1 min-h-[200px] relative"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={customTasteTrend} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none"><Cell fill="#F59E0B" /><Cell fill="#10B981" /><Cell fill="#E5E7EB" /></Pie><Tooltip formatter={(v: any) => v.toLocaleString() + ' 건'} contentStyle={{ borderRadius: '12px', border: 'none' }} /></PieChart></ResponsiveContainer></div>
                                            <div className="flex justify-center gap-4 mt-2">{customTasteTrend?.map((e: any, i: number) => (<div key={e.name} className="flex items-center gap-1"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: ['#F59E0B', '#10B981', '#E5E7EB'][i] }} /><span className="text-xs text-gray-600 font-medium">{e.name} ({e.value?.toLocaleString()})</span></div>))}</div>
                                        </div>
                                        <div className="invisible lg:visible"></div>
                                    </div>
                                    {/* soak/steam cross-table */}
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex items-center justify-between mb-4"><div><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Hash className="text-gray-400" size={18} />메뉴별 불림/뜸 단계 교차 분석</h3><p className="text-sm text-gray-500 mt-1">주요 메뉴별로 불림과 뜸의 1~3단계 상세 선택 빈도를 비교합니다.</p></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                        <div className="overflow-x-auto border border-gray-200 rounded-xl">
                                            <table className="w-full text-sm text-center text-gray-500">
                                                <thead className="text-xs text-gray-700 uppercase bg-gray-50"><tr><th rowSpan={2} className="px-6 py-3 border-r border-gray-200 bg-gray-100 font-semibold text-left">메뉴명</th><th colSpan={3} className="px-4 py-2 border-b border-r border-gray-200 bg-orange-50 text-orange-700 font-semibold">불림 (Soak)</th><th colSpan={3} className="px-4 py-2 border-b border-gray-200 bg-blue-50 text-blue-700 font-semibold">뜸 (Steam)</th></tr><tr><th className="px-3 py-2 border-r border-gray-200">1단계</th><th className="px-3 py-2 border-r border-gray-200">2단계</th><th className="px-3 py-2 border-r border-gray-200 bg-orange-50">3단계</th><th className="px-3 py-2 border-r border-gray-200">1단계</th><th className="px-3 py-2 border-r border-gray-200">2단계</th><th className="px-3 py-2 bg-blue-50">3단계</th></tr></thead>
                                                <tbody>{soakSteamDetails && Array.from(new Set(soakSteamDetails.map((s: any) => s.menu))).slice(0, 8).map((mn: any) => { const g = (t: 'soak' | 'steam', l: number) => { const m = soakSteamDetails.find((s: any) => s.menu === mn && Number(s[t]) === l); return m ? Number(m.count) : 0; }; return (<tr key={mn} className="bg-white border-b hover:bg-gray-50 transition-colors"><td className="px-6 py-3 border-r border-gray-200 font-medium text-gray-900 text-left">{mn}</td><td className="px-3 py-3 font-mono">{g('soak', 1).toLocaleString()}</td><td className="px-3 py-3 font-mono">{g('soak', 2).toLocaleString()}</td><td className="px-3 py-3 font-mono border-r border-gray-200 bg-orange-50/30 text-orange-700">{g('soak', 3).toLocaleString()}</td><td className="px-3 py-3 font-mono">{g('steam', 1).toLocaleString()}</td><td className="px-3 py-3 font-mono">{g('steam', 2).toLocaleString()}</td><td className="px-3 py-3 font-mono bg-blue-50/30 text-blue-700">{g('steam', 3).toLocaleString()}</td></tr>); })}</tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* ────────── SMART ────────── */}
                        {activeTab === 'smart' && (() => {
                            const { appCtrlRatio, resvTimeTrend, modelAppRatio, hourlyTrend } = cache.smart;
                            const appPct = appCtrlRatio?.total > 0 ? Math.round((appCtrlRatio.app / appCtrlRatio.total) * 100) : 0;
                            return (
                                <div className="space-y-8 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-center">
                                            <div className="flex justify-between items-start mb-2"><div className="flex flex-col gap-1"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Smartphone className="text-[#10B981]" size={18} />스마트 앱 제어 비율</h3><div className="flex items-center gap-2"><p className="text-sm text-gray-500">앱을 통한 원격 실행 비율</p><InfoTooltip text="전체 취사 건수 중 스마트폰 앱으로 제어한 비율을 측정합니다." /></div></div><span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="mb-6" />
                                            <div className="flex justify-between items-end mb-2"><span className="text-4xl font-black text-[#10B981]">{appPct}%</span><span className="text-sm font-medium text-gray-500 mb-1">({appCtrlRatio?.app?.toLocaleString()} / {appCtrlRatio?.total?.toLocaleString()} 건)</span></div>
                                            <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden flex"><div className="h-full bg-[#10B981] transition-all duration-1000" style={{ width: appPct + '%' }} /><div className="h-full bg-orange-400 transition-all duration-1000" style={{ width: (100 - appPct) + '%' }} /></div>
                                            <div className="flex justify-between mt-4"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#10B981]" /><span className="text-sm font-medium text-gray-700">앱 제어 (Y)</span></div><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-400" /><span className="text-sm font-medium text-gray-700">수동 제어 (N)</span></div></div>
                                        </div>
                                        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Zap className="text-[#3B82F6]" size={18} />시간대별 방식 제어 (앱 vs 수동)</h3><InfoTooltip text="시간대별로 앱 제어와 수동 조작 성능을 비교 분석합니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                            <div className="h-[250px]"><ResponsiveContainer width="100%" height="100%"><LineChart data={hourlyTrend} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} interval={1} /><YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{ fill: '#F59E0B', fontSize: 12 }} dx={-10} /><YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#3B82F6', fontSize: 12 }} dx={10} /><Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }} /><Legend wrapperStyle={{ paddingTop: '10px' }} /><Line yAxisId="left" name="수동 취사 (Manual)" type="monotone" dataKey="manualCount" stroke="#F59E0B" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#F59E0B', stroke: '#fff', strokeWidth: 2 }} /><Line yAxisId="right" name="앱 제어 취사 (App)" type="monotone" dataKey="appCount" stroke="#3B82F6" strokeWidth={3} dot={{ r: 0 }} activeDot={{ r: 6, fill: '#3B82F6', stroke: '#fff', strokeWidth: 2 }} /></LineChart></ResponsiveContainer></div>
                                        </div>
                                    </div>
                                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-2"><h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><BarChart2 className="text-[#3B82F6]" size={18} />기기 모델별 스마트 제어 비율 (Top 10)</h3><InfoTooltip text="어느 기기 모델이 IoT 기능을 가장 활발하게 사용하는지 탑 10을 선정합니다." /></div><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{periodText}</span></div>
                                        <div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={modelAppRatio} margin={{ top: 5, right: 0, bottom: 5, left: -10 }}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dx={-10} /><Tooltip cursor={{ fill: 'rgba(59,130,246,0.05)' }} contentStyle={{ borderRadius: '12px', border: 'none' }}
                                            content={({ active, payload }: any) => {
                                                if (active && payload && payload.length) {
                                                    const app = payload[0].value;
                                                    const manual = payload[1].value;
                                                    const total = app + manual;
                                                    const pct = total > 0 ? ((app / total) * 100).toFixed(1) : 0;
                                                    return (
                                                        <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-100 font-['Pretendard']">
                                                            <p className="text-[12px] font-bold text-gray-900 mb-2">{payload[0].payload.name}</p>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between items-center gap-4 text-[11px]"><span className="text-blue-600 font-bold">앱 제어</span><span className="font-mono">{app.toLocaleString()} 건</span></div>
                                                                <div className="flex justify-between items-center gap-4 text-[11px]"><span className="text-red-400 font-bold">수동 취사</span><span className="font-mono">{manual.toLocaleString()} 건</span></div>
                                                                <div className="border-t border-gray-50 pt-1 mt-1 flex justify-between items-center gap-4 text-[11px] font-black"><span className="text-gray-900">앱 비중</span><span className="text-[#FF6B00]">{pct}%</span></div>
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }} />
                                            <Legend wrapperStyle={{ paddingTop: '10px' }} /><Bar name="앱 제어 취사량" dataKey="app" stackId="a" fill="#3B82F6" barSize={24} /><Bar name="수동 취사량" dataKey="manual" stackId="a" fill="#FCA5A5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                                    </div>
                                </div>
                            );
                        })()}
                    </>
                )}
            </div>
        </div>
    );
}
