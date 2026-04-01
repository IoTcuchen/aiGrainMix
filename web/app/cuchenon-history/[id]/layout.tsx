import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '조회 이력 상세 — 쿠첸 관리자',
};

export default function HistoryDetailLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <head>
                <link
                    href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"
                    rel="stylesheet"
                />
            </head>
            <body className="bg-[#F9FAFB] min-h-screen overflow-y-auto">
                {children}
            </body>
        </html>
    );
}
