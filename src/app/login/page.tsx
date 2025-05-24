// src/app/login/page.tsx
import { LoginComponent } from '@/components/auth/login';
import { Suspense } from 'react';

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginComponent />
    </Suspense>
  );
}

export const metadata = {
  title: 'Login - KitchenIntel',
  description: 'Sign in to access your restaurant dashboard',
};