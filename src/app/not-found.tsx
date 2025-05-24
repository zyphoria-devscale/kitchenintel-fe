'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { TOKEN_KEY } from '@/lib/token';

export default function NotFound() {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in by checking for token
        const checkAuthStatus = () => {
            try {
                const token = localStorage.getItem(TOKEN_KEY);
                setIsLoggedIn(!!token);
            } catch (error) {
                console.error('Error checking auth status:', error);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuthStatus();
    }, []);

    // Show loading state while checking auth
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 text-center">
                {/* 404 Icon */}
                <div>
                    <div className="text-9xl font-bold text-gray-300 mb-4">404</div>
                    <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                        Page Not Found
                    </h2>
                    <p className="text-gray-600 mb-8">
                        Sorry, we couldn't find the page you're looking for.
                    </p>
                </div>

                {/* Navigation Links */}
                <div className="space-y-4">
                    {isLoggedIn ? (
                        <>
                            <Link
                                href="/dashboard"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Back to Dashboard
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/login"
                                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                            >
                                Back to Login
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}