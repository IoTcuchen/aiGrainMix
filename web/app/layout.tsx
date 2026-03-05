import type { Metadata } from 'next';
import React from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: '맞춤형 잡곡 추천',
  description: 'AI 기반 잡곡 추천 서비스',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="bg-brand-primary text-brand-text min-h-screen">
        <main className="min-h-screen w-full relative">{children}</main>
      </body>
    </html>
  );
}
