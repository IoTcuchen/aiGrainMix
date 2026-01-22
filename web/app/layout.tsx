import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: "맞춤형 잡곡 추천",
  description: "AI 기반 잡곡 추천 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      {/* [수정 포인트]
        - bg-brand-primary: globals.css에서 흰색으로 변경했으므로 흰색 배경 적용됨
        - text-white -> text-brand-text: 배경이 밝아졌으니 글씨는 어두운 색(brand-text)으로 변경해야 함
      */}
      <body className="bg-brand-primary text-brand-text h-[100dvh] flex flex-col overflow-hidden fixed inset-0">

        {/* <NavBar /> */}

        <main className="flex-1 flex flex-col min-h-0 w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}