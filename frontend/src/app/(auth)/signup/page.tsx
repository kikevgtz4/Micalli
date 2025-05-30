"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import apiService from "@/lib/api";
import toast from "react-hot-toast";
import PasswordStrengthIndicator from "@/components/common/PasswordStrengthIndicator";
import { validation } from "@/utils/validation";
import {
  EnvelopeIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ArrowRightIcon,
  HomeIcon,
  AcademicCapIcon,
  SparklesIcon,
  ShieldCheckIcon
} from "@heroicons/react/24/outline";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    userType: "student",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [completedFields, setCompletedFields] = useState<Set<string>>(new Set());
  const router = useRouter();

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

    // Mark field as completed when it has value
    if (value) {
      setCompletedFields(prev => new Set(prev).add(name));
    } else {
      setCompletedFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(name);
        return newSet;
      });
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

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Check terms acceptance
    if (!acceptTerms) {
      setError("Please accept the terms and conditions");
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        user_type: formData.userType,
      };

      await apiService.auth.register(userData);
      toast.success(
        "Account created! Please check your email to verify your account."
      );
      router.push("/login?registered=true&verify=true");
    } catch (err: any) {
      console.error("Registration error:", err);
      let errorMessage = "Registration failed. Please try again.";

      if (err.response?.data) {
        if (typeof err.response.data === "string") {
          errorMessage = err.response.data;
        } else if (err.response.data.detail) {
          errorMessage = err.response.data.detail;
        } else if (typeof err.response.data === "object") {
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

  const userTypes = [
    {
      value: 'student',
      label: 'Student',
      icon: AcademicCapIcon,
      description: 'Looking for housing',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      value: 'property_owner',
      label: 'Property Owner',
      icon: HomeIcon,
      description: 'Listing properties',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const benefits = [
    { icon: '🛡️', text: 'Verified properties only' },
    { icon: '💬', text: 'Direct messaging with owners' },
    { icon: '📍', text: 'Find housing near your university' },
    { icon: '⚡', text: 'Quick and easy booking' }
  ];

  // Calculate progress
  const requiredFields = ['email', 'username', 'password', 'confirmPassword'];
  const progress = (completedFields.size / requiredFields.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center px-4 py-12">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="grid lg:grid-cols-5">
            {/* Left side - Benefits Panel */}
            <div className="hidden lg:block lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 p-12 text-white">
              <div className="h-full flex flex-col">
                <div>
                  <Link href="/" className="flex items-center space-x-2 group mb-8">
                  <div className="relative">
                    <div className="absolute bg-gradient-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
                    <div className="relative bg-gradient-primary text-white font-bold text-xl px-3.5 py-1.5 rounded-lg transform group-hover:scale-105 transition-transform">
                      Roomigo
                    </div>
                  </div>
                  </Link>
                  <div className="text-3xl font-bold mb-4">
                    <h2>Join our community 🎉</h2>
                  </div>
                  <div className="text-indigo-100 text-lg mb-8">
                    <p>
                      Create your account and start finding your perfect student home today.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-4 mb-12">
                    {benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-lg p-4 transform hover:scale-105 transition-transform">
                        <span className="text-2xl">{benefit.icon}</span>
                        <span className="text-white/90">{benefit.text}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mt-auto grid grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">1,500+</p>
                    <p className="text-indigo-100 text-sm">Active Students</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">500+</p>
                    <p className="text-indigo-100 text-sm">Properties Listed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Signup Form */}
            <div className="lg:col-span-3 p-8 lg:p-12">
              {/* Progress bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Account Setup Progress</span>
                  <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Welcome message */}
              <div className="mb-8">
                <div className="text-3xl font-bold text-gray-900 mb-2">
                <h1>
                  Create your account 
                </h1>
                </div>
                <div className="text-gray-600">
                  <p>Join thousands of students finding their perfect homes</p>
                </div>
                
              </div>

              {/* Error display */}
              {error && isMounted && (
                <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                  <div className="flex">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-red-800">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* User Type Selection */}
                <div>
                  <label className="block text-m font-medium text-gray-700 mb-3">
                    I am a
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    {userTypes.map((type) => (
                      <label
                        key={type.value}
                        className={`relative flex flex-col items-center p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                          formData.userType === type.value
                            ? 'border-transparent shadow-lg transform scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{
                          background: formData.userType === type.value 
                            ? `linear-gradient(135deg, ${type.color.split(' ')[1]} 0%, ${type.color.split(' ')[3]} 100%)`
                            : ''
                        }}
                      >
                        <input
                          type="radio"
                          name="userType"
                          value={type.value}
                          checked={formData.userType === type.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        <type.icon className={`h-8 w-8 mb-2 ${
                          formData.userType === type.value ? 'text-green-600' : 'text-gray-400'
                        }`} />
                        <span className={`font-medium ${
                          formData.userType === type.value ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {type.label}
                        </span>
                        <span className={`text-xs mt-1 ${
                          formData.userType === type.value ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {type.description}
                        </span>
                        {formData.userType === type.value && (
                          <CheckCircleIcon className="absolute top-2 right-2 h-5 w-5 text-green-600" />
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <EnvelopeIcon className={`h-5 w-5 transition-colors ${
                        focusedField === 'email' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="student@university.edu"
                    />
                    </div>
                    {completedFields.has('email') && (
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className={`h-5 w-5 transition-colors ${
                        focusedField === 'username' ? 'text-green-600' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300">
                    <input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      value={formData.username}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('username')}
                      onBlur={() => setFocusedField(null)}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                      placeholder="johndoe"
                    />
                    </div>
                    {completedFields.has('username') && (
                      <CheckCircleIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className={`h-5 w-5 transition-colors ${
                        focusedField === 'password' ? 'text-indigo-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className={`block w-full pl-10 pr-12 py-3 border ${
                        passwordError ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300`}>
                      <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={`block w-full pl-10 pr-12 py-3 border ${
                        passwordError ? 'border-red-300' : 'border-gray-200'
                      } rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300`}
                      placeholder="••••••••"
                    />
                    </div>
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
                  {passwordError && (
                    <p className="mt-2 text-sm text-red-600 flex items-center">
                      <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                      {passwordError}
                    </p>
                  )}
                  <PasswordStrengthIndicator password={formData.password} />
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className={`h-5 w-5 transition-colors ${
                        focusedField === 'confirmPassword' ? 'text-green-500' : 'text-gray-400'
                      }`} />
                    </div>
                    <div className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-300">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 hover:border-gray-300"
                        placeholder="••••••••"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                    {completedFields.has('confirmPassword') && formData.password === formData.confirmPassword && (
                      <CheckCircleIcon className="absolute right-12 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
                    )}
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-2 text-sm text-red-600">Passwords do not match</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <label className="flex items-center cursor-pointer group">
                    <div className="sr-only">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="sr-only items-center"
                    />
                    </div>
                    <div className={`mt-1 w-5 h-5 border-2 rounded transition-all flex-shrink-0 ${
                      acceptTerms 
                        ? 'bg-green-600 border-green-500' 
                        : 'border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {acceptTerms && (
                        <svg className="w-3 h-3 text-white mx-auto" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <div className="ml-3 text-sm text-gray-700">
                    <span className=" text-black-600 hover:text-gray-500 underline">
                      I agree to the{' '}
                      <Link href="/terms" className="text-indigo-600 hover:text-indigo-500 underline">
                        Terms and Conditions
                      </Link>
                      {' '}and{' '}
                      <Link href="/privacy" className="text-indigo-600 hover:text-indigo-500 underline">
                        Privacy Policy
                      </Link>
                    </span>
                    </div>
                  </label>
                </div>

                {/* Submit Button */}
                <div className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                <button
                  type="submit"
                  disabled={isLoading || !isMounted || !acceptTerms}
                  className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRightIcon className="ml-2 h-5 w-5" />
                    </>
                  )}
                </button>
                </div>

                {/* Sign in link */}
                <div className="text-center text-sm text-gray-600">
                <p className="font-medium text-gray-600 transition-colors">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="font-medium hover:text-indigo-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
                </div>

                {/* Security note */}
                <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                  <ShieldCheckIcon className="h-4 w-4" />
                  <span>Your information is secure and encrypted</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}