'use client';

import React from 'react';
import { DashboardContent } from '@/components/layout/DashboardContent';
import { ChatInterface } from '@/components/chatbot/ChatInterface';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ChatbotPage() {
  return (
    <DashboardContent className="p-6 max-w-full mx-auto">
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-3rem)]">
        {/* Main chat interface */}
        <div className="flex-1">
          <ChatInterface />
        </div>
        
        {/* Sidebar with information */}
        <div className="hidden md:block md:w-72 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About KitchenIntel AI</CardTitle>
              <CardDescription>Your restaurant management assistant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                This AI assistant can help you analyze your restaurant data, provide insights, and answer questions about your business performance.
              </p>
              <h4 className="font-medium mb-2">You can ask about:</h4>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                <li>Sales performance and trends</li>
                <li>Menu item popularity</li>
                <li>Customer preferences</li>
                <li>Inventory management</li>
                <li>Staff scheduling recommendations</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardContent>
  );
}
