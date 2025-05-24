// src/app/login/page.tsx
'use client';

import { LoginComponent } from '@/components/auth/login';
import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_KEY } from '@/lib/token';

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  
  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginComponent />
    </Suspense>
  );
}