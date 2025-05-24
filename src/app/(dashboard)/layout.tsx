import { Toaster } from 'react-hot-toast';
import Sidebar from "@/components/sidebar";
import { AuthProvider } from '@/components/auth/auth-provider';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
        <AuthProvider>
          <SidebarProvider>
          <main>
            <Sidebar />
            {children}
          </main>
          <Toaster />
          </SidebarProvider>
        </AuthProvider>
  );
}