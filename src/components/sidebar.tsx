'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu, X, Home,
  LogOut, ChevronRight, ChevronLeft,
  BookOpen,
  Utensils,
  CookingPot
} from 'lucide-react';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

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


  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const navItems = [
    { name: 'Dashboard', icon: Home, path: '/' },
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
                      className={`flex items-center p-3 rounded-md hover:bg-gray-800 transition-colors ${isActive ? 'bg-blue-600 hover:bg-blue-700' : ''
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
              className={`flex items-center p-3 rounded-md text-red-400 hover:bg-gray-800 transition-colors w-full ${isOpen ? '' : 'justify-center'
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