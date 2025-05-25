'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send, RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from '@/components/chatbot/ChatMessage';
import { ChatHeader } from '@/components/chatbot/ChatHeader';
import { generateSessionId } from '@/lib/utils';
import { useChatWebSocket } from '@/components/chatbot/hook/useWebsocket';
import { useAutoScroll } from '@/components/chatbot/hook/useAutoScroll';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import { useMessages } from '@/components/chatbot/hook/useMessages';
import { ChatInterfaceProps } from '@/components/chatbot/lib/type';

// Import custom markdown styles
import './markdown-styles.css';

// Main component
export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className = '' }) => {
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Initialize session ID
  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);
  
  // Use custom hooks for message management
  const { messages, handleMessageReceived, addUserMessage, resetMessages } = useMessages();
  
  // Initialize WebSocket connection
  const { isConnected, sendMessage: sendToSocket, closeConnection } = 
    useChatWebSocket(sessionId, (message) => {
      setIsLoading(false);
      handleMessageReceived(message);
    });
  
  // Auto-scroll messages container
  const scrollAreaRef = useAutoScroll([messages]);
  
  // Send message handler
  const handleSendMessage = useCallback(() => {
    if (!inputMessage.trim() || !isConnected) return;
    
    // Add message to UI
    addUserMessage(inputMessage);
    
    // Set loading indicator
    setIsLoading(true);
    
    // Send to server
    sendToSocket(inputMessage);
    
    // Clear input
    setInputMessage('');
  }, [inputMessage, isConnected, sendToSocket, addUserMessage]);

  // Handle key press (Enter to send)
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);
  
  // Reset conversation
  const resetConversation = useCallback(() => {
    closeConnection();
    resetMessages();
    setIsLoading(false);
    setSessionId(generateSessionId());
  }, [closeConnection, resetMessages]);
  
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
                    {/* Add specific styling for system messages */}
                    <div key={message.id} className="text-sm markdown-content">
                      <ReactMarkdown rehypePlugins={[rehypeRaw]}>
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
