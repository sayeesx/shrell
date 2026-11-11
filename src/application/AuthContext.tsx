import React, { createContext, useContext, useEffect, useState } from 'react';
import { account, isAppwriteConfigured } from '../infrastructure/appwrite/client';
import { supabase, isSupabaseConfigured } from '../infrastructure/supabase/client';
import { identifyUser, resetUser } from '../infrastructure/analytics/posthog';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: UserSession | null;
  isAdmin: boolean;
  loginAsCustomer: (name: string, email: string, phone: string) => Promise<void>;
  loginWithPhone: (phone: string, name?: string) => Promise<void>;
  loginAsAdmin: (password: string) => Promise<boolean>;
  signUp: (email: string, password: string, metadata?: { name?: string; phone?: string; role?: 'customer' | 'admin' }) => Promise<any>;
  signInWithPassword: (email: string, password: string) => Promise<any>;
  signInWithOtp: (params: { email?: string; phone?: string }) => Promise<any>;
  logout: () => void;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}

const AUTH_STORAGE_KEY = 'shrell_user_session_v1';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed) {
        identifyUser(parsed.id, { name: parsed.name, email: parsed.email, phone: parsed.phone, role: parsed.role });
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Supabase Auth Integration
    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!isMounted) return;
        if (session?.user) {
          const sbUser = session.user;
          const role = (sbUser.user_metadata?.role as 'customer' | 'admin') || 'customer';
          const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Valued Customer';
          const sessionData: UserSession = {
            id: sbUser.id,
            name,
            email: sbUser.email || '',
            phone: sbUser.phone || '',
            role,
          };
          setUser(sessionData);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        }
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });

      const { data: authSubscription } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const sbUser = session.user;
          const role = (sbUser.user_metadata?.role as 'customer' | 'admin') || 'customer';
          const name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || 'Valued Customer';
          const sessionData: UserSession = {
            id: sbUser.id,
            name,
            email: sbUser.email || '',
            phone: sbUser.phone || '',
            role,
          };
          setUser(sessionData);
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionData));
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      });

      return () => {
        isMounted = false;
        authSubscription?.subscription?.unsubscribe();
      };
    }

    // 2. Legacy Appwrite Auth Fallback
    if (isAppwriteConfigured) {
      account.get()
        .then((appwriteUser) => {
          if (!isMounted) return;
          setUser({
            id: appwriteUser.$id,
            name: appwriteUser.name,
            email: appwriteUser.email,
            role: appwriteUser.labels?.includes('admin') ? 'admin' : 'customer',
          });
          setIsLoading(false);
        })
        .catch(() => {
          if (isMounted) setIsLoading(false);
        });
      return () => {
        isMounted = false;
      };
    }

    setIsLoading(false);
    return () => {
      isMounted = false;
    };
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const loginWithPhone = async (phone: string, name = 'Valued Customer') => {
    const cleanPhone = phone.trim();

    if (isSupabaseConfigured) {
      try {
        const formatted = cleanPhone.startsWith('+') ? cleanPhone : `+91${cleanPhone.replace(/\D/g, '')}`;
        await supabase.auth.signInWithOtp({ phone: formatted });
      } catch (err) {
        // Fallback for dev environments where SMS gateway may not be configured yet
        console.warn('Supabase phone OTP notification:', err);
      }
    }

    const session: UserSession = {
      id: `cust-${cleanPhone.replace(/\D/g, '') || Date.now()}`,
      name,
      email: '',
      phone: cleanPhone,
      role: 'customer',
    };
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    identifyUser(session.id, { name: session.name, phone: session.phone, role: session.role });
  };

  const loginAsCustomer = async (name: string, email: string, phone: string) => {
    const cleanEmail = email ? email.trim() : '';
    const cleanPhone = phone ? phone.trim() : '';

    if (isSupabaseConfigured && cleanEmail) {
      try {
        await supabase.auth.signInWithOtp({ email: cleanEmail });
      } catch (err) {
        console.warn('Supabase email OTP notification:', err);
      }
    }

    const session: UserSession = {
      id: `cust-${Date.now()}`,
      name: name.trim() || 'Valued Customer',
      email: cleanEmail,
      phone: cleanPhone,
      role: 'customer',
    };
    setUser(session);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    identifyUser(session.id, { name: session.name, phone: session.phone, role: session.role });
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

  const signUp = async (
    email: string,
    pass: string,
    metadata?: { name?: string; phone?: string; role?: 'customer' | 'admin' }
  ) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: metadata,
      },
    });
    if (error) throw error;
    return data;
  };

  const signInWithPassword = async (email: string, pass: string) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    return data;
  };

  const signInWithOtp = async (params: { email?: string; phone?: string }) => {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured.');
    }
    const { data, error } = await supabase.auth.signInWithOtp(params as any);
    if (error) throw error;
    return data;
  };

  const logout = () => {
    resetUser();
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    if (isSupabaseConfigured) {
      supabase.auth.signOut().catch(() => {});
    }
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
        loginWithPhone,
        loginAsAdmin,
        signUp,
        signInWithPassword,
        signInWithOtp,
        logout,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
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
