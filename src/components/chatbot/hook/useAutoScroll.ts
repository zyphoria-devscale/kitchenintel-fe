'use client';

import { useEffect, useRef } from 'react';

export function useAutoScroll(dependencies: any[]) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // Add a small delay to ensure the DOM has updated
    const timer = setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollElement) {
          // Force scroll to bottom
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }
      }
    }, 100); // Small delay to ensure DOM updates are complete
    
    return () => clearTimeout(timer);
  }, dependencies);
  
  return scrollAreaRef;
}