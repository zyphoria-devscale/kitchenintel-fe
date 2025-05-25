'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { formatTimestamp } from '@/lib/utils';
import { STORAGE_KEY, INITIAL_MESSAGE_ID, INITIAL_MESSAGE_CONTENT } from '@/components/chatbot/lib/constant';
import { Message } from '@/components/chatbot/lib/type';

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const initialMessageAddedRef = useRef(false);
  
  // Load messages from storage on mount
  useEffect(() => {
    const loadMessages = () => {
      try {
        const storedMessages = localStorage.getItem(STORAGE_KEY);
        if (!storedMessages) return;
        
        const parsedMessages = JSON.parse(storedMessages);
        if (Array.isArray(parsedMessages) && parsedMessages.length > 0) {
          // Check if initial message exists in stored messages
          const hasInitialMessage = parsedMessages.some(
            msg => msg.id === INITIAL_MESSAGE_ID && msg.role === 'system'
          );
          
          if (hasInitialMessage) {
            initialMessageAddedRef.current = true;
          }
          
          setMessages(parsedMessages);
        }
      } catch (e) {
        console.error('Error loading stored messages:', e);
      }
    };
    
    loadMessages();
  }, []);
  
  // Save messages to storage when they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);
  
  // Ensure initial message is always present
  useEffect(() => {
    if (initialMessageAddedRef.current) return;
    
    const hasInitialMessage = messages.some(
      msg => msg.id === INITIAL_MESSAGE_ID && msg.role === 'system'
    );
    
    if (!hasInitialMessage) {
      const initialMessage: Message = { 
        id: INITIAL_MESSAGE_ID, 
        role: 'system', 
        content: INITIAL_MESSAGE_CONTENT, 
        timestamp: formatTimestamp(new Date()) 
      };
      
      setMessages(prev => [initialMessage, ...prev.filter(msg => msg.id !== INITIAL_MESSAGE_ID)]);
      initialMessageAddedRef.current = true;
    }
  }, [messages]);
  
  // Handle received messages from WebSocket
  const handleMessageReceived = useCallback((message: Message | Message[]) => {
    if (Array.isArray(message)) {
      // For history messages, preserve our initial message
      setMessages(prevMessages => {
        const hasInitialMessage = prevMessages.some(
          m => m.id === INITIAL_MESSAGE_ID && m.role === 'system'
        );
        const initialMessage = prevMessages.find(
          m => m.id === INITIAL_MESSAGE_ID && m.role === 'system'
        );
        
        if (hasInitialMessage && initialMessage) {
          // Filter out any initial messages from history to avoid duplicates
          const filteredHistory = message.filter(m => m.id !== INITIAL_MESSAGE_ID);
          return [initialMessage, ...filteredHistory];
        } else {
          return message;
        }
      });
    } else {
      // For single message
      if (message.id === INITIAL_MESSAGE_ID && message.role === 'system') {
        setMessages(prev => {
          if (prev.length > 0 && !prev.some(m => m.id === INITIAL_MESSAGE_ID)) {
            return [message, ...prev];
          } else if (prev.length === 0) {
            return [message];
          }
          return prev;
        });
      } else {
        setMessages(prev => [...prev, message]);
      }
    }
  }, []);
  
  // Add a user message
  const addUserMessage = useCallback((content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: formatTimestamp(new Date())
    };
    
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);
  
  // Reset all messages
  const resetMessages = useCallback(() => {
    setMessages([]);
    initialMessageAddedRef.current = false;
    localStorage.removeItem(STORAGE_KEY);
  }, []);
  
  return {
    messages,
    handleMessageReceived,
    addUserMessage,
    resetMessages
  };
}
