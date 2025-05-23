"use client";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout, user, isLoading } = useAuth();

  // Add this debugging
  console.log("=== HEADER RENDER ===");
  console.log("isLoading:", isLoading);
  console.log("isAuthenticated:", isAuthenticated);
  console.log("user:", user);
  console.log("userType:", user?.user_type);
  console.log("Should show dashboard?", isAuthenticated && user?.user_type === 'property_owner');

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-indigo-600">
              UniHousing
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/properties"
              className="text-gray-700 hover:text-indigo-600"
            >
              Properties
            </Link>
            <Link
              href="/universities"
              className="text-gray-700 hover:text-indigo-600"
            >
              Universities
            </Link>
            <Link
              href="/roommates"
              className="text-gray-700 hover:text-indigo-600"
            >
              Find Roommates
            </Link>
            {isAuthenticated && (
              <Link
                href="/messages"
                className="text-gray-700 hover:text-indigo-600 relative"
              >
                Messages
              </Link>
            )}
            {/* Add Dashboard button for property owners */}
            {isAuthenticated && user?.userType === 'property_owner' && (
              <Link
                href="/dashboard"
                className="text-gray-700 hover:text-indigo-600 font-medium"
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Auth buttons */}
          <div className="hidden md:flex space-x-4">
            {isLoading ? (
              <div className="text-gray-400">Loading...</div>
            ) : isAuthenticated ? (
              <>
                {user?.userType === 'property_owner' && (
                  <Link
                    href="/dashboard"
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  {user?.username || "User"}
                </Link>
                <button
                  onClick={logout}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Log in
                </Link>
                <Link
                  href="/signup"
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-500 hover:text-gray-700"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {isMobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t">
            <nav className="flex flex-col space-y-3">
              <Link
                href="/properties"
                className="text-gray-700 hover:text-indigo-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Properties
              </Link>
              <Link
                href="/universities"
                className="text-gray-700 hover:text-indigo-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Universities
              </Link>
              <Link
                href="/roommates"
                className="text-gray-700 hover:text-indigo-600 py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Find Roommates
              </Link>
              {isAuthenticated && (
                <Link
                  href="/messages"
                  className="text-gray-700 hover:text-indigo-600 py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
              )}
              {/* Add Dashboard for mobile */}
              {isAuthenticated && user?.userType === 'property_owner' && (
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-indigo-600 py-2 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              <div className="flex flex-col space-y-3 pt-4 border-t">
                {isLoading ? (
                  <div className="text-gray-400">Loading...</div>
                ) : isAuthenticated ? (
                  <>
                    <Link
                      href="/profile"
                      className="text-indigo-600 hover:text-indigo-800 py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {user?.username || "User"}
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-indigo-600 hover:text-indigo-800 py-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/signup"
                      className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-center"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
