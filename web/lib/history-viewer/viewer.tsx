'use client';
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ManagerDashboard } from '@/app/manager/cuchenon/ManagerDashboard';
import { ModelsDashboard } from '@/app/manager/cuchenon/models/ModelsDashboard';
import { UsageDashboard } from '@/app/manager/cuchenon/usage/UsageDashboard';
import { SmartControlDashboard } from '@/app/manager/cuchenon/smart/SmartControlDashboard';

declare global {
    interface Window {
        __CACHE__?: any;
    }
}

type TabKey = 'overview' | 'models' | 'usage' | 'smart';
const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: '요약' },
    { key: 'models', label: '기본 모델 현황' },
    { key: 'usage', label: '사용 패턴 통계' },
    { key: 'smart', label: '스마트 제어 분석' },
];

function HistoryViewerApp() {
    const cache = (typeof window !== 'undefined' && window.__CACHE__) || null;
    const firstAvailable = (TABS.find(t => cache?.[t.key])?.key) || 'overview';
    const [activeTab, setActiveTab] = useState<TabKey>(firstAvailable);

    if (!cache) {
        return <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>캐시 데이터가 없습니다.</div>;
    }

    const periodText = `${cache.start_date} ~ ${cache.end_date}`;
    const ext = (data: any) => ({ metrics: data, startDate: cache.start_date, endDate: cache.end_date });

    return (
        <div className="min-h-screen bg-[#F9FAFB] font-['Pretendard']">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow text-white font-bold">C</div>
                    <div>
                        <h1 className="text-base font-bold text-gray-900">쿠첸 관리자 — 조회 이력 상세</h1>
                        <p className="text-xs text-gray-400">저장: {cache.fetched_at}</p>
                    </div>
                </div>
                <span className="text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full">{periodText}</span>
            </div>

            {/* Tab bar */}
            <div className="bg-white border-b border-gray-100 px-6">
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key)}
                            disabled={!cache[t.key]}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === t.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}
                        >
                            {t.label} {!cache[t.key] && <span className="text-[10px] ml-1">(미저장)</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-6 md:p-10 max-w-7xl mx-auto pb-16">
                {!cache[activeTab] ? (
                    <div className="text-center py-20 text-gray-400">이 탭 데이터는 저장된 적이 없습니다.</div>
                ) : (
                    <>
                        {activeTab === 'overview' && <ManagerDashboard hideHeader externalData={ext(cache.overview)} />}
                        {activeTab === 'models' && <ModelsDashboard hideHeader externalData={ext(cache.models)} />}
                        {activeTab === 'usage' && <UsageDashboard hideHeader externalData={ext(cache.usage)} />}
                        {activeTab === 'smart' && <SmartControlDashboard hideHeader externalData={ext(cache.smart)} />}
                    </>
                )}
            </div>
        </div>
    );
}

const rootEl = document.getElementById('history-viewer-root');
if (rootEl) {
    const root = createRoot(rootEl);
    root.render(<HistoryViewerApp />);
}
