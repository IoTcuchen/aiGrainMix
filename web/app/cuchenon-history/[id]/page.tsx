'use client';
import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import { ManagerDashboard } from '@/app/manager/cuchenon/ManagerDashboard';
import { ModelsDashboard } from '@/app/manager/cuchenon/models/ModelsDashboard';
import { UsageDashboard } from '@/app/manager/cuchenon/usage/UsageDashboard';
import { SmartControlDashboard } from '@/app/manager/cuchenon/smart/SmartControlDashboard';

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
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetch(`/api/manager/cache/${params.id}`)
            .then(r => r.json())
            .then(d => { setCache(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [params.id]);

    const handleSavePage = async () => {
        if (saving || !cache) return;
        setSaving(true);
        try {
            // standalone viewer 번들 fetch
            const res = await fetch('/history-viewer.js');
            if (!res.ok) throw new Error('viewer 번들 로드 실패');
            const viewerJs = await res.text();

            // 데이터 임베드 (XSS 안전 위해 </script> 시퀀스 이스케이프)
            const dataJson = JSON.stringify(cache).replace(/<\/script>/gi, '<\\/script>');

            const html = `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>조회 이력 ${cache.start_date} ~ ${cache.end_date} — 쿠첸 관리자</title>
<link href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css" rel="stylesheet">
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F9FAFB; }
  .recharts-tooltip-wrapper { z-index: 10000 !important; }
</style>
</head>
<body>
<div id="history-viewer-root"></div>
<script>window.__CACHE__ = ${dataJson};</script>
<script>${viewerJs}</script>
</body>
</html>`;

            const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `조회이력_${cache.start_date}_${cache.end_date}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error(e);
            alert('페이지 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mb-4" />
                <p className="text-gray-500">캐시 데이터 로딩 중...</p>
            </div>
        </div>
    );
    if (!cache || cache.error) return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center font-['Pretendard']">
            <p className="text-gray-500">이력을 찾을 수 없습니다.</p>
        </div>
    );

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
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full">{periodText}</span>
                    <button
                        onClick={handleSavePage}
                        disabled={saving}
                        title="현재 페이지를 standalone HTML로 저장 (조회 화면과 동일하게 동작)"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-full hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-sm"
                    >
                        <Download size={14} /> {saving ? '저장 중…' : '페이지 저장'}
                    </button>
                </div>
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
                    <div className="text-center py-20 text-gray-400">이 탭 데이터는 아직 조회된 적 없습니다. <br /> 데이터를 조회하시려면 관리자 페이지에서 &quot;{periodText}&quot; 기간에 대한 조회를 진행해주세요.</div>
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
