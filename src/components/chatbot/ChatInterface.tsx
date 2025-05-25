'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from '@/components/chatbot/ChatMessage';
import { ChatHeader } from '@/components/chatbot/ChatHeader';
import { generateSessionId, formatTimestamp } from '@/lib/utils';
import { useChatWebSocket } from '@/components/chatbot/hook/useWebsocket';
import { useAutoScroll } from '@/components/chatbot/hook/useAutoScroll';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

// Types
interface ChatInterfaceProps {
  className?: string;
}

export interface Message {
  id: string;
  role: 'system' | 'user';
  content: string;
  timestamp: string;
}

// Main component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize session
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);
  
  // Handle received messages - memoize to prevent recreation on each render
  const handleMessageReceived = React.useCallback((message: Message | Message[]) => {
    // Set loading to false when we receive a message
    setIsLoading(false);
    
    if (Array.isArray(message)) {
      setMessages(message);
    } else {
      setMessages(prev => [...prev, message]);
    }
  }, []);
  
  // Initialize WebSocket with custom hook
  const { isConnected, sendMessage: sendToSocket, closeConnection } = 
    useChatWebSocket(sessionId, handleMessageReceived);
  
  // Auto-scroll with custom hook
  const scrollAreaRef = useAutoScroll([messages]);
  
  // Effect untuk logging dan menyimpan pesan ke session storage
  useEffect(() => {
    if (messages.length > 0 && sessionId) {
      console.log('All messages:', messages);
      
      // Simpan pesan ke session storage
      sessionStorage.setItem(`chat_${sessionId}`, JSON.stringify(messages));
    }
  }, [messages, sessionId]);
  
  // Send message handler - memoize to maintain stable reference
  const handleSendMessage = React.useCallback(() => {
    if (!inputMessage.trim() || !isConnected) return;
    
    // Create a new message
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: formatTimestamp(new Date())
    };
    
    // Add to messages state
    setMessages(prev => [...prev, newMessage]);
    
    // Set loading state to true
    setIsLoading(true);
    
    // Send to server
    sendToSocket(inputMessage);
    
    // Clear input
    setInputMessage('');
  }, [inputMessage, isConnected, sendToSocket]);

  // Handle key press (Enter to send)
  const handleKeyPress = React.useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Reset conversation
  const resetConversation = React.useCallback(() => {
    // Close existing connection
    closeConnection();
    
    // Reset state
    setMessages([]);
    setIsLoading(false);
    
    // Generate new session ID
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
    
    // Update localStorage with new session ID
    localStorage.setItem('chatSessionId', newSessionId);
    
    // Clear session storage for old session ID
    if (sessionId) {
      sessionStorage.removeItem(`chat_${sessionId}`);
    }
  }, [closeConnection, sessionId]);
  
  return (
    <div className={`flex flex-col h-[calc(100vh-3rem)] bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden ${className}`}>
      <ChatHeader title="KitchenIntel AI Assistant" />
      
      {/* Messages area with scrolling */}
      <div className="flex-1 relative overflow-hidden">
        <ScrollArea className="h-full w-full" ref={scrollAreaRef}>
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role}
              >
                {message.role === 'system' ? (
                  <>
                    {/* Use key to avoid React rendering issues */}
                    <div key={message.id} className="text-sm markdown-content">
                      {/* Using useEffect for logging to avoid React node issues */}
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  </>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                )}
              </ChatMessage>
            ))}
            {isLoading && (
              <ChatMessage role="system">
                <div className="flex space-x-2">
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </ChatMessage>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Input area */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex items-end gap-2">
          <Textarea
            placeholder="Type your message here..."
            className="min-h-[80px] resize-none flex-1"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyPress}
          />
          <div className="flex flex-col gap-2">
            <Button 
              size="icon" 
              className="rounded-full h-10 w-10"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected}
            >
              <Send className="h-5 w-5" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="rounded-full h-10 w-10"
                  >
                  <RefreshCw className="h-5 w-5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently reset your conversation. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => resetConversation()}>
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Ask me about your restaurant performance, menu suggestions, or customer trends.
        </p>
      </div>
    </div>
  );
};
