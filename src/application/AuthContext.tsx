import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, isAppwriteConfigured } from '../infrastructure/appwrite/client';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: UserSession | null;
  isAdmin: boolean;
  loginAsCustomer: (name: string, email: string, phone: string) => Promise<void>;
  loginAsAdmin: (password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AUTH_STORAGE_KEY = 'shrell_user_session_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function checkSession() {
      if (isAppwriteConfigured) {
        try {
          const appwriteUser = await account.get();
          setUser({
            id: appwriteUser.$id,
            name: appwriteUser.name,
            email: appwriteUser.email,
            role: appwriteUser.labels?.includes('admin') ? 'admin' : 'customer',
          });
        } catch {
          // No active Appwrite session
        }
      }
      setIsLoading(false);
    }
    checkSession();
  }, []);

  const loginAsCustomer = async (name: string, email: string, phone: string) => {
    const session: UserSession = {
      id: `cust-${Date.now()}`,
      name,
      email: email || `${phone}@guest.shrell.com`,
      role: 'customer',
    };
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  };

  const loginAsAdmin = async (password: string): Promise<boolean> => {
    if (password === 'shrelladmin2026' || password === 'vahnadmin2026') {
      const adminSession: UserSession = {
        id: 'admin-master',
        name: 'SHRELL Operations Director',
        email: 'admin@shrell.com',
        role: 'admin',
      };
      setUser(adminSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(adminSession));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (isAppwriteConfigured) {
      account.deleteSession('current').catch(() => {});
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: user?.role === 'admin',
        loginAsCustomer,
        loginAsAdmin,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
