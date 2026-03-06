import React from 'react';
import type { ChatMessage as Message } from '@/lib/types';
import { UserIcon, BotIcon } from './icons';
import RecommendationCard from './RecommendationCard';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  const contentToRender = message.recommendation ? (
    <RecommendationCard recommendation={message.recommendation} />
  ) : (
    <div className={`p-4 rounded-2xl text-[15px] leading-relaxed break-words shadow-sm ${isUser
        ? 'bg-[#FF6B00] text-white rounded-tr-sm'
        : 'bg-[#F2F4F6] dark:bg-[#2C2C2C] text-[#191F28] dark:text-white rounded-tl-sm'
      }`}>
      {message.content}
    </div>
  );

  return (
    <div className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="flex-none w-10 h-10 rounded-full bg-[#F2F4F6] dark:bg-[#2C2C2C] flex items-center justify-center border border-[#E5E8EB] dark:border-[#3F3F3F]">
          <span className="material-symbols-outlined text-[#8B95A1] dark:text-[#A0A0A0] text-xl">smart_toy</span>
        </div>
      )}
      <div className={`flex flex-col gap-1 ${isUser ? 'items-end' : ''}`}>
        {!isUser && (
          <span className="text-xs font-medium text-[#8B95A1] dark:text-[#A0A0A0] ml-1">AI 큐레이터</span>
        )}
        {contentToRender}
      </div>
    </div>
  );
};

export default ChatMessage;
