'use client';

import React from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from '@/components/chatbot/ChatMessage';
import { ChatHeader } from '@/components/chatbot/ChatHeader';

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className = '' 
}) => {
  // This is just the UI structure without functionality
  
  // Sample messages for layout demonstration
  const sampleMessages = [
    { id: '1', role: 'system', content: 'Hello! I\'m your KitchenIntel AI assistant. How can I help you today?', timestamp: '10:29 AM' },
    { id: '2', role: 'user', content: 'Can you help me understand my restaurant\'s performance?', timestamp: '10:30 AM' },
    { id: '3', role: 'system', content: 'Of course! I can analyze your sales data, customer trends, and menu performance. What specific aspect would you like to know about?', timestamp: '10:31 AM' },
  ];

  return (
    <div className={`flex flex-col h-[calc(100vh-3rem)] bg-white rounded-lg shadow-md border border-gray-200 ${className}`}>
      <ChatHeader title="KitchenIntel AI Assistant" />
      
      {/* Messages area with scrolling */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {sampleMessages.map((message) => (
            <ChatMessage
              key={message.id}
              role={message.role as 'system' | 'user'}
              content={message.content}
              timestamp={message.timestamp}
            />
          ))}
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-[80px] resize-none flex-1"
          />
          <div className="flex flex-col gap-2">
            <Button size="icon" className="rounded-full h-10 w-10">
              <Send className="h-5 w-5" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <RefreshCw className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask me about your restaurant performance, menu suggestions, or customer trends.
        </p>
      </div>
    </div>
  );
};
