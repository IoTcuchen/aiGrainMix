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
      <div className="flex justify-center w-full pb-4">
        <button
          onClick={onRestart}
          className="flex items-center gap-2 px-6 py-3 bg-[#FF6B00] text-white font-semibold rounded-full hover:bg-opacity-90 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined">refresh</span>
          새로운 추천받기
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full relative flex items-end gap-2 p-4">
      <div className="relative flex-1 bg-[#F2F4F6] dark:bg-[#2C2C2C] rounded-[24px] border border-transparent focus-within:border-[#E5E8EB] dark:focus-within:border-[#3F3F3F] transition-colors flex items-center min-h-[56px] px-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? '듣고 있어요...' : '잡곡 추천을 위해 질문해주세요...'}
          className="w-full bg-transparent border-none focus:ring-0 p-0 text-[15px] text-[#191F28] dark:text-white placeholder:text-[#8B95A1] dark:placeholder:text-[#A0A0A0] resize-none max-h-[120px] py-4"
          rows={1}
          style={{ scrollbarWidth: 'none' }}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button
          type="button"
          onClick={handleMicClick}
          disabled={!isSupported || isLoading}
          className={`p-2 -mr-2 transition-colors flex-none ${isListening
            ? 'text-red-500 animate-pulse'
            : 'text-[#8B95A1] dark:text-[#A0A0A0] hover:text-[#FF6B00]'
            } ${!isSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
        >
          <span className="material-symbols-outlined text-xl">mic</span>
        </button>
      </div>

      <button
        type="submit"
        disabled={!input.trim() || isLoading}
        className="flex-none w-12 h-[56px] rounded-[24px] bg-[#FF6B00] flex items-center justify-center text-white shadow-md shadow-[#FF6B00]/20 hover:bg-orange-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
      </button>
    </form>
  );
};

export default MessageInput;