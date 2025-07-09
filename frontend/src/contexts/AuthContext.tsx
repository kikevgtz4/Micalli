"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { User } from "@/types/api";

// Define the auth context type
type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
  refreshUser: () => Promise<void>;
  handleEmailVerificationSuccess: () => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Refresh user data from API
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiService.auth.getProfile();
      setUser(response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      throw error;
    }
  }, []);

  // Check for existing auth on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Check for access token
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setIsAuthenticated(false);
          setUser(null);
          return;
        }

        // Fetch user profile
        const userData = await refreshUser();
        setIsAuthenticated(true);
        
        // Check if student needs university setup
        if (userData.userType === 'student' && !userData.university) {
          // Only redirect if we're not already on the university setup page
          if (!window.location.pathname.includes('/onboarding/university')) {
            router.push('/onboarding/university');
          }
        }
      } catch (error) {
        // Token might be invalid, clear auth
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("roommate_onboarding_skipped");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [refreshUser, router]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Get auth tokens
      const response = await apiService.auth.login({
        email: email,
        password: password,
      });
      
      const { access, refresh } = response.data;

      // Store tokens
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      // Get user profile
      const userData = await refreshUser();
      setIsAuthenticated(true);

      // Redirect based on user type and university status
      if (userData.userType === 'student' && !userData.university) {
        router.push('/onboarding/university');
      } else if (userData.userType === 'property_owner') {
        router.push('/dashboard');
      } else {
        router.push('/properties');
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.detail ||
        error.response?.data?.nonFieldErrors?.[0] ||
        "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  }, [refreshUser, router]);

  // Register function
  const register = useCallback(async (userData: any) => {
    setIsLoading(true);
    try {
      await apiService.auth.register(userData);
      router.push("/login?registered=true&verify=true");
    } catch (error: any) {
      console.error("Registration failed:", error);
      
      // Handle specific field errors
      if (error.response?.data) {
        const errorData = error.response.data;
        // Check for field-specific errors
        const fieldErrors = Object.keys(errorData)
          .filter(key => key !== 'detail')
          .map(key => `${key}: ${errorData[key]}`)
          .join(', ');
        
        if (fieldErrors) {
          throw new Error(fieldErrors);
        }
      }
      
      throw new Error(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  // Logout function
  const logout = useCallback(() => {
    // Clear all auth-related data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("roommate_onboarding_skipped");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [router]);

  // Update profile function
  const updateProfile = useCallback(async (profileData: any) => {
    try {
      // Update profile if data provided
      if (profileData && Object.keys(profileData).length > 0) {
        await apiService.auth.updateProfile(profileData);
      }
      
      // Fetch fresh user data
      await refreshUser();
    } catch (error: any) {
      console.error("Profile update failed:", error);
      throw new Error(
        error.response?.data?.detail ||
        "Profile update failed. Please try again."
      );
    }
  }, [refreshUser]);

  // Handle email verification success
  const handleEmailVerificationSuccess = useCallback(async () => {
    try {
      // Fetch fresh user data
      const userData = await refreshUser();
      setIsAuthenticated(true);
      
      // Redirect based on user type and university status
      if (userData.userType === 'student' && !userData.university) {
        router.push('/onboarding/university');
      } else if (userData.userType === 'property_owner') {
        router.push('/dashboard');
      } else {
        router.push('/properties');
      }
    } catch (error) {
      console.error("Error handling email verification:", error);
      router.push('/login');
    }
  }, [refreshUser, router]);

  const contextValue: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    handleEmailVerificationSuccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Higher-order component for protected routes
export function withAuth(Component: React.ComponentType<any>) {
  return function ProtectedRoute(props: any) {
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        // Redirect to login with return URL
        const currentPath = window.location.pathname;
        router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
      } else if (!isLoading && isAuthenticated && user?.userType === 'student' && !user?.university) {
        // If authenticated student without university, redirect to university setup
        const currentPath = window.location.pathname;
        if (!currentPath.includes('/onboarding/university')) {
          router.push('/onboarding/university');
        }
      }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Don't render anything while redirecting
    }

    return <Component {...props} />;
  };
}

// Optional: Role-based auth HOC
export function withRole(allowedRoles: User['userType'][]) {
  return function RoleProtectedComponent(Component: React.ComponentType<any>) {
    return function RoleCheck(props: any) {
      const { user, isLoading } = useAuth();
      const router = useRouter();

      useEffect(() => {
        if (!isLoading && user && !allowedRoles.includes(user.userType)) {
          // Redirect to appropriate page based on user type
          if (user.userType === 'property_owner') {
            router.push('/dashboard');
          } else {
            router.push('/properties');
          }
        }
      }, [user, isLoading, router]);

      if (isLoading) {
        return (
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        );
      }

      if (!user || !allowedRoles.includes(user.userType)) {
        return null;
      }

      return <Component {...props} />;
    };
  };
}