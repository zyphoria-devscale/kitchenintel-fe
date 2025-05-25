'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Message } from '@/components/chatbot/lib/type';
import { formatTimestamp } from '@/lib/utils';
import { WEBSOCKET_URL } from '@/lib/api_base_url';

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
    
    const ws = new WebSocket(`wss://${WEBSOCKET_URL}/ws/chat/${sessionId}/`);
    
    ws.onopen = () => {
      console.log('WebSocket connection established');
      setIsConnected(true);
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
