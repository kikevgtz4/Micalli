"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainLayout from "@/components/layout/MainLayout";
import apiService from "@/lib/api";
import toast from "react-hot-toast";
import PasswordStrengthIndicator from "@/components/common/PasswordStrengthIndicator";
import { validation } from "@/utils/validation";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    userType: "student",
  });
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Fix hydration issues by only rendering client-specific elements after mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Real-time password validation
    if (name === 'password') {
      const result = validation.password(value);
      setPasswordError(result.isValid ? null : result.error || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Password validation
    const passwordResult = validation.password(formData.password);
    if (!passwordResult.isValid) {
      setPasswordError(passwordResult.error || "Invalid password");
      setIsLoading(false);
      return;
    }

    // Simple validation
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      // Explicitly format the data to match Django's expected format
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        user_type: formData.userType, // Use snake_case for backend compatibility
      };

      console.log("Sending registration data:", userData);

      // Make the API call directly here for better control
      const response = await apiService.auth.register(userData);
      console.log("Registration success:", response);

      // After successful registration
      toast.success(
        "Account created! Please check your email to verify your account."
      );
      router.push("/login?registered=true&verify=true");
    } catch (err: any) {
      console.error("Registration error:", err);
      console.error("Error details:", err.response?.data);

      // Extract detailed error message if available
      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data) {
        // Check for different error formats
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === "object") {
          // Handle field-specific errors (common in Django REST Framework)
          const fieldErrors = Object.entries(err.response.data)
            .map(
              ([field, errors]) =>
                `${field}: ${Array.isArray(errors) ? errors.join(" ") : errors}`
            )
            .join(", ");
          if (fieldErrors) {
            errorMessage = fieldErrors;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto my-16 px-4">
        <div className="bg-surface p-8 rounded-lg shadow-md">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-stone-900">
              Create your account
            </h2>
            <p className="mt-2 text-center text-sm text-stone-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Sign in
              </Link>
            </p>
          </div>

          {error && isMounted && (
            <div className="bg-error-50 border-l-4 border-error-400 p-4 mt-8">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-stone-700"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm placeholder-gray-400 text-stone-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-stone-700"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm placeholder-gray-400 text-stone-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.username}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-stone-700"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm placeholder-gray-400 text-stone-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    passwordError ? 'border-red-300' : 'border-stone-200'
                  }`}
                  value={formData.password}
                  onChange={handleChange}
                />
                {passwordError && (
                  <p className="mt-1 text-sm text-error-600">{passwordError}</p>
                )}
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-stone-700"
                >
                  Confirm password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm placeholder-gray-400 text-stone-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label
                  htmlFor="userType"
                  className="block text-sm font-medium text-stone-700"
                >
                  I am a
                </label>
                <select
                  id="userType"
                  name="userType"
                  required
                  className="mt-1 block w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm placeholder-gray-400 text-stone-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.userType}
                  onChange={handleChange}
                >
                  <option value="student">Student</option>
                  <option value="property_owner">Property Owner</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading || !isMounted}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Sign up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}