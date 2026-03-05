// app/chat/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import QuickReplyButtons from '@/components/QuickReplyButtons';
import type { ChatMessage, AppState, DebugLogEntry } from '@/lib/types';
import { sendChatMessage } from '@/lib/apiClient';
import { SparklesIcon, ArrowLeftIcon } from '@/components/icons';

const INITIAL_APP_STATE: AppState = {
  conversation_stage: 'ask_health_goals',
  survey_state: {
    health_goals: [],
    texture_preference: null,
    avoid_or_allergy: [],
    own_grains: [],
  },
};

function ChatContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL 파라미터 추출 (예: ?modelKey=123&deviceKey=456)
  const modelKey = localStorage.getItem('modelKey');
  const deviceKey = localStorage.getItem('deviceKey');

  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    setUserName(storedName);
    const displayName = storedName ? `${storedName}님` : '고객님';
    const initialBotMessage: ChatMessage = {
      id: 'initial-bot-message',
      role: 'bot',
      content: `안녕하세요, ${displayName}! 고객님의 건강 목표와 식감 선호도에 맞춰 최적의 잡곡 블렌드를 추천해 드립니다. 가장 중요하게 생각하는 건강 목표와 식감을 알려주시겠어요?`,
    };
    setMessages([initialBotMessage]);
  }, []);

  const currentQuickReplies = !isLoading ? (messages[messages.length - 1]?.quick_replies || []) : [];

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim()) return;
    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(userText, appState);
      setMessages((prev) => [...prev, response.message]);
      setAppState(response.appState);
      if (response.debugLogs) setDebugLogs(response.debugLogs);
      if (response.isComplete) {
        setIsComplete(true);
        console.log("새로운 추천 완료:", response.message.recommendation);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'bot',
        content: '죄송합니다. 서버 연결 중 오류가 발생했습니다.',
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    const displayName = userName ? `${userName}님` : '고객님';
    const restartMessage: ChatMessage = {
      id: 'initial-bot-message',
      role: 'bot',
      content: `안녕하세요, ${displayName}! 고객님의 건강 목표와 식감 선호도에 맞춰 최적의 잡곡 블렌드를 추천해 드립니다. 가장 중요하게 생각하는 건강 목표와 식감을 알려주시겠어요?`
    };
    setMessages([restartMessage]);
    setAppState(INITIAL_APP_STATE);
    setIsComplete(false);
    setDebugLogs([]);
  };

  const handleGoHome = () => {
    router.back();
  };

  // iOS 앱 인터셉트용 커스텀 스키마 호출
  const goBackToCuchen = () => {
    if (typeof window === 'undefined') return;

    // 1. 앱 네이티브 기능을 호출하기 위한 Custom Scheme 구성
    // iOS 코드 매칭: if let scheme = url.scheme, scheme == "cuchen"
    if (modelKey && deviceKey) {
      // 예: cuchen://start_cooking?modelKey=123&deviceKey=456
      const targetUrl = `cuchen://start_cooking?modelKey=${modelKey}&deviceKey=${deviceKey}`;

      console.log("앱 네이티브 명령 호출:", targetUrl);

      // 웹뷰가 이 URL로 이동을 시도하면, iOS Native Code가 이를 가로채서 실행합니다.
      window.location.href = targetUrl;
      return;
    }

    else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-brand-primary text-brand-text relative overflow-hidden">
      {/* 헤더 */}
      <header className="flex-none p-4 border-b border-gray-200 shadow-sm flex items-center justify-between bg-brand-primary z-10">
        <div className="flex items-center gap-3">
          <button onClick={handleGoHome} className="p-1 hover:bg-gray-100 rounded-full transition-colors" aria-label="홈으로 이동">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
          </button>
          <SparklesIcon className="w-6 h-6 text-brand-accent" />
          <div>
            <h1 className="text-xl font-bold text-brand-text">AI 잡곡 추천 챗봇</h1>
            {userName && <p className="text-xs text-brand-accent font-medium">접속자: {userName}</p>}
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors flex items-center gap-1"
        >
          <span>↺</span> 처음으로
        </button>
      </header>

      {/* 채팅창 */}
      <div className="flex-1 overflow-y-auto p-4 pb-40 scroll-smooth">
        <ChatWindow messages={messages} />
      </div>

      {/* 입력/버튼 영역 */}
      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent -z-10" />

        <div className="p-4 pb-4 w-full pointer-events-auto">
          <div className="max-w-4xl mx-auto w-full space-y-2">
            {isComplete ? (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <button
                  onClick={handleRestart}
                  className="py-3 border border-gray-300 text-gray-500 rounded-xl font-bold hover:bg-gray-50 transition-colors bg-white/80 backdrop-blur-sm shadow-sm"
                >
                  ↺ 처음으로
                </button>
                <button
                  onClick={goBackToCuchen}
                  className="py-3 bg-brand-accent text-white rounded-xl font-bold hover:bg-brand-accent-hover transition-colors shadow-lg"
                >
                  취사하기
                </button>
              </div>
            ) : (
              <>
                <QuickReplyButtons
                  options={currentQuickReplies}
                  onSelect={handleSendMessage}
                  isLoading={isLoading}
                />
                <MessageInput
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  onRestart={handleRestart}
                  isComplete={isComplete}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatContent />
    </Suspense>
  );
}