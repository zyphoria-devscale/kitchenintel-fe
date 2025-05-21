"use client";

import { ReactNode } from "react";
import { AuthProvider } from "../auth/auth-provider";
import { Toaster } from 'react-hot-toast';
import Sidebar from "@/components/sidebar";

interface ClientLayoutProps {
  children: ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <AuthProvider>
      <main>
        <Sidebar />
        {children}
      </main>
      <Toaster />
    </AuthProvider>
  );
}
