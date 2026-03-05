import { useEffect, useState } from 'react';

export interface ClientSession {
  userName: string | null;
  modelKey: string | null;
  deviceKey: string | null;
  accessToken: string | null;
  svcKey: string | null;
}

const SESSION_KEYS: Record<keyof ClientSession, string> = {
  userName: 'userName',
  modelKey: 'modelKey',
  deviceKey: 'deviceKey',
  accessToken: 'accessToken',
  svcKey: 'svcKey',
};

const INITIAL_SESSION: ClientSession = {
  userName: null,
  modelKey: null,
  deviceKey: null,
  accessToken: null,
  svcKey: null,
};

export function useClientSession() {
  const [session, setSession] = useState<ClientSession>(INITIAL_SESSION);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setSession({
      userName: localStorage.getItem(SESSION_KEYS.userName),
      modelKey: localStorage.getItem(SESSION_KEYS.modelKey),
      deviceKey: localStorage.getItem(SESSION_KEYS.deviceKey),
      accessToken: localStorage.getItem(SESSION_KEYS.accessToken),
      svcKey: localStorage.getItem(SESSION_KEYS.svcKey),
    });
    setMounted(true);
  }, []);

  return { session, mounted };
}

export function buildWelcomeMessage(userName: string | null) {
  const displayName = userName ? `${userName}님` : '고객님';
  return `안녕하세요, ${displayName}! 고객님의 건강 목표와 식감 선호도에 맞춰 최적의 잡곡 블렌드를 추천해 드립니다. 가장 중요하게 생각하는 건강 목표와 식감을 알려주시겠어요?`;
}
