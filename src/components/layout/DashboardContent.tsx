'use client';

import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

interface DashboardContentProps {
  children: React.ReactNode;
  className?: string;
}

export const DashboardContent: React.FC<DashboardContentProps> = ({ 
  children, 
  className = '' 
}) => {
  const { isOpen, isMobile } = useSidebar();

  return (
    <main 
      className={`transition-all duration-300 
        ${isOpen ? 'lg:ml-64' : 'lg:ml-20'} 
        ${isMobile ? 'ml-0' : ''} 
        ${className}`}
    >
      {children}
    </main>
  );
};
