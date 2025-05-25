'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'system' | 'user';
  children: React.ReactNode;
  timestamp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  children,
  timestamp,
}) => {
  const isUser = role === 'user';
  
  return (
    <div className={ cn(
      "flex items-start gap-3 w-[80%]",
      isUser ? "justify-end ml-auto" : "justify-start mr-auto"
    )}>
      {/* Avatar */}
      <div className={cn(
        "flex-shrink-0 rounded-full w-8 h-8 flex items-center justify-center",
        isUser ? "order-last bg-blue-100" : "bg-purple-100"
      )}>
        {isUser ? (
          <User className="h-4 w-4 text-blue-600" />
        ) : (
          <Bot className="h-4 w-4 text-purple-600" />
        )}
      </div>
      
      {/* Message bubble */}
      <div className={cn(
        "rounded-lg py-2 px-3",
        isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-800"
      )}>
       {children}
      </div>
    </div>
  );
};
