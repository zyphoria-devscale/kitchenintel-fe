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
        <div className="w-full md:w-80 space-y-6">
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
          
          {/* <Card>
            <CardHeader>
              <CardTitle>Recent Insights</CardTitle>
              <CardDescription>Based on your restaurant data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-700 text-sm">Sales Trend</h4>
                  <p className="text-xs text-gray-600 mt-1">Your weekend sales have increased by 15% compared to last month.</p>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-700 text-sm">Popular Item</h4>
                  <p className="text-xs text-gray-600 mt-1">"Chicken Parmesan" has been your best-selling item this week.</p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </DashboardContent>
  );
}
