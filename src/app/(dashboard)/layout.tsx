import { Toaster } from 'react-hot-toast';
import Sidebar from "@/components/sidebar";
import { AuthProvider } from '@/components/auth/auth-provider';


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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