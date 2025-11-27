import type { Metadata } from "next";
// FIX: Import React to use the React.ReactNode type.
import React from "react";
import "./globals.css";
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: "맞춤형 잡곡 추천",
  description: "AI 기반 잡곡 추천 서비스",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="bg-gray-50 min-h-screen flex flex-col">
        <NavBar /> {/* 상단 탭 추가 */}
        <main className="flex-grow">{children}</main>
      </body>
    </html>
  );
}