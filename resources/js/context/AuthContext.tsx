import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, User } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, remember?: boolean) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  register: (name: string, email: string, password: string, passwordConfirmation: string) => Promise<{ success: boolean; message?: string; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.getMe();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        api.setToken(null);
        setUser(null);
      }
    } catch {
      api.setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, remember = false) => {
    setIsLoading(true);
    const response = await api.login({ email, password, remember });
    
    if (response.success && response.data) {
      api.setToken(response.data.token);
      setUser(response.data.user);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { 
      success: false, 
      message: response.message, 
      errors: response.errors 
    };
  };

  const register = async (name: string, email: string, password: string, passwordConfirmation: string) => {
    setIsLoading(true);
    const response = await api.register({ name, email, password, password_confirmation: passwordConfirmation });
    
    if (response.success && response.data) {
      api.setToken(response.data.token);
      setUser(response.data.user);
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { 
      success: false, 
      message: response.message, 
      errors: response.errors 
    };
  };

  const logout = async () => {
    await api.logout();
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}