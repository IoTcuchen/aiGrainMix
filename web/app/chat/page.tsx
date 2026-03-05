'use client';

import React, { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import QuickReplyButtons from '@/components/QuickReplyButtons';
import type { ChatMessage, AppState, DebugLogEntry } from '@/lib/types';
import { sendChatMessage } from '@/lib/apiClient';
import { SparklesIcon, ArrowLeftIcon } from '@/components/icons';
import { buildWelcomeMessage, useClientSession } from '@/lib/hooks/useClientSession';

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
  const { session } = useClientSession();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  const initialMessage = useMemo<ChatMessage>(() => ({
    id: 'initial-bot-message',
    role: 'bot',
    content: buildWelcomeMessage(session.userName),
  }), [session.userName]);

  useEffect(() => {
    setMessages([initialMessage]);
  }, [initialMessage]);

  const currentQuickReplies = !isLoading ? (messages[messages.length - 1]?.quick_replies || []) : [];

  const handleSendMessage = useCallback(async (userText: string) => {
    if (!userText.trim()) {
      return;
    }

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
      if (response.debugLogs) {
        setDebugLogs(response.debugLogs);
      }
      if (response.isComplete) {
        setIsComplete(true);
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
  }, [appState]);

  const handleRestart = useCallback(() => {
    setMessages([initialMessage]);
    setAppState(INITIAL_APP_STATE);
    setIsComplete(false);
    setDebugLogs([]);
  }, [initialMessage]);

  const goBackToCuchen = useCallback(() => {
    if (session.modelKey && session.deviceKey) {
      const targetUrl = `cuchen://start_cooking?modelKey=${session.modelKey}&deviceKey=${session.deviceKey}`;
      window.location.href = targetUrl;
      return;
    }

    router.back();
  }, [router, session.deviceKey, session.modelKey]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-1 rounded-full" aria-label="홈으로 이동">
            <ArrowLeftIcon className="w-6 h-6 text-gray-500" />
          </button>
          <SparklesIcon className="w-6 h-6 text-brand-accent" />
          <div>
            <h1 className="text-xl font-bold text-brand-text">AI 잡곡 추천 챗봇</h1>
            {session.userName && <p className="text-xs text-brand-accent font-medium">접속자: {session.userName}</p>}
          </div>
        </div>
        <button onClick={handleRestart} className="btn-secondary text-xs px-3 py-1.5" aria-label="대화 초기화">
          <span>↺</span> 처음으로
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-40 scroll-smooth">
        <ChatWindow messages={messages} />
      </div>

      <div className="absolute bottom-0 left-0 w-full z-20 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white via-white/90 to-transparent -z-10" />

        <div className="p-4 pb-4 w-full pointer-events-auto">
          <div className="max-w-4xl mx-auto w-full space-y-2">
            {isComplete ? (
              <div className="grid grid-cols-2 gap-3 animate-fade-in">
                <button onClick={handleRestart} className="btn-secondary py-3 bg-white/80 backdrop-blur-sm shadow-sm">
                  ↺ 처음으로
                </button>
                <button onClick={goBackToCuchen} className="btn-primary py-3 shadow-lg">
                  취사하기
                </button>
              </div>
            ) : (
              <>
                <QuickReplyButtons options={currentQuickReplies} onSelect={handleSendMessage} isLoading={isLoading} />
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
