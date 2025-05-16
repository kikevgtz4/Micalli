"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

// Define types for auth context
type User = {
  id: number;
  username: string;
  email: string;
  user_type: "student" | "property_owner" | "admin";
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Initial state based on synchronous localStorage check
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(hasToken);
  const router = useRouter();

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
          setIsLoading(false);
          return;
        }

        // Fetch user profile
        const response = await apiService.auth.getProfile();
        setUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error("Auth check failed:", error);
        // Token might be invalid, clear auth
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (hasToken) {
      checkAuth();
    } else {
      setIsLoading(false);
    }
  }, [hasToken]);

  // Login function
  const login = async (usernameOrEmail: string, password: string) => {
    setIsLoading(true);
    try {
      // Get auth tokens - pass username parameter, not email
      const response = await apiService.auth.login({
        username: usernameOrEmail, // This is what the backend expects
        password: password,
      });
      const { access, refresh } = response.data;

      // Store tokens
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);

      // Get user profile
      const profileResponse = await apiService.auth.getProfile();
      setUser(profileResponse.data);
      setIsAuthenticated(true);

      // Redirect based on user type
      if (profileResponse.data.user_type === "property_owner") {
        router.push("/dashboard");
      } else {
        router.push("/properties");
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      throw new Error(
        error.response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: any) => {
    setIsLoading(true);
    try {
      console.log("Sending registration data:", userData);
      await apiService.auth.register(userData);
      router.push("/login?registered=true");
    } catch (error: any) {
      console.error("Registration error details:", error.response?.data);
      throw new Error(
        error.response?.data?.detail || "Registration failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  // Update profile function
  const updateProfile = async (profileData: any) => {
    setIsLoading(true);
    try {
      const response = await apiService.auth.updateProfile(profileData);
      setUser(response.data);
    } catch (error: any) {
      console.error("Profile update failed:", error);
      throw new Error(
        error.response?.data?.detail ||
          "Profile update failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
      }}
    >
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
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(
          "/login?redirect=" + encodeURIComponent(window.location.pathname)
        );
      }
    }, [isAuthenticated, isLoading, router]);

    if (isLoading) {
      return (
        <div className="flex justify-center items-center min-h-screen">
          Loading...
        </div>
      );
    }

    if (!isAuthenticated) {
      return null; // Don't render anything while redirecting
    }

    return <Component {...props} />;
  };
}