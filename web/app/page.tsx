'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRightIcon,
  SparklesIcon,
  TagIcon,
  ArrowLeftIcon,
  MicIcon,
} from '@/components/icons';
import { useClientSession } from '@/lib/hooks/useClientSession';

export default function Home() {
  const router = useRouter();
  const { session, mounted } = useClientSession();

  const goBackToCuchen = () => {
    if (typeof window === 'undefined') {
      return;
    }

    const queryReturnUrl = new URLSearchParams(window.location.search).get('returnUrl');
    const savedReturnUrl = localStorage.getItem('returnUrl') || localStorage.getItem('cuchen_return_url');
    const targetUrl = queryReturnUrl || savedReturnUrl;

    if (targetUrl) {
      window.location.replace(targetUrl);
      return;
    }

    if (session.modelKey && session.deviceKey) {
      const customSchemeUrl = `cuchen://start_cooking?modelKey=${session.modelKey}&deviceKey=${session.deviceKey}`;
      window.location.href = customSchemeUrl;
      return;
    }

    router.back();
  };

  if (!mounted) {
    return null;
  }

  return (
    <main className="app-shell items-center justify-center p-6 text-brand-text">
      <header className="absolute top-0 left-0 w-full p-4 flex items-center z-20">
        <button onClick={goBackToCuchen} className="btn-ghost p-2 rounded-full" aria-label="닫기 / 이전으로">
          <ArrowLeftIcon className="w-6 h-6" />
        </button>
      </header>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-accent/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="z-10 max-w-2xl w-full text-center space-y-10">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-lg border border-brand-accent/20 inline-block">
              <SparklesIcon className="w-12 h-12 text-brand-accent" />
            </div>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-brand-text leading-tight">
            {session.userName ? (
              <>
                반갑습니다, <span className="text-brand-accent">{session.userName}</span>님!
              </>
            ) : (
              'AI 잡곡 큐레이터'
            )}
          </h1>

          <p className="text-gray-500 text-lg">원하시는 방식으로 나만의 잡곡 황금비율을 찾아보세요.</p>
        </div>

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

          <Link
            href="/cooking"
            className="group relative overflow-hidden bg-white border border-gray-200 hover:border-green-500 rounded-2xl p-6 transition-all hover:shadow-lg text-left flex items-center justify-between"
          >
            <div>
              <h3 className="text-xl font-bold text-brand-text mb-1 flex items-center gap-2">
                <MicIcon className="w-5 h-5 text-green-500" />
                빠른 음성 취사
              </h3>
              <p className="text-sm text-gray-500">말로 간편하게 맞춤 메뉴 취사하기</p>
            </div>
            <div className="bg-green-50 p-2 rounded-full group-hover:bg-green-500 transition-colors">
              <ArrowRightIcon className="w-6 h-6 text-green-500 group-hover:text-white transition-colors" />
            </div>
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-1 text-xs text-gray-400">© 2026 AI Grain Mix. Powered by Cuchen.</footer>
    </main>
  );
}
