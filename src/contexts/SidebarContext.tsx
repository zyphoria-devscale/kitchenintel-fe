'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type SidebarContextType = {
  isOpen: boolean;
  isMobile: boolean;
  toggle: () => void;
};

// Provide default values to prevent undefined context
const defaultContext: SidebarContextType = {
  isOpen: true,
  isMobile: false,
  toggle: () => {}
};

const SidebarContext = createContext<SidebarContextType>(defaultContext);

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Check initial state from localStorage
    const storedState = localStorage.getItem('sidebarState');
    if (storedState) {
      setIsOpen(storedState === 'open');
    }
    
    // Check if mobile
    setIsMobile(window.innerWidth < 1024);

    // Set up event listeners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sidebarState') {
        setIsOpen(e.newValue === 'open');
      }
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const handleSidebarChange = (e: CustomEvent) => {
      setIsOpen((e as any).detail.isOpen);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('resize', handleResize);
    window.addEventListener('sidebarChange', handleSidebarChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('sidebarChange', handleSidebarChange as EventListener);
    };
  }, []);

  const toggle = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    localStorage.setItem('sidebarState', newState ? 'open' : 'closed');
    
    // Dispatch custom event for other components
    window.dispatchEvent(
      new CustomEvent('sidebarChange', { detail: { isOpen: newState } })
    );
  };

  // Always render the provider with current values
  // This ensures consistent structure between server and client
  return (
    <SidebarContext.Provider value={{ 
      // Use default values before mounting to ensure consistency with SSR
      isOpen: mounted ? isOpen : defaultContext.isOpen,
      isMobile: mounted ? isMobile : defaultContext.isMobile,
      toggle
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  return context;
};
