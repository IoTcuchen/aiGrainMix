import React, { useState, useCallback } from 'react';
import { SendIcon, MicIcon, RefreshCwIcon } from './icons';
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onRestart: () => void;
  isComplete: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  onRestart,
  isComplete
}) => {
  const [input, setInput] = useState('');

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
    e.preventDefault();
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // 추천 완료 시 버튼도 중앙 정렬
  if (isComplete) {
    return (
      <div className="flex justify-center w-full">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-user-bubble text-white font-semibold rounded-lg hover:bg-opacity-80 transition-colors shadow-lg"
        >
          <RefreshCwIcon className="w-5 h-5" />
          새로운 추천받기
        </button>
      </div>
    );
  }

  // [수정] 외곽 div(배경, 테두리, 패딩) 제거 -> 부모 컴포넌트가 레이아웃 제어
  return (
    <form onSubmit={handleSubmit} className="w-full flex gap-2 items-center relative">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? '듣고 있어요...' : '잡곡 추천을 위해 질문해주세요...'}
          className={`w-full border rounded-full px-4 py-3 pr-12 focus:outline-none focus:ring-2 transition-all shadow-md ${isListening
              ? 'border-brand-accent ring-2 ring-brand-accent bg-brand-accent/5'
              : 'border-gray-600 bg-brand-secondary text-brand-text focus:ring-brand-accent focus:border-brand-accent'
            }`}
          disabled={isLoading}
        />

        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isSupported || isLoading}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${isListening
              ? 'bg-red-500/10 text-red-500 animate-pulse'
              : 'text-gray-400 hover:text-brand-accent hover:bg-gray-700/50'
            } ${!isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
          title={isSupported ? "음성으로 입력" : "음성 인식을 지원하지 않는 브라우저입니다"}
        >
          <MicIcon className="w-5 h-5" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="bg-brand-accent text-white p-3 rounded-full hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex-shrink-0"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
};

export default MessageInput;