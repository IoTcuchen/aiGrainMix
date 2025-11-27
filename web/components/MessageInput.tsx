
'use client';

import React, { useState, useEffect } from 'react';
import { useVoiceRecognition } from '@/lib/hooks/useVoiceRecognition';
import { SendIcon, RefreshCwIcon, MicIcon } from '@/components/icons';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onRestart: () => void;
  isComplete: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, onRestart, isComplete }) => {
  const [inputValue, setInputValue] = useState('');
  const { isListening, transcript, startListening, stopListening } = useVoiceRecognition();

  useEffect(() => {
    if (transcript) {
      setInputValue(transcript);
    }
  }, [transcript]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      onSendMessage(inputValue.trim());
      setInputValue('');
      if(isListening) {
        stopListening();
      }
    }
  };

  if (isComplete) {
    return (
      <div className="bg-brand-primary p-4 md:p-6 border-t border-gray-700 shadow-t-md">
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

  return (
    <div className="bg-brand-primary p-4 md:p-6 border-t border-gray-700 shadow-t-md">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={isListening ? '듣고 있어요...' : '메시지를 입력하거나 마이크를 누르세요...'}
              disabled={isLoading}
              className="w-full p-3 pl-4 pr-12 bg-brand-secondary border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-user-bubble transition-all duration-200"
            />
             <button
              type="button"
              onClick={handleMicClick}
              disabled={isLoading}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-700'}`}
              aria-label={isListening ? '음성인식 중지' : '음성인식 시작'}
            >
              <MicIcon className="w-5 h-5" />
            </button>
          </div>
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="p-3 bg-user-bubble text-white rounded-lg flex-shrink-0 hover:bg-opacity-80 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
            aria-label="메시지 전송"
          >
            <SendIcon className="w-6 h-6" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageInput;
