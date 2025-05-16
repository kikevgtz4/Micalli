'use client';
import { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';

// Properly typed interfaces
type User = {
  id: number;
  username: string;
  email: string;
  user_type: 'student' | 'property_owner' | 'admin';
  // Add other user fields as needed
};

type LoginCredentials = {
  username: string;
  password: string;
};

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// Create context with more appropriate default values
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => { throw new Error('AuthContext not initialized') },
  logout: () => { throw new Error('AuthContext not initialized') },
  loading: true
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiService.auth.getProfile();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
        logout(); // Token might be invalid
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (usernameOrEmail: string, password: string): Promise<void> => {
    setLoading(true);
    try {
      // Make the API call with an object that matches what the API expects
      const response = await apiService.auth.login({ 
        username: usernameOrEmail, 
        password 
      });
      
      const { access, refresh } = response.data;
      
      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      
      // Get user profile
      const profileResponse = await apiService.auth.getProfile();
      setUser(profileResponse.data);
      setIsAuthenticated(true);
      
      // Redirect based on user type
      if (profileResponse.data.user_type === 'property_owner') {
        router.push('/dashboard');
      } else {
        router.push('/properties');
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      throw new Error(error.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      login, 
      logout, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);