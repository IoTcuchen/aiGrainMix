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
    <p className="text-sm md:text-base whitespace-pre-wrap">{message.content}</p>
  );

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-bot-bubble rounded-full flex items-center justify-center">
          <BotIcon className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`prose prose-invert max-w-full p-3 rounded-lg ${isUser ? 'bg-user-bubble text-white' : 'bg-bot-bubble text-brand-text'}`}>
        {contentToRender}
      </div>
      {isUser && (
        <div className="w-8 h-8 flex-shrink-0 bg-gray-600 rounded-full flex items-center justify-center">
          <UserIcon className="w-5 h-5 text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
