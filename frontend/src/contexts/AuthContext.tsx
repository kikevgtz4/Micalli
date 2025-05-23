"use client";
import { useState, useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";

// Update the User type to match the API types (camelCase)
type User = {
  id: number;
  username: string;
  email: string;
  userType: "student" | "property_owner" | "admin";
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
};

// Define proper error type
interface ApiError {
  response?: {
    data?: {
      detail?: string;
      message?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
}

// Define registration data type
interface RegistrationData {
  email: string;
  username: string;
  password: string;
  user_type: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (usernameOrEmail: string, password: string) => Promise<void>;
  register: (userData: RegistrationData) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: Record<string, unknown>) => Promise<void>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check for existing auth on component mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("=== AUTH CHECK STARTED ===");
      try {
        setIsLoading(true);
        
        const token = localStorage.getItem("accessToken");
        console.log("1. Token from localStorage:", !!token);
        
        if (!token) {
          console.log("2. No token found, setting unauthenticated");
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log("3. Token found, fetching profile...");
        
        const response = await apiService.auth.getProfile();
        console.log("4. Profile response (after case conversion):", response);
        console.log("5. User data:", response.data);
        
        setUser(response.data);
        setIsAuthenticated(true);
        
        console.log("6. Auth state updated:", {
          user: response.data,
          isAuthenticated: true,
          userType: response.data.userType
        });
        
      } catch (error) {
        console.error("=== AUTH CHECK FAILED ===");
        console.error("Auth check failed:", error);
        
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log("7. Setting loading to false");
        setIsLoading(false);
        console.log("=== AUTH CHECK COMPLETED ===");
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (usernameOrEmail: string, password: string) => {
    console.log("=== LOGIN PROCESS STARTED ===");
    console.log("Username/Email:", usernameOrEmail);
    
    setIsLoading(true);
    try {
      console.log("1. Making login API call...");
      
      const response = await apiService.auth.login({
        username: usernameOrEmail,
        password: password,
      });
      
      console.log("2. Login API response:", response);
      
      const { access, refresh } = response.data;
      console.log("3. Tokens received:", { access: !!access, refresh: !!refresh });

      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      console.log("4. Tokens stored in localStorage");

      console.log("5. Fetching user profile...");
      
      const profileResponse = await apiService.auth.getProfile();
      console.log("6. Profile API response:", profileResponse);
      console.log("7. User data (camelCase):", profileResponse.data);
      
      console.log("8. Setting user state...");
      setUser(profileResponse.data);
      console.log("9. Setting authenticated state...");
      setIsAuthenticated(true);
      
      console.log("10. Current state should be:", {
        user: profileResponse.data,
        isAuthenticated: true,
        userType: profileResponse.data.userType
      });

      console.log("11. Determining redirect...");
      if (profileResponse.data.userType === "property_owner") {
        console.log("12. Redirecting to dashboard...");
        router.push("/dashboard");
      } else {
        console.log("12. Redirecting to properties...");
        router.push("/properties");
      }
      
      console.log("=== LOGIN PROCESS COMPLETED ===");
    } catch (error) {
      console.error("=== LOGIN PROCESS FAILED ===");
      console.error("Login failed:", error);
      console.error("Error response:", (error as ApiError).response);
      throw new Error(
        (error as ApiError).response?.data?.detail ||
          "Login failed. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegistrationData) => {
    setIsLoading(true);
    try {
      console.log("Sending registration data:", userData);
      await apiService.auth.register(userData);
      router.push("/login?registered=true");
    } catch (error) {
      console.error("Registration error details:", (error as ApiError).response?.data);
      throw new Error(
        (error as ApiError).response?.data?.detail || "Registration failed. Please try again."
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
  const updateProfile = async (profileData: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const response = await apiService.auth.updateProfile(profileData);
      setUser(response.data);
    } catch (error) {
      console.error("Profile update failed:", error);
      throw new Error(
        (error as ApiError).response?.data?.detail ||
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
export function withAuth(Component: React.ComponentType<Record<string, unknown>>) {
  return function ProtectedRoute(props: Record<string, unknown>) {
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
      return null;
    }

    return <Component {...props} />;
  };
}