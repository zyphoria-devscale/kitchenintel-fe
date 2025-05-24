'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu, X, Home,
  LogOut, ChevronRight, ChevronLeft,
  BookOpen,
  Utensils,
  CookingPot
} from 'lucide-react';
import { TOKEN_KEY } from '@/lib/token';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle responsive behavior
  useEffect(() => {
    setMounted(true);
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsOpen(window.innerWidth >= 1024);
    };

    // Set initial state
    checkScreenSize();

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Update localStorage and dispatch custom event when sidebar state changes
  useEffect(() => {
    if (!mounted) return; // Skip on first render

    // Store sidebar state in localStorage for other components to access
    localStorage.setItem('sidebarState', isOpen ? 'open' : 'closed');

    // Dispatch custom event for components to listen to
    const event = new CustomEvent('sidebarChange', { detail: { isOpen } });
    window.dispatchEvent(event);
  }, [isOpen, mounted]);

  const handleLogout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    
    // Set loading state
    setIsLoggingOut(true);
    
    // Clear local storage and cookies immediately (don't wait for API)
    const clearSession = () => {
      // Clear localStorage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('loginTime');
      localStorage.removeItem('sidebarState');
      
      // Clear cookie (for server-side authentication)
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=strict';
      
      // Redirect to login
      router.push('/login');
    };

    // If no token, just redirect
    if (!token) {
      clearSession();
      return;
    }

    try {
      // Try to logout on server (but don't block if it fails)
      const response = await fetch("http://127.0.0.1:8000/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) {
        console.warn("Server logout failed, but continuing with client logout");
      }
    } catch (error) {
      // Network error - but still proceed with client logout
      console.warn("Network error during logout, proceeding with client logout:", error);
    } finally {
      // Always clear session and redirect, regardless of server response
      clearSession();
      setIsLoggingOut(false);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/dashboard' },
    { name: 'Menu', icon: BookOpen, path: '/menu' },
    { name: 'Order', icon: Utensils, path: '/order' },
    // { name: 'Analytics', icon: BarChart2, path: '/analytics' },
    // { name: 'Users', icon: Users, path: '/users' },
    // { name: 'Settings', icon: Settings, path: '/settings' },
    // { name: 'Help', icon: HelpCircle, path: '/help' },
  ];

  if (!mounted) {
    // Return a placeholder with matching structure but no content
    // This minimizes layout shift while preventing hydration mismatch
    return (
      <aside className="fixed top-0 left-0 h-full bg-gray-900 w-0">
        <span className="sr-only">Loading navigation</span>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile toggle button - only visible on mobile */}
      {mounted && isMobile && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Overlay for mobile when sidebar is open */}
      {mounted && isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white transition-all duration-300 z-40 
          ${isOpen ? 'w-64' : 'w-20'} 
          ${isMobile && !isOpen ? '-translate-x-full' : 'translate-x-0'}`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {isOpen && (
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CookingPot className="text-purple-400" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  KitchenIntel
                </span>
              </h1>
            )}

            {/* Toggle button - only visible on desktop */}
            {!isMobile && (
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-md text-gray-400 hover:bg-gray-800 hidden lg:block"
              >
                {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-2 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.path}
                      className={`flex items-center p-3 rounded-md hover:bg-gray-800 transition-colors ${
                        isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
                      }`}
                    >
                      <Icon size={20} className={isOpen ? 'mr-3' : 'mx-auto'} />
                      {isOpen && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`flex items-center p-3 rounded-md text-red-400 hover:bg-gray-800 transition-colors w-full disabled:opacity-50 disabled:cursor-not-allowed ${
                isOpen ? '' : 'justify-center'
              }`}
            >
              {isLoggingOut ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isOpen && <span className="ml-3">Logging out...</span>}
                </>
              ) : (
                <>
                  <LogOut size={20} className={isOpen ? 'mr-3' : ''} />
                  {isOpen && <span>Logout</span>}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}