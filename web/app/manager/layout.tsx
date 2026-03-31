'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Activity, Settings, Coffee, PieChart, Smartphone, TrendingUp, FileText, Cpu } from 'lucide-react';

export default function ManagerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { href: '/manager/cuchenon', icon: <LayoutDashboard size={20} />, label: '요약' },
        { href: '/manager/cuchenon/models', icon: <Cpu size={20} />, label: '기본 모델 현황' },
        { href: '/manager/cuchenon/usage', icon: <PieChart size={20} />, label: '사용 패턴 통계' },
        { href: '/manager/cuchenon/smart', icon: <Smartphone size={20} />, label: '스마트 제어 분석' },
        { href: '/manager/cuchenon/journey', icon: <Activity size={20} />, label: '동작 Flow' },
        // { href: '/manager/cuchenon/insights', icon: <TrendingUp size={20} />, label: '고급 고객 인사이트' },
    ];

    return (
        <div className="flex h-screen bg-[#F9FAFB] dark:bg-[#111827] text-gray-900 dark:text-gray-100 font-['Pretendard']">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-[#1F2937] border-r border-gray-200 dark:border-gray-800 hidden md:flex md:flex-col shadow-sm">
                <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-800">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#FF6B00] to-orange-400 rounded-xl flex items-center justify-center shadow-md">
                        <Coffee className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300">
                            쿠첸 관리자
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-gray-400">통합 관리 콘솔</p>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto mt-2">
                    <div className="mb-4 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">주요 기능</div>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${isActive
                                    ? 'bg-orange-50 dark:bg-orange-900/20 text-[#FF6B00]'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                    <button className="flex items-center gap-3 w-full px-4 py-3 text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl font-medium transition-colors">
                        <LogOut size={20} />
                        로그아웃
                    </button>
                </div> */}
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto no-scrollbar">
                {/* Mobile Header */}
                <header className="md:hidden bg-white dark:bg-[#1F2937] border-b border-gray-200 dark:border-gray-800 p-4 sticky top-0 z-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#FF6B00] to-orange-400 rounded-lg flex items-center justify-center">
                            <Coffee className="text-white" size={16} />
                        </div>
                        <h1 className="font-bold">관리 콘솔</h1>
                    </div>
                </header>

                <div className="p-6 md:p-10 max-w-7xl mx-auto h-full">
                    {children}
                </div>
            </main>
        </div>
    );
}
