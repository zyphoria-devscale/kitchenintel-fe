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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  
  // Check if we're on the login page
  const isLoginPage = pathname === '/login';

  // Handle responsive behavior and check authentication
  useEffect(() => {
    setMounted(true);
    
    // Check screen size
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsOpen(window.innerWidth >= 1024);
    };
    
    // Check authentication
    const checkAuth = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(!!token);
    };
    
    // Initial checks
    checkScreenSize();
    checkAuth();
    
    // Set up event listeners
    window.addEventListener('resize', checkScreenSize);
    
    // Listen for auth changes
    window.addEventListener('storage', checkAuth);
    window.addEventListener('auth-change', checkAuth);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('auth-change', checkAuth);
    };
  }, []);
  
  // Check authentication on route change
  useEffect(() => {
    if (mounted) {
      const token = localStorage.getItem(TOKEN_KEY);
      setIsAuthenticated(!!token);
    }
  }, [pathname, mounted]);

  const handleLogout = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/logout/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        }
      });

      if (!response.ok) {
        console.log("Logout failed");
      }
    } catch (error) {
      console.log("Error during logout:", error);
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      
      // Dispatch auth change event
      const event = new Event('auth-change');
      window.dispatchEvent(event);
      
      router.push('/login');
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
    { name: 'Menu', icon: BookOpen, path: '/menu' },
    { name: 'Order', icon: Utensils, path: '/order' },
  ];

  // Don't render anything until mounted
  if (!mounted) {
    return null;
  }
  
  // Don't render the sidebar on login page or if not authenticated
  if (isLoginPage || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Mobile toggle button */}
      {isMobile && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md bg-white shadow-md text-gray-700 hover:bg-gray-100"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
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
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            {isOpen && (
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <CookingPot className="text-purple-400" />
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  KitchenIntel
                </span>
              </h1>
            )}

            {/* Toggle button - desktop only */}
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
              className={`flex items-center p-3 rounded-md text-red-400 hover:bg-gray-800 transition-colors w-full ${
                isOpen ? '' : 'justify-center'
              }`}
            >
              <LogOut size={20} className={isOpen ? 'mr-3' : ''} />
              {isOpen && <span>Logout</span>}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}