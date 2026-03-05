'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SparklesIcon } from '@/components/icons';
import { logToServer } from '@/app/actions';

function SSOHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const id = searchParams.get('loginId');
    const name = searchParams.get('name');
    const deviceKey = searchParams.get('deviceKey');
    const modelKey = searchParams.get('modelKey');
    const returnUrl = searchParams.get('returnUrl');

    logToServer('SSO 처리 시도!!!', {
      fullUrl: window.location.href,
      token,
      id,
      name,
      deviceKey,
      modelKey,
      returnUrl,
    });

    if (!token) {
      alert('로그인 정보가 유효하지 않습니다.');
      router.replace('/');
      return;
    }

    localStorage.setItem('accessToken', token);
    if (deviceKey) localStorage.setItem('deviceKey', deviceKey);
    if (modelKey) localStorage.setItem('modelKey', modelKey);
    if (returnUrl) {
      localStorage.setItem('returnUrl', returnUrl);
      localStorage.setItem('cuchen_return_url', returnUrl);
    }

    router.replace('/');
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
