'use client';

import { useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { exchangeTokenServerAction } from './actions';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const isFetchedRef = useRef(false);
  const returnUrlParam = searchParams.get('returnUrl');

  useEffect(() => {
    if (!code || isFetchedRef.current) return;

    const runExchange = async () => {
      isFetchedRef.current = true;

      try {
        console.log('[Client] 서버 액션 호출 시작...');

        const data = await exchangeTokenServerAction(code);
        console.log('[Client] 서버 액션 결과:', data);

        // [수정 포인트] Java 서버 응답 구조(bean)에 맞춰서 조건 변경
        // 1. data.success가 true인지 확인
        // 2. data.bean 안에 ssoToken이 있는지 확인
        if (data && data.success && data.bean && data.bean.ssoToken) {

          console.log('[Client] 토큰 확보 성공:', data.bean.ssoToken);

          // 1. 토큰 저장 (경로 수정: data.bean.ssoToken)
          localStorage.setItem('accessToken', data.bean.ssoToken);

          if (data.bean.memKey) {
            localStorage.setItem('memKey', data.bean.memKey);
          }

          if (returnUrlParam) {
            // 1. returnUrl이 있으면 해당 URL로 이동
            localStorage.setItem('returnUrl', returnUrlParam);
          } else {
            //localStorage.setItem('returnUrl', '/');
          }

          // 2. 채팅 페이지로 이동
          router.replace('/chat');

        } else {
          // 에러 메시지도 data.message가 없으면 data.errors 등을 확인해야 할 수 있음
          throw new Error('토큰 정보를 찾을 수 없습니다.');
        }

      } catch (error) {
        console.error('[Client] 처리 실패:', error);
        alert('로그인 처리 중 오류가 발생했습니다.');
        router.push('/');
      }
    };

    runExchange();
  }, [code, router, returnUrlParam]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background text-foreground">
      <div className="animate-spin text-4xl">⏳</div>
      <h2 className="text-xl font-semibold">로그인 처리 중입니다...</h2>
      <p className="text-muted-foreground">잠시만 기다려주세요.</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CallbackContent />
    </Suspense>
  );
}