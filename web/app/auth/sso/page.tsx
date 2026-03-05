'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SparklesIcon } from '@/components/icons';
import { logToServer } from '@/app/actions';

// useSearchParams를 사용하는 컴포넌트는 Suspense로 감싸야 빌드 에러가 없습니다.
function SSOHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1. URL에서 파라미터 추출
    const token = searchParams.get('token');
    const id = searchParams.get('loginId');
    const name = searchParams.get('name');
    const deviceKey = searchParams.get('deviceKey');
    const modelKey = searchParams.get('modelKey');

    logToServer(
      "SSO 처리 시도!!!", {
      fullUrl: window.location.href,
      token: token,
      id: id,
      name: name,
      deviceKey: deviceKey,
      modelKey: modelKey
    }
    );

    if (token) {
      console.log("SSO Token received:", token);
      console.log("User ID:", id);
      console.log("Device Key:", deviceKey);
      console.log("Model Key:", modelKey);

      // 2. 토큰 및 디바이스 정보 저장
      localStorage.setItem('accessToken', token);

      if (deviceKey) localStorage.setItem('deviceKey', deviceKey);
      if (modelKey) localStorage.setItem('modelKey', modelKey);

      // 3. 저장 후 메인 페이지(설문) 또는 채팅 페이지로 이동
      router.replace('/');
    } else {
      // 토큰이 없는 경우 에러 처리 혹은 로그인 페이지로 이동
      alert("로그인 정보가 유효하지 않습니다.");
      router.replace('/');
    }
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