"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
  const { isAuthenticated, logout, user, isLoading } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    // Check system preference and localStorage
    const darkModeQuery = window.matchMedia("(prefers-color-scheme: dark)")
    const savedTheme = localStorage.getItem("theme")

    if (savedTheme) {
      setIsDark(savedTheme === "dark")
    } else {
      setIsDark(darkModeQuery.matches)
    }
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark")
      localStorage.setItem("theme", "dark")
    } else {
      document.documentElement.classList.remove("dark")
      localStorage.setItem("theme", "light")
    }
  }, [isDark])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
  }

  const handleLogout = () => {
    logout()
    setIsProfileMenuOpen(false)
    setIsMobileMenuOpen(false)
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "glass-strong shadow-lg" : "glass backdrop-blur-md"
      } border-b border-neutral-200 dark:border-neutral-700`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href="/"
              className="text-2xl font-bold gradient-text hover:scale-105 transition-transform focus-visible-only"
            >
              UniHousing
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/properties"
              className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors relative group focus-visible-only"
            >
              Properties
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/universities"
              className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors relative group focus-visible-only"
            >
              Universities
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            <Link
              href="/roommates"
              className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors relative group focus-visible-only"
            >
              Find Roommates
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
            </Link>
            {isAuthenticated && (
              <Link
                href="/messages"
                className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors relative group focus-visible-only"
              >
                Messages
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
                {/* Notification badge */}
                <span className="absolute -top-1 -right-2 w-2 h-2 bg-accent-500 rounded-full animate-pulse"></span>
              </Link>
            )}
            {isAuthenticated && user?.userType === "property_owner" && (
              <Link
                href="/dashboard"
                className="text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors font-medium relative group focus-visible-only"
              >
                Dashboard
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            )}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors focus-visible-only"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            {isLoading ? (
              <div className="w-20 h-8 skeleton rounded-full"></div>
            ) : isAuthenticated ? (
              <>
                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 focus-visible-only"
                  >
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user?.firstName ? user.firstName[0].toUpperCase() : user?.username[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{user?.firstName || user?.username}</span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isProfileMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  </button>

                  {/* Dropdown */}
                  {isProfileMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 glass-strong rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 py-1 animate-scale-in">
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors focus-visible-only"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      {user?.userType === "property_owner" && (
                        <Link
                          href="/dashboard"
                          className="block px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors focus-visible-only"
                          onClick={() => setIsProfileMenuOpen(false)}
                        >
                          Dashboard
                        </Link>
                      )}
                      <hr className="my-1 border-neutral-200 dark:border-neutral-700" />
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors focus-visible-only"
                      >
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium focus-visible-only"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-primary px-6 py-2 rounded-full text-white font-medium focus-visible-only"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Dark mode toggle mobile */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 focus-visible-only"
              aria-label="Toggle dark mode"
            >
              {isDark ? (
                <svg className="w-5 h-5 text-warning-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              )}
            </button>

            <button
              type="button"
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 p-2 focus-visible-only"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <svg
                className="h-6 w-6 transition-transform duration-200"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ transform: isMobileMenuOpen ? "rotate(90deg)" : "rotate(0)" }}
              >
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="py-4 space-y-2">
            <Link
              href="/properties"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Properties
            </Link>
            <Link
              href="/universities"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Universities
            </Link>
            <Link
              href="/roommates"
              className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Find Roommates
            </Link>
            {isAuthenticated && (
              <>
                <Link
                  href="/messages"
                  className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Messages
                </Link>
                {user?.userType === "property_owner" && (
                  <Link
                    href="/dashboard"
                    className="block px-4 py-2 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors font-medium focus-visible-only"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
              </>
            )}

            <hr className="my-4 border-neutral-200 dark:border-neutral-700" />

            {isLoading ? (
              <div className="px-4 py-2">
                <div className="w-20 h-8 skeleton rounded"></div>
              </div>
            ) : isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center text-white text-sm font-medium mr-3">
                      {user?.firstName ? user.firstName[0].toUpperCase() : user?.username[0].toUpperCase()}
                    </div>
                    {user?.firstName || user?.username || "Profile"}
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-900/20 rounded-lg transition-colors focus-visible-only"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-2 text-primary-600 dark:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors focus-visible-only"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="block mx-4 py-2 text-center bg-gradient-primary text-white rounded-full hover:shadow-lg transition-all focus-visible-only"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close profile menu */}
      {isProfileMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)} />}
    </header>
  )
}
