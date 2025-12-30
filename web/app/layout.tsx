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
      {/* 
        1. h-[100dvh]: 모바일 웹뷰 높이 문제 해결 (주소창 제외한 실제 높이)
        2. overflow-hidden: 전체 화면 스크롤 막기 (채팅창 내부만 스크롤하기 위해)
      */}
      <body className="bg-brand-primary text-white h-[100dvh] flex flex-col overflow-hidden fixed inset-0">
        <NavBar /> 
        {/* 
          flex-1 flex flex-col min-h-0: 
          이 설정이 없으면 내부 채팅창이 화면을 뚫고 나가서 스크롤이 안 됩니다.
        */}
        <main className="flex-1 flex flex-col min-h-0 w-full relative">
          {children}
        </main>
      </body>
    </html>
  );
}