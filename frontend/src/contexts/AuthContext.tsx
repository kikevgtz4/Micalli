"use client";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import { User } from "@/types/api";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateProfile: (profileData: any) => Promise<void>;
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

  // Check for existing auth on component mount
  useEffect(() => {
    const checkAuth = async () => {
      console.log("=== AUTH CHECK STARTED ===");
      try {
        setIsLoading(true);
        
        // Check for access token
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
        
        // Fetch user profile
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
        
        // Check if student needs university setup on page refresh
        if (response.data.userType === 'student' && !response.data.university) {
          // Only redirect if we're not already on the university setup page
          if (!window.location.pathname.includes('/onboarding/university')) {
            console.log("7. Student needs university setup, redirecting...");
            router.push('/onboarding/university');
          }
        }
        
      } catch (error) {
        console.error("=== AUTH CHECK FAILED ===");
        console.error("Auth check failed:", error);
        
        // Token might be invalid, clear auth
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("roommate_onboarding_skipped"); // Reset skip status
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        console.log("8. Setting loading to false");
        setIsLoading(false);
        console.log("=== AUTH CHECK COMPLETED ===");
      }
    };

    checkAuth();
  }, [router]);

  // Login function
  const login = async (email: string, password: string) => {
    console.log("=== LOGIN PROCESS STARTED ===");
    console.log("Username/Email:", email);
    
    setIsLoading(true);
    try {
      console.log("1. Making login API call...");
      
      // Get auth tokens
      const response = await apiService.auth.login({
        email: email,
        password: password,
      });
      
      console.log("2. Login API response:", response);
      
      const { access, refresh } = response.data;
      console.log("3. Tokens received:", { access: !!access, refresh: !!refresh });

      // Store tokens
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      console.log("4. Tokens stored in localStorage");

      console.log("5. Fetching user profile...");
      
      // Get user profile
      const profileResponse = await apiService.auth.getProfile();
      console.log("6. Profile API response:", profileResponse);
      console.log("7. User data (camelCase):", profileResponse.data);
      
      // Set user data and authentication status
      console.log("8. Setting user state...");
      setUser(profileResponse.data);
      console.log("9. Setting authenticated state...");
      setIsAuthenticated(true);
      
      console.log("10. Current state should be:", {
        user: profileResponse.data,
        isAuthenticated: true,
        userType: profileResponse.data.userType
      });

      // Redirect based on user type and university status
      console.log("11. Determining redirect...");
      if (profileResponse.data.userType === 'student' && !profileResponse.data.university) {
        console.log("12. Student needs university setup, redirecting to onboarding...");
        router.push('/onboarding/university');
      } else if (profileResponse.data.userType === 'property_owner') {
        console.log("12. Property owner, redirecting to dashboard...");
        router.push('/dashboard');
      } else {
        console.log("12. Student with university, redirecting to properties...");
        router.push('/properties');
      }
      
      console.log("=== LOGIN PROCESS COMPLETED ===");
    } catch (error: any) {
      console.error("=== LOGIN PROCESS FAILED ===");
      console.error("Login failed:", error);
      console.error("Error response:", error.response);
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
      router.push("/login?registered=true&verify=true");
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
    console.log('=== UPDATEPROFILE CALLED ===');
    console.log('1. Current user before update:', user);
    console.log('2. Profile data received:', profileData);
    
    try {
      // First, update the profile with the new data
      if (profileData && Object.keys(profileData).length > 0) {
        console.log('3. Updating profile with data:', profileData);
        await apiService.auth.updateProfile(profileData);
      }
      
      // Then fetch the updated user profile from the API
      console.log('4. Fetching fresh profile from API...');
      const response = await apiService.auth.getProfile();
      console.log('5. Fresh profile response:', response);
      console.log('6. Fresh profile data:', response.data);
      
      // Update the user state
      console.log('7. Updating user state...');
      setUser(response.data);
      
      console.log('8. User state should now be updated');
      console.log('9. New user object:', response.data);
      console.log('10. University info:', response.data.university);
      
    } catch (error) {
      console.error('=== UPDATEPROFILE FAILED ===');
      console.error('Failed to update user profile:', error);
      throw error; // Re-throw so the calling component can handle it
    }
  };

  // Handle email verification success
  const handleEmailVerificationSuccess = async () => {
    console.log("=== EMAIL VERIFICATION SUCCESS ===");
    
    try {
      // Fetch fresh user data
      const response = await apiService.auth.getProfile();
      setUser(response.data);
      setIsAuthenticated(true);
      
      // Redirect based on user type and university status
      if (response.data.userType === 'student' && !response.data.university) {
        console.log("Student needs university setup after email verification");
        router.push('/onboarding/university');
      } else if (response.data.userType === 'property_owner') {
        router.push('/dashboard');
      } else {
        router.push('/properties');
      }
    } catch (error) {
      console.error("Error handling email verification:", error);
      router.push('/login');
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
        handleEmailVerificationSuccess,
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
    const { isAuthenticated, isLoading, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push(
          "/login?redirect=" + encodeURIComponent(window.location.pathname)
        );
      } else if (!isLoading && isAuthenticated && user?.userType === 'student' && !user?.university) {
        // If authenticated student without university, redirect to university setup
        if (!window.location.pathname.includes('/onboarding/university')) {
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