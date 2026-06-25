'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChefHat, Download } from 'lucide-react';
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
    const topBarRef = useRef<HTMLDivElement>(null);
    const tabBarRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`/api/manager/cache/${params.id}`)
            .then(r => r.json())
            .then(d => { setCache(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, [params.id]);

    const handleSavePage = async () => {
        if (saving || !cache) return;
        setSaving(true);
        const originalTab = activeTab;

        try {
            // 1. 모든 탭을 순회하며 마크업 캡쳐
            const tabKeys: TabKey[] = ['overview', 'models', 'usage', 'smart'];
            const tabPanels: Partial<Record<TabKey, string>> = {};
            for (const key of tabKeys) {
                if (!cache[key]) continue;
                setActiveTab(key);
                // recharts ResponsiveContainer 측정 + 차트 렌더 + 애니메이션 완료까지 대기 (PieChart 등)
                await new Promise(r => setTimeout(r, 5000));
                if (contentRef.current) {
                    tabPanels[key] = contentRef.current.innerHTML;
                }
            }
            setActiveTab(originalTab);
            // 원래 탭으로 복원되며 클론된 DOM 영향 없도록 한 프레임 대기
            await new Promise(r => setTimeout(r, 50));

            // 2. 모든 stylesheet 텍스트 추출 (CORS 막힌 외부 시트는 fetch로 보완)
            const cssParts: string[] = [];
            for (const sheet of Array.from(document.styleSheets)) {
                let extracted = '';
                try {
                    const rules = (sheet as CSSStyleSheet).cssRules;
                    if (rules) {
                        extracted = Array.from(rules).map((r: any) => r.cssText).join('\n');
                    }
                } catch {
                    if (sheet.href) {
                        try {
                            const res = await fetch(sheet.href);
                            if (res.ok) extracted = await res.text();
                        } catch { /* 무시 */ }
                    }
                }
                if (extracted) cssParts.push(extracted);
            }
            const css = cssParts.join('\n');

            // 3. Top bar / Tab bar 클로닝 (저장 버튼 등 export 제외 항목 제거)
            const cloneClean = (el: HTMLElement | null): string => {
                if (!el) return '';
                const c = el.cloneNode(true) as HTMLElement;
                c.querySelectorAll('[data-no-export="true"]').forEach(n => n.remove());
                return c.outerHTML;
            };
            const topBarHtml = cloneClean(topBarRef.current);
            const tabBarHtml = cloneClean(tabBarRef.current);

            // 4. 탭 panel을 모두 합치되 초기에는 originalTab만 표시
            const panelsHtml = tabKeys.map(k => {
                if (!tabPanels[k]) return '';
                const hidden = k === originalTab ? '' : ' style="display:none"';
                return `<div data-tab-panel="${k}"${hidden}>${tabPanels[k]}</div>`;
            }).join('\n');

            // 5. 인라인 script: data-tab-trigger 클릭 → 해당 패널만 표시 + 활성 스타일 토글
            const tabSwitchScript = `
<script>
(function() {
  var triggers = document.querySelectorAll('[data-tab-trigger]');
  var panels = document.querySelectorAll('[data-tab-panel]');
  function activate(key) {
    panels.forEach(function(p) {
      p.style.display = p.getAttribute('data-tab-panel') === key ? '' : 'none';
    });
    triggers.forEach(function(b) {
      var isActive = b.getAttribute('data-tab-trigger') === key;
      b.classList.toggle('border-orange-600', isActive);
      b.classList.toggle('text-orange-600', isActive);
      b.classList.toggle('border-transparent', !isActive);
      b.classList.toggle('text-gray-500', !isActive);
    });
  }
  triggers.forEach(function(b) {
    if (b.disabled) return;
    b.addEventListener('click', function() {
      var k = b.getAttribute('data-tab-trigger');
      if (k) activate(k);
    });
  });
})();
</script>`;

            const headHtml = document.head.innerHTML;

            const html = `<!DOCTYPE html>
<html lang="ko">
<head>
${headHtml}
<style>${css}</style>
<style>
  [data-no-export="true"] { display: none !important; }
</style>
</head>
<body class="${document.body.className}">
  <div class="min-h-screen bg-[#F9FAFB] font-['Pretendard']">
    ${topBarHtml}
    ${tabBarHtml}
    <div class="p-6 md:p-10 max-w-7xl mx-auto pb-16">
      ${panelsHtml}
    </div>
  </div>
  ${tabSwitchScript}
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
            setActiveTab(originalTab);
        } finally {
            setSaving(false);
        }
    };

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
            <div ref={topBarRef} className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-400 rounded-xl flex items-center justify-center shadow"><ChefHat className="text-white" size={18} /></div>
                    <div><h1 className="text-base font-bold text-gray-900">쿠첸 관리자 — 조회 이력 상세</h1><p className="text-xs text-gray-400">저장: {cache.fetched_at}</p></div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold bg-orange-50 text-orange-700 border border-orange-200 px-4 py-1.5 rounded-full">{periodText}</span>
                    <button
                        data-no-export="true"
                        onClick={handleSavePage}
                        disabled={saving}
                        title="현재 보이는 화면을 그대로 HTML로 저장"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 text-white rounded-full hover:bg-sky-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-bold text-sm shadow-sm"
                    >
                        <Download size={14} /> {saving ? '저장 중…' : '페이지 저장'}
                    </button>
                </div>
            </div>

            {/* Tab bar */}
            <div ref={tabBarRef} className="bg-white border-b border-gray-100 px-6">
                <div className="flex gap-1">
                    {TABS.map(t => (
                        <button key={t.key} data-tab-trigger={t.key} onClick={() => setActiveTab(t.key)} disabled={!cache[t.key]}
                            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${activeTab === t.key ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'}`}>
                            {t.label} {!cache[t.key] && <span className="text-[10px] ml-1">(미저장)</span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div ref={contentRef} className="p-6 md:p-10 max-w-7xl mx-auto pb-16">
                {!cache[activeTab] ? (
                    <div className="text-center py-20 text-gray-400">이 탭 데이터는 아직 조회된 적 없습니다. <br /> 데이터를 조회하시려면 관리자 페이지에서 "{periodText}" 기간에 대한 조회를 진행해주세요. </div>
                ) : (
                    <>
                        {activeTab === 'overview' && (<ManagerDashboard hideHeader externalData={{ metrics: cache.overview, startDate: cache.start_date, endDate: cache.end_date }} />)}
                        {activeTab === 'models' && (<ModelsDashboard hideHeader externalData={{ metrics: cache.models, startDate: cache.start_date, endDate: cache.end_date }} />)}
                        {activeTab === 'usage' && (<UsageDashboard hideHeader externalData={{ metrics: cache.usage, startDate: cache.start_date, endDate: cache.end_date }} />)}
                        {activeTab === 'smart' && (<SmartControlDashboard hideHeader externalData={{ metrics: cache.smart, startDate: cache.start_date, endDate: cache.end_date }} />)}
                    </>
                )}
            </div>
        </div>
    );
}
