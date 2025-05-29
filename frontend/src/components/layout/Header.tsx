// frontend/src/components/layout/Header.tsx
"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { usePathname } from "next/navigation"

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const { isAuthenticated, logout, user } = useAuth()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navLinks = [
    { href: "/properties", label: "Find a Room"},
    { href: "/roommates", label: "Find Roomies"},
    { href: "/universities", label: "Universities"},
    { href: "/how-it-works", label: "How it Works"},
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? "bg-white/95 backdrop-blur-md shadow-lg py-4" 
          : "bg-transparent py-6" // Increased base padding slightly
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
          >
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
              <div className="relative bg-gradient-primary text-white font-bold text-xl px-3.5 py-1.5 rounded-lg transform group-hover:scale-105 transition-transform">
                Roomigo
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8"> {/* Adjusted space-x */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`relative group px-3 py-2 text-neutral-700 font-medium transition-all hover:text-primary-600 ${
                  pathname === link.href ? "text-primary-600" : ""
                }`}
              >
                <span className="flex items-center">
                  <span>{link.label}</span>
                </span>
                <span 
                  className={`absolute bottom-0 left-0 w-full h-0.5 bg-gradient-primary transform origin-left transition-transform duration-300 ${
                    pathname === link.href ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  href="/messages"
                  className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {/* Optional: Add a notification dot if there are unread messages */}
                  {/* <span className="absolute top-0 right-0 block h-2 w-2 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white" /> */}
                </Link>

                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-primary text-white hover:shadow-lg transform hover:scale-105 transition-all"
                  >
                    <span className="font-medium">{user?.firstName || user?.username}</span>
                    <svg className={`w-4 h-4 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-neutral-100 overflow-hidden animate-slide-up-fade">
                      <Link
                        href="/profile"
                        className="block px-4 py-3 hover:bg-primary-50 transition-colors"
                        onClick={() => { setShowUserMenu(false); setIsMobileMenuOpen(false); }}
                      >
                        <span className="flex items-center space-x-3">
                          <span>My Profile</span>
                        </span>
                      </Link>
                      {user?.userType === "property_owner" && (
                        <Link
                          href="/dashboard"
                          className="block px-4 py-3 hover:bg-primary-50 transition-colors"
                          onClick={() => { setShowUserMenu(false); setIsMobileMenuOpen(false); }}
                        >
                          <span className="flex items-center space-x-3">
                            <span>Dashboard</span>
                          </span>
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="block w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <span className="flex items-center space-x-2">
                          <span>Sign Out</span>
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2 text-primary-600 font-medium hover:text-primary-700 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-2 bg-gradient-warm text-white font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-neutral-700"
          >
            <div className="space-y-1.5">
              <span className={`block w-6 h-0.5 bg-current transform transition-transform ${isMobileMenuOpen ? "rotate-45 translate-y-2" : ""}`}></span>
              <span className={`block w-6 h-0.5 bg-current transition-opacity ${isMobileMenuOpen ? "opacity-0" : ""}`}></span>
              <span className={`block w-6 h-0.5 bg-current transform transition-transform ${isMobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`}></span>
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 overflow-hidden ${
            isMobileMenuOpen ? "max-h-[80vh] opacity-100 mt-4" : "max-h-0 opacity-0" // Use max-h with a viewport unit for better control
          }`}
        >
          <div className="bg-white rounded-2xl shadow-lg p-3 space-y-1"> {/* Reduced padding and space-y for mobile */}
            {navLinks.map((link) => ( // Main nav links
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 rounded-xl hover:bg-primary-50 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="flex items-center space-x-2">
                  <span className="font-medium">{link.label}</span>
                </span>
              </Link>
            ))}

            {/* User-specific links for mobile */}
            {isAuthenticated ? (
              <>
                <div className="border-t border-neutral-200 my-2"></div>
                <Link
                  href="/profile"
                  className="block px-4 py-3 rounded-xl hover:bg-primary-50 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Profile
                </Link>
                {user?.userType === "property_owner" && (
                  <Link
                    href="/dashboard"
                    className="block px-4 py-3 rounded-xl hover:bg-primary-50 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={() => {
                    logout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <Link
                    href="/login"
                    className="block px-4 py-3 text-center text-primary-600 font-medium rounded-xl hover:bg-primary-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="block px-4 py-3 mt-1 text-center bg-gradient-warm text-white font-medium rounded-xl hover:shadow-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started 🚀
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}