'use client';

import React, { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ChatWindow from '@/components/ChatWindow';
import QuickReplyButtons from '@/components/QuickReplyButtons';
import VoiceRecorder from '@/components/VoiceRecorder';
import type { ChatMessage, AppState } from '@/lib/types';
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

  // 상태 관리
  const [modelKey, setModelKey] = useState<string | null>(null);
  const [deviceKey, setDeviceKey] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [appState, setAppState] = useState<AppState>(INITIAL_APP_STATE);
  const [isLoading, setIsLoading] = useState(false); // LLM 응답 대기 상태
  const [isComplete, setIsComplete] = useState(false);

  // 음성 인식 및 시스템 상태 표시용
  const [systemStatus, setSystemStatus] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setModelKey(localStorage.getItem('modelKey'));
      setDeviceKey(localStorage.getItem('deviceKey'));
      const storedName = localStorage.getItem('userName');
      setUserName(storedName);

      const displayName = storedName ? `${storedName}님` : '고객님';
      const initialBotMessage: ChatMessage = {
        id: 'initial-bot-message',
        role: 'bot',
        content: `안녕하세요, ${displayName}! 고객님의 건강 목표와 식감 선호도에 맞춰 최적의 잡곡 블렌드를 추천해 드립니다. 궁금한 점을 말씀해 주세요.`,
      };
      setMessages([initialBotMessage]);
    }
  }, []);

  /**
   * ★ VoiceRecorder의 onResult 핸들러
   * 텍스트 변환이 완료되면 호출됩니다.
   */
  const handleVoiceResult = (text: string) => {
    setSystemStatus(null);
    if (!text.trim()) return;

    // 인식이 완료되면 입력창에 텍스트를 넣고 바로 전송합니다.
    setInputText(text);
    handleSendMessage(text);
  };

  /**
   * ★ VoiceRecorder의 상태 변경 핸들러
   * 녹음 중인지, STT 변환 중인지를 화면에 표시합니다.
   */
  const handleVoiceStatusChange = (status: 'recording' | 'processing' | 'idle') => {
    if (status === 'recording') {
      setSystemStatus("🎤 듣고 있어요... 말씀이 끝나면 버튼을 눌러주세요.");
    } else if (status === 'processing') {
      setSystemStatus("⏳ 목소리를 분석하고 있어요...");
    } else {
      setSystemStatus(null);
    }
  };

  const currentQuickReplies = !isLoading ? (messages[messages.length - 1]?.quick_replies || []) : [];

  const handleSendClick = () => {
    if (!inputText.trim() || isLoading) return;
    handleSendMessage(inputText);
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);
    setInputText(''); // 전송 시 입력창 비우기

    try {
      const response = await sendChatMessage(userText, appState);
      setMessages((prev) => [...prev, response.message]);
      setAppState(response.appState);

      if (response.isComplete) {
        setIsComplete(true);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: 'bot',
        content: '죄송합니다. 서버 연결 중 오류가 발생했습니다.',
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    const displayName = userName ? `${userName}님` : '고객님';
    setMessages([{
      id: 'restart',
      role: 'bot',
      content: `안녕하세요, ${displayName}! 다시 시작합니다. 건강 목표를 말씀해 주세요.`
    }]);
    setAppState(INITIAL_APP_STATE);
    setIsComplete(false);
    setInputText('');
    setSystemStatus(null);
  };

  const goBackToCuchen = () => {
    if (modelKey && deviceKey) {
      window.location.href = `cuchen://start_cooking?modelKey=${modelKey}&deviceKey=${deviceKey}`;
    } else {
      router.back();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white text-gray-900 relative overflow-hidden">
      {/* 헤더 */}
      <header className="flex-none p-4 border-b flex items-center justify-between bg-white shadow-sm z-10">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <SparklesIcon className="w-5 h-5 text-orange-500" />
          <h1 className="font-bold text-lg">AI 잡곡 추천</h1>
        </div>
        <button onClick={handleRestart} className="text-xs text-gray-400 hover:text-orange-500">↺ 초기화</button>
      </header>

      {/* 채팅창 */}
      <div className="flex-1 overflow-y-auto p-4 pb-40 bg-gray-50">
        <ChatWindow messages={messages} />

        {/* 시스템 상태 플로팅 UI */}
        {systemStatus && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-orange-600/90 text-white px-6 py-2 rounded-full text-sm z-50 shadow-2xl animate-pulse">
            {systemStatus}
          </div>
        )}
      </div>

      {/* 하단 입력 영역 */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-4xl mx-auto space-y-3">
          {isComplete ? (
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRestart} className="py-4 border border-gray-200 rounded-2xl bg-white font-medium active:bg-gray-50 transition-colors">다시 하기</button>
              <button onClick={goBackToCuchen} className="py-4 bg-orange-600 text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-all">밥솥 전송</button>
            </div>
          ) : (
            <>
              <QuickReplyButtons options={currentQuickReplies} onSelect={handleSendMessage} isLoading={isLoading} />

              <div className="flex items-center gap-3 bg-white p-2 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100">
                {/* ★ 핵심 수정: VoiceRecorder 속성명 변경
                  onTextConverted -> onResult
                  isLoading 상태를 isProcessing으로 전달
                */}
                <VoiceRecorder
                  onResult={handleVoiceResult}
                  isProcessing={isLoading}
                  onStatusChange={handleVoiceStatusChange}
                />

                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendClick()}
                  placeholder={isLoading ? "답변을 생성하고 있어요..." : "메시지를 입력하세요"}
                  disabled={isLoading}
                  className="flex-1 outline-none bg-transparent text-[15px]"
                />

                <button
                  onClick={handleSendClick}
                  disabled={isLoading || !inputText.trim()}
                  className={`w-12 h-12 flex items-center justify-center rounded-2xl font-bold transition-all ${inputText.trim() && !isLoading
                    ? 'bg-orange-500 text-white shadow-md active:scale-90'
                    : 'bg-gray-100 text-gray-300'
                    }`}
                >
                  <SparklesIcon className="w-5 h-5 rotate-12" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-gray-400">채팅 로드 중...</div>}>
      <ChatContent />
    </Suspense>
  );
}