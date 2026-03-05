import React, { useRef, useEffect } from 'react';
import type { ChatMessage as Message } from '@/lib/types';
import ChatMessage from '@/components/ChatMessage';

interface ChatWindowProps {
  messages: Message[];
}

function ChatWindowComponent({ messages }: ChatWindowProps) {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto">
      <div className="max-w-4xl mx-auto space-y-4">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={endOfMessagesRef} />
      </div>
    </div>
  );
}

const ChatWindow = React.memo(ChatWindowComponent);

export default ChatWindow;
