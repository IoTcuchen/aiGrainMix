'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  // 1. 컴포넌트가 처음 뜰 때, 주소창에 returnUrl이 보이면 '일단 저장'해둠
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const returnUrl = urlParams.get('returnUrl');
      
      if (returnUrl) {
        localStorage.setItem('cuchen_return_url', returnUrl);
      }
    }
  }, []);

  // 2. 돌아가기 버튼 동작
  const goBackToCuchen = () => {
    if (typeof window === 'undefined') return;

    // 1순위: 저장소값, 2순위: 현재 주소창값
    const savedUrl = localStorage.getItem('cuchen_return_url');
    const urlParams = new URLSearchParams(window.location.search);
    const paramUrl = urlParams.get('returnUrl');

    const targetUrl = savedUrl || paramUrl;

    if (targetUrl) {
      window.location.href = targetUrl;
    } else {
      router.back();
    }
  };

  // 탭 스타일 결정 함수
  const getLinkClass = (path: string) => 
    `px-4 py-2 font-bold transition-colors rounded-t-lg ${
      pathname === path 
      ? 'text-blue-400 border-b-2 border-blue-500 bg-white/5' 
      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
    }`;

  return (
    <nav className="sticky top-0 z-50 w-full bg-brand-primary border-b border-gray-800 shadow-md backdrop-blur-md bg-opacity-90">
      {/* relative: 내부의 절대 위치 요소(버튼)의 기준점 역할 */}
      <div className="relative flex justify-center items-end px-4 pt-4">
        
        {/* 중앙: 탭 메뉴 */}
        <div className="flex space-x-2">
          <Link href="/" replace className={getLinkClass('/')}>
            📝 맞춤 설문
          </Link>
          <Link href="/chat" replace className={getLinkClass('/chat')}>
            💬 AI 챗봇
          </Link>
        </div>

        {/* 좌측: 닫기 버튼  */}
        <button 
          onClick={goBackToCuchen}
          className="absolute left-0 bottom-2 px-4 py-2.5 text-xs font-medium text-gray-300 border border-gray-600 rounded hover:bg-gray-800 hover:text-white transition-colors"
        >
          X
        </button>
      </div>
    </nav>
  );
}