// components/layout/Header.tsx
"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  ChevronDown,
  MessageSquare,
  User,
  LayoutDashboard,
  LogOut,
  Home,
  Users,
  GraduationCap,
  HelpCircle,
  Bell,
  Settings,
  Heart,
  Sparkles,
} from "lucide-react";
import { getImageUrl } from "@/utils/imageUrls";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    { 
      href: "/properties", 
      label: "Encuentra Casa", 
      icon: Home,
      color: "text-primary-600",
      hoverColor: "hover:text-primary-700"
    },
    {
      href: "/roommates",
      label: "Encuentra Roomies",
      icon: Users,
      color: "text-accent-600",
      hoverColor: "hover:text-accent-700",
      badge: user?.userType === "student" && !user.hasCompleteProfile ? "Completa tu perfil" : null,
    },
    { 
      href: "/universities", 
      label: "Universidades", 
      icon: GraduationCap,
      color: "text-primary-600",
      hoverColor: "hover:text-primary-700"
    },
    { 
      href: "/how-it-works", 
      label: "¿Cómo funciona?", 
      icon: HelpCircle,
      color: "text-accent-600",
      hoverColor: "hover:text-accent-700"
    },
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
    return user?.username || "Usuario";
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
          ? "bg-white/95 backdrop-blur-lg shadow-lg py-3"
          : "bg-cream-50/80 backdrop-blur-md py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo with animation */}
          <Link href="/" className="flex items-center space-x-2 group">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
              <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white font-black text-xl px-4 py-2 rounded-xl transform group-hover:scale-105 transition-all duration-300 shadow-md">
                Micalli
              </div>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-2">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className={`relative group px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 ${
                    pathname === link.href
                      ? `${link.color} bg-white shadow-sm`
                      : `text-gray-700 hover:bg-white/80 ${link.hoverColor}`
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <span className="absolute -top-2 -right-2 bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                      {link.badge}
                    </span>
                  )}
                  {/* Active indicator */}
                  {pathname === link.href && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              </motion.div>
            ))}
          </nav>

          {/* Right side actions */}
          <div className="hidden lg:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white animate-pulse" />
                </motion.button>

                {/* Messages */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/messages"
                    className="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-300 block"
                  >
                    <MessageSquare className="w-5 h-5" />
                    {/* Unread indicator */}
                    {/* <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" /> */}
                  </Link>
                </motion.div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center space-x-3 px-3 py-2 h-auto rounded-xl bg-white hover:bg-gray-50 border border-gray-200 hover:border-primary-200 transition-all duration-300"
                    >
                      <Avatar className="h-9 w-9 border-2 border-primary-200">
                        <AvatarImage
                          src={getProfileImageUrl() || undefined}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="text-sm bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden xl:flex items-center space-x-2">
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900 leading-none">
                            {getUserDisplayName()}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {user?.userType === "student" ? "Estudiante" : "Propietario"}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    className="w-64 p-2 mt-2 bg-white/95 backdrop-blur-lg border border-gray-100 shadow-xl rounded-xl" 
                    align="end" 
                    forceMount
                  >
                    <div className="px-3 py-2 border-b border-gray-100 mb-2">
                      <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                      <p className="text-sm text-gray-500 truncate">{user?.email}</p>
                      {user?.userType === "student" && !user?.hasCompleteProfile && (
                        <div className="mt-2 p-2 bg-accent-50 rounded-lg">
                          <p className="text-xs text-accent-700 font-medium">
                            ⚠️ Completa tu perfil para mejores matches
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <DropdownMenuItem asChild className="rounded-lg hover:bg-primary-50 cursor-pointer">
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <span>Mi Perfil</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    {user?.userType === "property_owner" && (
                      <DropdownMenuItem asChild className="rounded-lg hover:bg-primary-50 cursor-pointer">
                        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2">
                          <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-accent-600" />
                          </div>
                          <span>Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    
                    {user?.userType === "student" && (
                      <>
                        <DropdownMenuItem asChild className="rounded-lg hover:bg-primary-50 cursor-pointer">
                          <Link href="/roommates/profile/edit" className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 bg-accent-100 rounded-lg flex items-center justify-center">
                              <Users className="w-4 h-4 text-accent-600" />
                            </div>
                            <span>Perfil de Roomie</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg hover:bg-primary-50 cursor-pointer">
                          <Link href="/favorites" className="flex items-center gap-3 px-3 py-2">
                            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                              <Heart className="w-4 h-4 text-red-600" />
                            </div>
                            <span>Mis Favoritos</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem asChild className="rounded-lg hover:bg-primary-50 cursor-pointer">
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                          <Settings className="w-4 h-4 text-gray-600" />
                        </div>
                        <span>Configuración</span>
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="my-2" />
                    
                    <DropdownMenuItem
                      className="rounded-lg hover:bg-red-50 cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={logout}
                    >
                      <div className="flex items-center gap-3 px-3 py-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Cerrar Sesión</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Link
                    href="/login"
                    className="px-5 py-2.5 text-gray-700 font-medium hover:text-primary-600 transition-colors"
                  >
                    Iniciar Sesión
                  </Link>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/signup"
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-lg transform transition-all duration-300 flex items-center gap-2"
                  >
                    <span>Únete Gratis</span>
                    <Sparkles className="w-4 h-4" />
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="lg:hidden p-2 text-gray-700 hover:bg-white/80 rounded-xl"
              >
                <AnimatePresence mode="wait">
                  {isMobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="h-6 w-6" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <div className="flex flex-col h-full bg-cream-50">
                {/* Mobile menu header */}
                <div className="p-6 border-b border-gray-100 bg-white">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-black text-lg px-3.5 py-1.5 rounded-lg">
                      Micalli
                    </div>
                  </Link>
                </div>

                {/* Mobile navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                  {isAuthenticated && (
                    <div className="mb-6 p-4 bg-white rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary-200">
                          <AvatarImage
                            src={getProfileImageUrl() || undefined}
                            alt={getUserDisplayName()}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-900">{getUserDisplayName()}</p>
                          <p className="text-sm text-gray-500">
                            {user?.userType === "student" ? "Estudiante" : "Propietario"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                          pathname === link.href
                            ? `${link.color} bg-white shadow-sm`
                            : "text-gray-700 hover:bg-white/80"
                        }`}
                      >
                        <link.icon className="h-5 w-5" />
                        <span className="flex-1">{link.label}</span>
                        {link.badge && (
                          <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    ))}

                    {isAuthenticated ? (
                      <>
                        <div className="border-t border-gray-200 my-4"></div>
                        <Link
                          href="/messages"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-gray-700 hover:bg-white/80"
                        >
                          <MessageSquare className="h-5 w-5" />
                          <span>Mensajes</span>
                        </Link>
                        <Link
                          href="/profile"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-gray-700 hover:bg-white/80"
                        >
                          <User className="h-5 w-5" />
                          <span>Mi Perfil</span>
                        </Link>
                        {user?.userType === "property_owner" && (
                          <Link
                            href="/dashboard"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-gray-700 hover:bg-white/80"
                          >
                            <LayoutDashboard className="h-5 w-5" />
                            <span>Dashboard</span>
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all text-red-600 hover:bg-red-50 w-full text-left"
                        >
                          <LogOut className="h-5 w-5" />
                          <span>Cerrar Sesión</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="border-t border-gray-200 my-4"></div>
                        <Link
                          href="/login"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-3 text-center text-gray-700 font-medium rounded-xl hover:bg-white/80"
                        >
                          Iniciar Sesión
                        </Link>
                        <Link
                          href="/signup"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="block px-4 py-3 text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl hover:shadow-md"
                        >
                          Únete Gratis 🚀
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}