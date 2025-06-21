"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  SparklesIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("session_expired") === "true";
  const registered = searchParams.get("registered") === "true";
  const passwordReset = searchParams.get("password_reset") === "success";
  const verified = searchParams.get("verified") === "true";
  const needsVerification = searchParams.get("verify") === "true";
  const { login } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(identifier, password);
    } catch (err: any) {
      console.error("Login error:", err);
      setError(
        err.message || "Failed to login. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: "🏠", text: "1000+ verified properties" },
    { icon: "👥", text: "Connect with roommates" },
    { icon: "⚡", text: "Instant booking" },
    { icon: "🛡️", text: "Secure & trusted" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-5xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid md:grid-cols-2">
            {/* Left side - Login Form */}
            <div className="p-8 lg:p-12">
              {/* Logo */}
              <div className="mb-8">
                <Link href="/" className="flex items-center space-x-2 group">
                  <div className="relative">
                    <div className="absolute bg-gradient-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                    <div className="relative bg-gradient-primary text-white font-bold text-xl px-3.5 py-1.5 rounded-lg transform group-hover:scale-105 transition-transform">
                      Roomigo
                    </div>
                  </div>
                </Link>
              </div>

              {/* Welcome message */}
              <div className="mb-8 ">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Welcome back! 👋
                </h1>
                <p className="text-gray-600">
                  Sign in to find your perfect student home
                </p>
              </div>

              {/* Alerts */}
              {registered && isMounted && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-slide-in-down">
                  <div className="flex">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Account created successfully! You can now sign in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {passwordReset && isMounted && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-slide-in-down">
                  <div className="flex">
                    <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Password reset successfully! Sign in with your new
                        password.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {verified && isMounted && (
                <div className="mb-6 bg-green-50 border-l-4 border-green-500 p-4 rounded-lg animate-slide-in-down">
                  <div className="flex">
                    <CheckBadgeIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-800">
                        Email verified! Your account is ready to use.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {needsVerification && isMounted && (
                <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg animate-slide-in-down">
                  <div className="flex">
                    <EnvelopeIcon className="h-5 w-5 text-blue-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        Check your email to verify your account before signing
                        in.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {sessionExpired && isMounted && (
                <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg animate-slide-in-down">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">
                        Your session expired. Please sign in again.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && isMounted && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">
                        {error}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="identifier"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon
                        className={`h-5 w-5 transition-colors ${
                          focusedField === "identifier"
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      id="identifier"
                      name="identifier"
                      type="text"
                      autoComplete="email"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      onFocus={() => setFocusedField("identifier")}
                      onBlur={() => setFocusedField(null)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon
                        className={`h-5 w-5 transition-colors ${
                          focusedField === "password"
                            ? "text-green-500"
                            : "text-gray-400"
                        }`}
                      />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember me & Forgot password */}
                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-5 h-5 border-2 rounded transition-all ${
                        rememberMe
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 group-hover:border-gray-400"
                      }`}
                    >
                      {rememberMe && (
                        <svg
                          className="w-3 h-3 text-white mx-auto"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <span className="ml-2 text-sm text-gray-700 group-hover:text-gray-900">
                      Remember me
                    </span>
                  </label>

                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-green-600 hover:text-green-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !isMounted}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>

                {/* Sign up link */}
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{" "}
                  <Link
                    href="/signup"
                    className="font-medium text-green-600 hover:text-green-500 transition-colors"
                  >
                    Sign up for free
                  </Link>
                </p>
              </form>
            </div>

            {/* Right side - Welcome Panel */}
            <div className="hidden md:block bg-gradient-to-br from-green-500 to-emerald-600 p-12 text-white">
              <div className="h-full flex flex-col justify-between">
                <div>
                  <div className="mb-8">
                    <SparklesIcon className="h-12 w-12 text-yellow-300" />
                  </div>
                  <h2 className="text-3xl font-bold mb-4">
                    Find your perfect student home
                  </h2>
                  <p className="text-green-100 text-lg mb-8">
                    Join thousands of students who found their ideal housing
                    through UniHousing.
                  </p>

                  {/* Features */}
                  <div className="space-y-4">
                    {features.map((feature, index) => (
                      <div
                        key={index}
                        className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-3"
                      >
                        <span className="text-2xl">{feature.icon}</span>
                        <span className="text-green-50">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Testimonial */}
                <div className="mt-12 bg-white/10 backdrop-blur-sm rounded-xl p-6">
                  <p className="text-green-50 italic mb-4">
                    "UniHousing made finding a place near campus so easy! I
                    found my perfect room in just 2 days."
                  </p>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-lg">👩‍🎓</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Maria Garcia</p>
                      <p className="text-green-100 text-sm">Tec de Monterrey</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
