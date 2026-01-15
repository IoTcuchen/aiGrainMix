'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, SparklesIcon, TagIcon, ArrowLeftIcon } from '@/components/icons';

export default function Home() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const goBackToCuchen = () => {
    // if (typeof window === 'undefined') return;

    // const savedUrl = localStorage.getItem('cuchen_return_url');
    // const urlParams = new URLSearchParams(window.location.search);
    // const paramUrl = urlParams.get('returnUrl');

    // const targetUrl = savedUrl || paramUrl;

    // if (targetUrl) {
    //   // [핵심 수정] href -> replace (히스토리 쌓임 방지)
    //   window.location.replace(targetUrl);
    // } else {
    router.back();
    //}
  };

  if (!mounted) return null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-brand-primary text-brand-text relative overflow-hidden">

      {/* 헤더 */}
      <header className="absolute top-0 left-0 w-full p-4 flex items-center z-20">
        <button
          onClick={goBackToCuchen}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-gray-900"
          aria-label="닫기 / 이전으로"
        >
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </header>

      {/* 배경 효과 */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-2xl w-full text-center space-y-10">
        {/* 타이틀 영역 */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-brand-accent/20 inline-block">
              <SparklesIcon className="w-12 h-12 text-brand-accent" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-text leading-tight">
            {userName ? (
              <>
                반갑습니다, <span className="text-brand-accent">{userName}</span>님!
              </>
            ) : (
              'AI 잡곡 큐레이터'
            )}
          </h1>

          <p className="text-gray-500 text-lg">
            원하시는 방식으로 나만의 잡곡 황금비율을 찾아보세요.
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex flex-col gap-4 w-full max-w-md mx-auto">
          <Link
            href="/survey"
            className="group relative overflow-hidden bg-white border border-gray-200 hover:border-blue-500 rounded-2xl p-6 transition-all hover:shadow-lg text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-brand-text mb-1 flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-blue-500" />
                간편 설문 진단
              </h3>
              <p className="text-sm text-gray-500">리스트에서 빠르게 선택하고 추천받기</p>
            </div>
            <div className="bg-blue-50 p-2 rounded-full group-hover:bg-blue-500 transition-colors">
              <ArrowRightIcon className="w-6 h-6 text-blue-500 group-hover:text-white transition-colors" />
            </div>
          </Link>

          <Link
            href="/chat"
            className="group relative overflow-hidden bg-white border border-gray-200 hover:border-brand-accent rounded-2xl p-6 transition-all hover:shadow-lg text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-brand-text mb-1 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-brand-accent" />
                AI 대화형 추천
              </h3>
              <p className="text-sm text-gray-500">챗봇과 대화하며 꼼꼼하게 추천받기</p>
            </div>
            <div className="bg-orange-50 p-2 rounded-full group-hover:bg-brand-accent transition-colors">
              <ArrowRightIcon className="w-6 h-6 text-brand-accent group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-3 text-xs text-gray-400">
        {/* © 2026 AI Grain Mix. Powered by Cuchen. */}
      </footer>
    </main>
  );
}