'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '../ChatInterface';
import { formatTimestamp } from '@/lib/utils';


export function useChatWebSocket(sessionId: string, onMessageReceived: (message: Message | Message[]) => void) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Store event handlers in refs to avoid recreating them on each render
  const messageReceivedRef = useRef(onMessageReceived);
  
  // Update the ref when the callback changes
  useEffect(() => {
    messageReceivedRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!sessionId) return;
    
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${sessionId}/`);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
      
      // Send initial greeting with markdown for testing
      const initialMessage: Message = { 
        id: '1', 
        role: 'system', 
        content: '**Hello!** I\'m your *KitchenIntel AI* assistant. How can I help you today?\n\n```\nThis is a code block for testing markdown\n```\n\n- List item 1\n- List item 2', 
        timestamp: formatTimestamp(new Date()) 
      };
      
      messageReceivedRef.current(initialMessage);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.message) {
        if (Array.isArray(data.message)) {
          // Handle history messages
          const historyMessages = data.message.map((msg: any, index: number) => ({
            id: Date.now().toString() + index,
            role: msg.role === 'assistant' ? 'system' : 'user',
            content: msg.content,
            timestamp: formatTimestamp(new Date())
          }));
          messageReceivedRef.current(historyMessages);
        } else {
          // Handle single message
          const newMessage: Message = {
            id: Date.now().toString(),
            role: 'system',
            content: data.message,
            timestamp: formatTimestamp(new Date())
          };
          console.log("new message", newMessage)
          messageReceivedRef.current(newMessage);
        }
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
      setIsConnected(false);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };
    
    setSocket(ws);
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [sessionId]); // Remove onMessageReceived from dependencies

  // Memoize these functions to maintain stable references
  const sendMessage = React.useCallback((message: string) => {
    if (!message.trim() || !socket || socket.readyState !== WebSocket.OPEN) return false;
    socket.send(JSON.stringify({ message }));
    return true;
  }, [socket]);

  const closeConnection = React.useCallback(() => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
  }, [socket]);

  return { socket, isConnected, sendMessage, closeConnection };
}
