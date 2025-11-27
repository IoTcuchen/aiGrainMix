// app/chat/page.tsx
'use client';

import React, { useState } from 'react';
import ChatWindow from '@/components/ChatWindow';
import MessageInput from '@/components/MessageInput';
import QuickReplyButtons from '@/components/QuickReplyButtons';
import type { ChatMessage, AppState, DebugLogEntry } from '@/lib/types';
import { sendChatMessage } from '@/lib/apiClient';
import { SparklesIcon } from '@/components/icons';
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

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([initialBotMessage]);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [debugLogs, setDebugLogs] = useState<DebugLogEntry[]>([]);
  
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

      if (response.debugLogs) {
        setDebugLogs(response.debugLogs);
      }

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
      setMessages([initialBotMessage]);
      setAppState(INITIAL_APP_STATE);
      setIsComplete(false);
      setDebugLogs([]);
  };
  
  return (
    // [수정] h-[calc(100vh-65px)] : 전체 화면에서 NavBar 높이(약 65px)만큼 뺀 높이로 고정
    <div className="flex flex-col h-[calc(100vh-65px)] bg-brand-primary text-brand-text relative overflow-hidden">
      
      {/* 채팅방 헤더 */}
      <header className="flex-none p-4 border-b border-gray-800 shadow-md flex items-center justify-between bg-brand-primary z-10">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-6 h-6 text-blue-500"/>
          <h1 className="text-xl font-bold text-white">AI 잡곡 추천 챗봇</h1>
        </div>
        
        <button 
          onClick={handleRestart}
          className="text-xs px-3 py-1.5 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          ↺ 처음으로
        </button>
      </header>

      {/* [수정] 채팅 영역: flex-1로 남은 공간을 모두 차지하고, overflow-y-auto로 스크롤 활성화 */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        <ChatWindow messages={messages} />
      </div>
      
      {/* [수정] 하단 입력 영역: flex-none으로 높이 고정 (스크롤 영향 안 받음) */}
      <div className="flex-none bg-brand-primary border-t border-gray-800 p-4 pb-6 z-20">
        <QuickReplyButtons
          options={currentQuickReplies}
          onSelect={handleSendMessage}
          isLoading={isLoading}
        />
        
        <MessageInput
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          onRestart={handleRestart}
          isComplete={false} 
        />
      </div>

      <DebugPanel logs={debugLogs} />
    </div>
  );
}