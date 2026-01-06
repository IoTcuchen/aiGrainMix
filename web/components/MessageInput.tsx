import React, { useState, useCallback } from 'react';
import { SendIcon, MicIcon, RefreshCwIcon } from './icons';
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onRestart: () => void; // page.tsx 호환을 위해 추가
  isComplete: boolean;    // page.tsx 호환을 위해 추가
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  onRestart,
  isComplete
}) => {
  const [input, setInput] = useState('');

  // 음성 인식 결과 처리 핸들러 (메모이제이션)
  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(' ');
      return prev + (needsSpace ? ' ' : '') + text;
    });
  }, []);

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition(handleVoiceResult);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input);
    setInput('');
  };

  const handleMicClick = (e: React.MouseEvent) => {
    e.preventDefault(); // 폼 제출 방지
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 추천이 완료된 상태일 때 '새로운 추천받기' 버튼 표시
  if (isComplete) {
    return (
      <div className="bg-brand-primary p-4 md:p-6 border-t border-gray-700 shadow-t-md z-20">
        <div className="max-w-4xl mx-auto flex justify-center">
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-6 py-3 bg-user-bubble text-white font-semibold rounded-lg hover:bg-opacity-80 transition-colors"
          >
            <RefreshCwIcon className="w-5 h-5" />
            새로운 추천받기
          </button>
        </div>
      </div>
    );
  }

  // 일반 채팅 입력 모드
  return (
    <div className="border-t border-brand-primary/20 bg-brand-primary/5 p-4 z-20">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-2 items-center">
        <div className="relative flex-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? '듣고 있어요...' : '잡곡 추천을 위해 질문해주세요...'}
            className={`w-full border rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all ${isListening
                ? 'border-brand-accent ring-2 ring-brand-accent bg-brand-accent/5'
                : 'border-gray-300 focus:ring-brand-accent'
              }`}
            disabled={isLoading}
          />

          {/* 마이크 버튼: 입력창 내부에 위치 */}
          <button
            type="button"
            onClick={handleMicClick}
            disabled={!isSupported || isLoading}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening
                ? 'bg-red-100 text-red-600 animate-pulse'
                : 'text-gray-400 hover:text-brand-accent hover:bg-gray-100'
              } ${!isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={isSupported ? "음성으로 입력" : "음성 인식을 지원하지 않는 브라우저입니다"}
          >
            <MicIcon className="w-5 h-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="bg-brand-accent text-white p-3 rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;