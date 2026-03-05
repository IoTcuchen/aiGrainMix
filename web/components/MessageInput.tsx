import React, { useState, useCallback } from 'react';
import { SendIcon, MicIcon, RefreshCwIcon } from './icons';
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onRestart: () => void;
  isComplete: boolean;
}

function MessageInputComponent({
  onSendMessage,
  isLoading,
  onRestart,
  isComplete,
}: MessageInputProps) {
  const [input, setInput] = useState('');

  const handleVoiceResult = useCallback((text: string) => {
    setInput((prev) => {
      const needsSpace = prev.length > 0 && !prev.endsWith(' ');
      return prev + (needsSpace ? ' ' : '') + text;
    });
  }, []);

  const { isListening, startListening, stopListening, isSupported } = useVoiceRecognition(handleVoiceResult);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) {
      return;
    }
    onSendMessage(input);
    setInput('');
  }, [input, isLoading, onSendMessage]);

  const handleMicClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (isListening) {
      stopListening();
      return;
    }
    startListening();
  }, [isListening, startListening, stopListening]);

  if (isComplete) {
    return (
      <div className="flex justify-center w-full">
        <button onClick={onRestart} className="btn-primary px-6 py-3 shadow-lg">
          <RefreshCwIcon className="w-5 h-5 mr-2" />
          새로운 추천받기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex gap-2 items-center relative">
      <div className="relative flex-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? '듣고 있어요...' : '잡곡 추천을 위해 질문해주세요...'}
          className={`w-full border rounded-full px-4 py-3 pr-12 focus-visible:outline-none focus-visible:ring-2 transition-all shadow-md ${
            isListening
              ? 'border-brand-accent ring-2 ring-brand-accent bg-brand-accent/5'
              : 'border-gray-300 bg-brand-secondary text-brand-text focus-visible:ring-brand-accent focus:border-brand-accent'
          }`}
          disabled={isLoading}
          aria-label="채팅 입력"
        />

        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isSupported || isLoading}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
            isListening
              ? 'bg-red-500/10 text-red-500 animate-pulse'
              : 'text-gray-400 hover:text-brand-accent hover:bg-gray-100'
          } ${!isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
          title={isSupported ? '음성으로 입력' : '음성 인식을 지원하지 않는 브라우저입니다'}
          aria-label="음성 입력"
        >
          <MicIcon className="w-5 h-5" />
        </button>
      </div>

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="btn-primary p-3 rounded-full shadow-md flex-shrink-0"
        aria-label="메시지 전송"
      >
        <SendIcon className="w-5 h-5" />
      </button>
    </form>
  );
}

const MessageInput = React.memo(MessageInputComponent);

export default MessageInput;
