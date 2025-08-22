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
  KeyIcon,
} from "lucide-react";
import { getImageUrl } from "@/utils/imageUrls";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
      label: "Propiedades", 
      icon: Home,
    },
    {
      href: "/roommates",
      label: "Roommates",
      icon: Users,
      badge: user?.userType === "student" && !user.hasCompleteProfile,
    },
    {
      href: "/subleases",
      label: "Subleases",
      icon: KeyIcon,
    },
    { 
      href: "/universities", 
      label: "Universidades", 
      icon: GraduationCap,
    },
    { 
      href: "/how-it-works", 
      label: "¿Cómo funciona?", 
      icon: HelpCircle,
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

  const getUserFirstName = () => {
    return user?.firstName || user?.username || "Usuario";
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
          : "bg-white backdrop-blur-md py-4"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
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
          <nav className="hidden lg:flex items-center space-x-6">
            {navLinks.map((link, index) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Link
                  href={link.href}
                  className={`relative group px-1 py-2 font-medium transition-all duration-300 flex items-center gap-2 ${
                    pathname === link.href
                      ? "text-primary-600"
                      : "text-gray-700 hover:text-primary-600"
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.badge && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="ml-1 px-2 py-0.5 bg-accent-500 text-white text-xs rounded-full"
                    >
                      ¡Nuevo!
                    </motion.span>
                  )}
                  {/* Animated underline with gradient */}
                  <span
                    className={`absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 rounded-full transform origin-left transition-transform duration-300 ${
                      pathname === link.href
                        ? "scale-x-100"
                        : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
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
                  </Link>
                </motion.div>

                {/* Simplified Profile Button */}
                <DropdownMenu open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex items-center gap-2 px-3 py-2 h-auto hover:bg-gray-50 rounded-xl transition-all"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={getProfileImageUrl() || undefined}
                          alt={getUserDisplayName()}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary-500 to-accent-500 text-white font-bold text-sm">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-900 hidden md:block">
                        {getUserFirstName()}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent 
                    className="w-72 p-0 mt-2 rounded-2xl shadow-2xl border-0 overflow-hidden" 
                    align="end" 
                    forceMount
                  >
                    {/* Gradient header with vibrant colors */}
                    <div className="relative bg-primary-500 p-4 text-white">
                      {/* Pattern overlay for visual interest */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-white/30">
                            <AvatarImage
                              src={getProfileImageUrl() || undefined}
                              alt={getUserDisplayName()}
                            />
                            <AvatarFallback className="bg-white/20 backdrop-blur text-white font-bold text-sm">
                              {getUserInitials()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-bold text-white">{getUserDisplayName()}</p>
                            <p className="text-sm text-white/80 truncate">{user?.email}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Menu Items with vibrant colors */}
                    <div className="p-3 bg-gray-50">
                      <div className="space-y-1">
                        <DropdownMenuItem asChild className="rounded-lg hover:bg-white transition-all cursor-pointer group">
                          <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <User className="w-4 h-4 text-primary-700" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">Mi Perfil</span>
                              <p className="text-xs text-gray-500">Edita tu información</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        
                        {user?.userType === "property_owner" && (
                          <DropdownMenuItem asChild className="rounded-lg hover:bg-white transition-all cursor-pointer group">
                            <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5">
                              <div className="w-9 h-9 bg-gradient-to-br from-accent-100 to-accent-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <LayoutDashboard className="w-4 h-4 text-accent-700" />
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">Dashboard</span>
                                <p className="text-xs text-gray-500">Gestiona tus propiedades</p>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                        )}
                        
                        {user?.userType === "student" && (
                          <DropdownMenuItem asChild className="rounded-lg hover:bg-white transition-all cursor-pointer group">
                            <Link href="/roommates/profile/edit" className="flex items-center gap-3 px-3 py-2.5">
                              <div className="w-9 h-9 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Users className="w-4 h-4 text-purple-700" />
                              </div>
                              <div className="flex-1">
                                <span className="font-medium text-gray-900">Perfil de Roomie</span>
                                <p className="text-xs text-gray-500">Tu perfil de búsqueda</p>
                              </div>
                              {!user.hasCompleteProfile && (
                                <motion.span 
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="px-2 py-0.5 bg-accent-100 text-accent-700 text-xs font-semibold rounded-full animate-pulse"
                                >
                                  Nuevo
                                </motion.span>
                              )}
                            </Link>
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem asChild className="rounded-lg hover:bg-white transition-all cursor-pointer group">
                          <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Settings className="w-4 h-4 text-gray-700" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-gray-900">Configuración</span>
                              <p className="text-xs text-gray-500">Privacidad y preferencias</p>
                            </div>
                          </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-2" />
                        
                        <DropdownMenuItem
                          className="rounded-lg hover:bg-red-50 cursor-pointer group"
                          onClick={logout}
                        >
                          <div className="flex items-center gap-3 px-3 py-2.5">
                            <div className="w-9 h-9 bg-gradient-to-br from-red-100 to-red-200 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                              <LogOut className="w-4 h-4 text-red-600" />
                            </div>
                            <div className="flex-1">
                              <span className="font-medium text-red-600">Cerrar Sesión</span>
                              <p className="text-xs text-red-500">Hasta pronto 👋</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </div>
                    </div>
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
                <div className="p-6 border-b border-gray-100 bg-white">
                  <Link href="/" className="flex items-center space-x-2" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="bg-gradient-to-r from-primary-500 to-primary-600 text-white font-black text-lg px-3.5 py-1.5 rounded-lg">
                      Micalli
                    </div>
                  </Link>
                </div>

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
                            ? "text-primary-600 bg-white shadow-sm"
                            : "text-gray-700 hover:bg-white/80"
                        }`}
                      >
                        <link.icon className="h-5 w-5" />
                        <span className="flex-1">{link.label}</span>
                        {link.badge && (
                          <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                            ¡Nuevo!
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