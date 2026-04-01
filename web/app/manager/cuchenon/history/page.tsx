'use client';

import React, { useState, useEffect } from 'react';
import { History, Trash2, ExternalLink, Database, CalendarRange, Clock } from 'lucide-react';

interface CacheEntry {
    id: number;
    start_date: string;
    end_date: string;
    fetched_at: string;
}

export default function QueryHistoryPage() {
    const [list, setList] = useState<CacheEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<number | null>(null);

    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/manager/cache');
            const data = await res.json();
            setList(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchList(); }, []);

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('이 조회 이력을 삭제하시겠습니까?')) return;
        setDeleting(id);
        try {
            await fetch('/api/manager/cache', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id }),
            });
            setList(prev => prev.filter(item => item.id !== id));
        } catch (e) {
            console.error(e);
        } finally {
            setDeleting(null);
        }
    };

    const handleOpen = (id: number) => {
        window.open(`/cuchenon-history/${id}`, '_blank');
    };

    const calculateDays = (start: string, end: string) => {
        const diffTime = Math.abs(new Date(end).getTime() - new Date(start).getTime());
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    };

    return (
        <div className="space-y-8 pb-10 animate-in fade-in duration-500 font-['Pretendard']">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <History className="text-orange-600" /> 조회 이력
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        과거 조회된 데이터를 서버 캐시에서 즉시 불러옵니다. RDS를 다시 조회하지 않습니다.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-gray-100 dark:border-gray-700">
                        <Database size={14} className="text-orange-500" />
                        총 {list.length}개 이력 저장됨
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
                </div>
            ) : list.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-[#1F2937] rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <div className="w-20 h-20 bg-orange-50 dark:bg-orange-900/20 rounded-full flex items-center justify-center mb-6">
                        <History className="text-orange-600 w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">아직 조회 이력이 없습니다</h3>
                    <p className="text-gray-500 text-center max-w-md px-4">
                        대시보드 각 탭에서 날짜를 선택하고 조회하면<br />
                        결과가 자동으로 여기에 저장됩니다.
                    </p>
                </div>
            ) : (
                <div className="bg-white dark:bg-[#1F2937] rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        <span>조회 기간</span>
                        <span className="text-right">기간 일수</span>
                        <span className="text-right">저장 일시</span>
                        <span className="text-right">관리</span>
                    </div>

                    {/* Table Rows */}
                    <div className="divide-y divide-gray-50 dark:divide-gray-800">
                        {list.map((item) => {
                            const days = calculateDays(item.start_date, item.end_date);
                            return (
                                <div
                                    key={item.id}
                                    onClick={() => handleOpen(item.id)}
                                    className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-4 items-center hover:bg-orange-50/40 dark:hover:bg-orange-900/10 cursor-pointer transition-colors group"
                                >
                                    {/* 조회 기간 */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                            <CalendarRange size={16} className="text-orange-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                                                {item.start_date} ~ {item.end_date}
                                            </p>
                                        </div>
                                        <ExternalLink size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors ml-1" />
                                    </div>

                                    {/* 기간 일수 */}
                                    <div className="text-right">
                                        <span className="text-sm font-mono font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                                            {days}일
                                        </span>
                                    </div>

                                    {/* 저장 일시 */}
                                    <div className="text-right flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                        <Clock size={12} />
                                        {item.fetched_at}
                                    </div>

                                    {/* 삭제 */}
                                    <div className="text-right">
                                        <button
                                            onClick={(e) => handleDelete(item.id, e)}
                                            disabled={deleting === item.id}
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                            title="삭제"
                                        >
                                            {deleting === item.id ? (
                                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="text-xs text-gray-400 text-center">
                * 조회 이력은 서버(EC2)의 SQLite DB에 저장되며, 모든 관리자가 공유합니다.
            </div>
        </div>
    );
}
