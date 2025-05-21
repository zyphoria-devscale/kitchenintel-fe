"use client";

import { useEffect, ReactNode, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { TOKEN_KEY } from "@/lib/token";

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  
  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthenticated(true);
      return;
    }
    
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      router.push("/login");
      setIsAuthenticated(false);
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (pathname === "/login") {
    return <>{children}</>;
  }
  

  if (isAuthenticated === null) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return isAuthenticated ? <>{children}</> : null;
}
