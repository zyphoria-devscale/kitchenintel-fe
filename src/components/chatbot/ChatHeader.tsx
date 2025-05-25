'use client';

import React from 'react';
import { Bot, Info, Settings } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ChatHeaderProps {
  title: string;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title }) => {
  return (
    <div className="border-b border-gray-200 p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="bg-purple-100 rounded-full p-2">
          <Bot className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Info className="h-5 w-5 text-gray-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ask me about your restaurant data and insights</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {/* <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5 text-gray-500" />
        </Button> */}
      </div>
    </div>
  );
};
