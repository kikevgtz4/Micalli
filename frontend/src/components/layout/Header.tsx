// frontend/src/components/layout/Header.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Menu,
  ChevronDown,
  MessageSquare,
  User,
  LayoutDashboard,
  LogOut,
  Home,
  Users,
  GraduationCap,
  HelpCircle,
} from "lucide-react";
import { getImageUrl } from "@/utils/imageUrls";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { isAuthenticated, logout, user } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/properties", label: "Find a Room", icon: Home },
    {
      href: "/roommates",
      label: "Find Roomies",
      icon: Users,
      badge:
        user?.userType === "student" && !user.hasCompleteProfile
          ? "Setup Required"
          : null,
    },
    { href: "/universities", label: "Universities", icon: GraduationCap },
    { href: "/how-it-works", label: "How it Works", icon: HelpCircle },
  ];

  const getUserInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.username?.[0]?.toUpperCase() || "U";
  };

  const getUserDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user?.username || "User";
  };

  const getProfileImageUrl = () => {
    if (user?.profilePicture) {
      return getImageUrl(user.profilePicture);
    }
    return null;
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md shadow-lg py-4"
          : "bg-transparent py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity animate-pulse"></div>
              <div className="relative bg-gradient-primary text-white font-bold text-xl px-3.5 py-1.5 rounded-lg transform group-hover:scale-105 transition-transform">
                Micalli
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
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
                    pathname === link.href
                      ? "scale-x-100"
                      : "scale-x-0 group-hover:scale-x-100"
                  }`}
                />
              </Link>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Messages Button */}
                <Link
                  href="/messages"
                  className="relative p-2 text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  <MessageSquare className="w-6 h-6" />
                  {/* Optional: Add notification dot for unread messages */}
                  {/* <span className="absolute top-0 right-0 block h-2 w-2 transform translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500 ring-2 ring-white" /> */}
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-3 px-4 py-2 h-auto rounded-full bg-gradient-primary/10 hover:bg-gradient-primary/20 border border-primary/20 hover:border-primary/30 transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getProfileImageUrl() || undefined}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="text-xs bg-gradient-primary text-white">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-neutral-700">
                          {getUserDisplayName()}
                        </span>
                        {user?.userType === "student" &&
                          !user?.hasCompleteProfile && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                              Incomplete
                            </span>
                          )}
                      </div>
                      <ChevronDown className="w-4 h-4 text-neutral-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{getUserDisplayName()}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    {user?.userType === "property_owner" && (
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="cursor-pointer">
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {user?.userType === "student" && (
                      <DropdownMenuItem asChild>
                        <Link
                          href="/roommates/profile/edit"
                          className="cursor-pointer"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Roommate Profile
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={logout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
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

          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="md:hidden p-2 text-neutral-700"
              >
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="pr-0">
              <Link href="/" className="flex items-center space-x-2 mb-6">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-primary rounded-xl blur-md opacity-50"></div>
                  <div className="relative bg-gradient-primary text-white font-bold text-lg px-3 py-1.5 rounded-lg">
                    Micalli
                  </div>
                </div>
              </Link>

              <div className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-primary-50 ${
                      pathname === link.href
                        ? "text-primary-600 bg-primary-50"
                        : "text-neutral-700"
                    }`}
                  >
                    <link.icon className="h-5 w-5" />
                    <span>{link.label}</span>
                  </Link>
                ))}

                {isAuthenticated ? (
                  <>
                    <div className="border-t border-neutral-200 my-2"></div>
                    <Link
                      href="/messages"
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-primary-50 text-neutral-700"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>Messages</span>
                    </Link>
                    <Link
                      href="/profile"
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-primary-50 text-neutral-700"
                    >
                      <User className="h-5 w-5" />
                      <span>My Profile</span>
                    </Link>
                    {user?.userType === "property_owner" && (
                      <Link
                        href="/dashboard"
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-primary-50 text-neutral-700"
                      >
                        <LayoutDashboard className="h-5 w-5" />
                        <span>Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors hover:bg-red-50 text-red-600 w-full text-left"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </>
                ) : (
                  <>
                    <div className="border-t border-neutral-200 pt-2 mt-2">
                      <Link
                        href="/login"
                        className="block px-4 py-3 text-center text-primary-600 font-medium rounded-xl hover:bg-primary-50"
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/signup"
                        className="block px-4 py-3 mt-1 text-center bg-gradient-warm text-white font-medium rounded-xl hover:shadow-md"
                      >
                        Get Started 🚀
                      </Link>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
