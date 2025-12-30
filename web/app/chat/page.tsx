// web/app/chat/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import QuickReplyButtons from '@/components/QuickReplyButtons';
import type { ChatMessage, AppState, DebugLogEntry } from '@/lib/types';
import { sendChatMessage, sendResultToCuchen } from '@/lib/apiClient';
import { SparklesIcon } from '@/components/icons';
import ReturnModal from '@/components/ReturnModal'; // 모달 컴포넌트 임포트
import DebugPanel from '@/components/DebugPanel';

const INITIAL_APP_STATE: AppState = {
  conversation_stage: 'ask_health_goals',
  survey_state: {
    health_goals: [],
    texture_preference: null,
    avoid_or_allergy: [],
    own_grains: [],
  },
};

const initialBotMessage: ChatMessage = {
  id: 'initial-bot-message',
  role: 'bot',
  content: '안녕하세요! 고객님의 건강 목표와 식감 선호도에 맞춰 최적의 잡곡 블렌드를 추천해 드립니다. 먼저, 가장 중요하게 생각하는 건강 목표를 알려주시겠어요?',
};

// 서버 API를 호출하여 잡곡 이름을 정규화하는 함수
async function requestNormalization(currentState: AppState) {
  try {
    const res = await fetch('/api/normalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appState: currentState }),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("정규화 API 호출 실패:", error);
    return null;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);

  //  사용자 이름 및 모달 상태 관리
  const [userName, setUserName] = useState('');
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // 컴포넌트 마운트 시 사용자 이름 로드
  useEffect(() => {
    const storedName = localStorage.getItem('userName');
    if (storedName) {
      setUserName(storedName);
    }
  }, []);

  const currentQuickReplies = !isLoading ? (messages[messages.length - 1]?.quick_replies || []) : [];

  // 쿠첸ON 복귀 핸들러
  const handleReturnToCuchen = () => {
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      window.location.href = returnUrl;
    } else {
      alert('돌아갈 주소 정보가 없습니다. 창을 닫아주세요.');
      setIsReturnModalOpen(false);
    }
  };

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
      // 1. 챗봇 API로 메시지 전송
      const response = await sendChatMessage(userText, appState);

      // 2. 챗봇이 반환한 상태(appState)를 서버에서 정규화
      let nextAppState = response.appState;

      console.log("[Client] 정규화 요청 시작...");
      const normalizedData = await requestNormalization(nextAppState);

      if (normalizedData && normalizedData.normalizedState) {
        console.log("[Client] 정규화 완료:", normalizedData.normalizedState.survey_state.own_grains);
        nextAppState = normalizedData.normalizedState;
      } else {
        console.warn("정규화 건너뜀 (기존 상태 사용)");
      }

      // 3. 상태 및 메시지 업데이트
      setMessages((prev) => [...prev, response.message]);
      setAppState(nextAppState);

      if (response.debugLogs) {
        setDebugLogs(response.debugLogs);
      }

      // 4. 대화 완료(추천 생성) 시 처리
      if (response.isComplete) {
        setIsComplete(true);
        console.log("새로운 추천 완료:", response.message.recommendation);

        if (response.message.recommendation) {
          // (1) Cuchen 서버로 결과 전송
          // await를 사용하여 전송이 확실히 된 후 모달을 띄우는 것이 좋습니다.
          await sendResultToCuchen({
            type: 'chat',
            recommendation: response.message.recommendation,
            userState: response.appState,
          });

          // (2) 전송 후 복귀 모달 띄우기
          setIsReturnModalOpen(true);
        }
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
    setMessages([initialBotMessage]);
    setAppState(INITIAL_APP_STATE);
    setIsComplete(false);
    setDebugLogs([]);
    setIsReturnModalOpen(false); // 재시작 시 모달 닫기
  };

  return (
    <div className="flex flex-col h-full w-full bg-brand-primary text-brand-text relative">

      {/* 헤더 */}
      <header className="flex-none p-4 border-b border-gray-800 shadow-md flex items-center justify-between bg-brand-primary z-10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold text-white">
            {/* 사용자 이름이 있으면 이름 표시 */}
            {userName ? `${userName}님을 위한 잡곡 추천` : 'AI 잡곡 추천 챗봇'}
          </h1>
        </div>
        <button onClick={handleRestart} className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
          ↺ 처음으로
        </button>
      </header>

      {/* 채팅 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 scroll-smooth">
        <ChatWindow messages={messages} />
      </div>

      {/* 입력창 영역 */}
      <div className="flex-none bg-brand-primary border-t border-gray-800 p-4 pb-6 z-20 safe-area-bottom">
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
      </div>

      {/* 복귀 모달 (조건부 렌더링) */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        onConfirm={handleReturnToCuchen}
      />

      {/* <DebugPanel logs={debugLogs} /> */}
    </div>
  );
}