'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SparklesIcon } from '@/components/icons';
import { logToServer } from '@/app/actions';
import { exchangeSsoCode } from '@/lib/api/auth';

// useSearchParams를 사용하는 컴포넌트는 Suspense로 감싸야 빌드 에러가 없습니다.
function SSOHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. URL에서 code(또는 authCode) 추출
    const code = searchParams.get('code') || searchParams.get('authCode');

    logToServer("SSO 처리 시작", { code });

    if (!code) {
      console.warn("No auth code found in URL");
      // 만약 토큰이 직접 전달되는 예전 방식도 지원해야 한다면 여기에 추가 로직 필요
      return;
    }

    // 2. 서버에 코드를 주고 진짜 토큰/정보로 교환
    const performExchange = async () => {
      try {
        const result = await exchangeSsoCode(code);

        if (result.success) {
          console.log("SSO Exchange Success:", result);

          // 데이터 저장
          localStorage.setItem('accessToken', result.token);

          if (result.user) {
            localStorage.setItem('userName', result.user.name || '');
            localStorage.setItem('memKey', result.user.memKey || '');
          }

          if (result.device) {
            localStorage.setItem('deviceKey', result.device.deviceKey || '');
            localStorage.setItem('modelKey', result.device.modelKey || '');
          }

          // 3. 메인으로 이동
          router.replace('/');
        } else {
          alert("로그인 정보 교환에 실패했습니다: " + result.message);
          router.replace('/');
        }
      } catch (err) {
        console.error("Exchange Error:", err);
        alert("서버 통신 중 오류가 발생했습니다.");
      }
    };

    performExchange();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-brand-primary flex flex-col items-center justify-center text-white">
      <SparklesIcon className="w-10 h-10 text-blue-500 animate-spin mb-4" />
      <h2 className="text-xl font-bold">로그인 처리 중...</h2>
      <p className="text-gray-400 mt-2">잠시만 기다려주세요.</p>
    </div>
  );
}

export default function SSOPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <SSOHandler />
    </Suspense>
  );
}