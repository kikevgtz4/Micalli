// src/components/layout/Footer.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Heart,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  Shield,
  Globe,
  Check,
} from "lucide-react";

// Custom SVG icon components to replace deprecated Lucide brand icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
      clipRule="evenodd"
    />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
      clipRule="evenodd"
    />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      fillRule="evenodd"
      d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [selectedLanguage, setSelectedLanguage] = useState("es");

  const languages = [
    {
      code: "es",
      label: "Español",
      flagUrl: "https://flagcdn.com/w40/mx.png",
      shortLabel: "ES",
    },
    {
      code: "en",
      label: "English",
      flagUrl: "https://flagcdn.com/w40/us.png",
      shortLabel: "EN",
    },
  ];

  const footerLinks = {
    quickLinks: [
      { href: "/properties", label: "Find Rooms", emoji: "🏠" },
      { href: "/roommates", label: "Find Roommates", emoji: "👥" },
      { href: "/universities", label: "Universities", emoji: "🎓" },
      { href: "/how-it-works", label: "How it Works", emoji: "💡" },
      { href: "/blog", label: "Student Blog", emoji: "📝" },
    ],
    support: [
      { href: "/help", label: "Help Center", emoji: "🆘" },
      { href: "/safety", label: "Safety Tips", emoji: "🛡️" },
      { href: "/contact", label: "Contact Us", emoji: "💬" },
      { href: "/faq", label: "FAQs", emoji: "❓" },
    ],
    legal: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  };

  const socialLinks = [
    { icon: FacebookIcon, href: "#", label: "Facebook" },
    { icon: InstagramIcon, href: "#", label: "Instagram" },
    { icon: TwitterIcon, href: "#", label: "Twitter" },
    { icon: LinkedinIcon, href: "#", label: "LinkedIn" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-neutral-50 to-white border-t overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="container mx-auto px-4 py-16 relative z-10">
        {/* Newsletter Section */}
        <motion.div
          className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-3xl p-8 mb-16 shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="text-white">
              <h3 className="text-2xl font-bold mb-2 flex items-center">
                <Sparkles className="w-6 h-6 mr-2" />
                Join Our Student Community!
              </h3>
              <p className="text-primary-100">
                Get exclusive deals, roommate tips, and housing updates
                delivered to your inbox.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                placeholder="your.email@university.edu"
                className="flex-1 px-5 py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
              <Button className="bg-white text-primary-600 hover:bg-primary-50 font-semibold px-6 py-3 rounded-xl transition-all hover:scale-105">
                Subscribe
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Main Footer Content */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand Section */}
          <motion.div
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <Link
                href="/"
                className="inline-flex items-center space-x-2 group"
              >
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-xl px-4 py-2 rounded-xl">
                    Micalli
                  </div>
                </div>
              </Link>
              <p className="mt-4 text-neutral-600 max-w-sm">
                Making student housing simple, safe, and affordable in
                Monterrey. Find your perfect room and roommate with confidence.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-primary-100 text-primary-700 border-primary-200"
              >
                <Shield className="w-3 h-3 mr-1" />
                Verified Platform
              </Badge>
              <Badge
                variant="secondary"
                className="bg-accent-100 text-accent-700 border-accent-200"
              >
                <Heart className="w-3 h-3 mr-1" />
                #1 in Monterrey
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <a
                href="mailto:hello@roomigo.mx"
                className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
              >
                <Mail className="w-4 h-4 mr-2" />
                hello@micalli.mx
              </a>
              <a
                href="tel:+528112345678"
                className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors"
              >
                <Phone className="w-4 h-4 mr-2" />
                +52 81 1234 5678
              </a>
              <div className="flex items-center text-neutral-600">
                <MapPin className="w-4 h-4 mr-2" />
                Monterrey, Nuevo León, México
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center space-x-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-neutral-400 hover:bg-primary-100 hover:text-primary-600 transition-all"
                  >
                    <social.icon className="h-4 w-4" />
                  </Button>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center">
              <span className="text-lg mr-2">🚀</span>
              Quick Links
            </h4>
            <ul className="space-y-3">
              {footerLinks.quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-neutral-600 hover:text-primary-600 transition-all"
                  >
                    <span className="mr-2 group-hover:scale-125 transition-transform">
                      {link.emoji}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Support */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-sm font-bold text-neutral-900 mb-4 flex items-center">
              <span className="text-lg mr-2">💡</span>
              Support
            </h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center text-neutral-600 hover:text-primary-600 transition-all"
                  >
                    <span className="mr-2 group-hover:scale-125 transition-transform">
                      {link.emoji}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform">
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-sm font-bold text-neutral-900 mb-4">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-neutral-600 hover:text-primary-600 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        <Separator className="my-12 bg-neutral-200" />

        {/* Bottom Footer */}
        <motion.div
          className="flex flex-col md:flex-row items-center justify-between gap-6"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <span>© {currentYear} Micalli. All rights reserved.</span>
            <span className="text-neutral-400">•</span>
            <span className="flex items-center">
              Made with{" "}
              <Heart className="w-4 h-4 mx-1 fill-red-500 text-red-500" />
              for students in Monterrey
            </span>
          </div>

          {/* Enhanced Language Selector */}
          <div className="relative group">
            <div className="flex items-center gap-2 bg-gradient-to-r from-neutral-100/80 to-neutral-50/80 backdrop-blur-sm rounded-2xl p-1.5 border border-neutral-200/50 hover:border-primary-200/50 transition-all">
              <div className="flex items-center gap-2 px-3 py-2 text-neutral-600">
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium hidden sm:inline">
                  Language
                </span>
              </div>

              <div className="flex items-center relative">
                {languages.map((lang) => (
                  <motion.button
                    key={lang.code}
                    onClick={() => setSelectedLanguage(lang.code)}
                    className={`
      relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm
      transition-all duration-300
      ${
        selectedLanguage === lang.code
          ? "bg-white shadow-md text-neutral-900"
          : "text-neutral-600 hover:text-neutral-800"
      }
    `}
                  >
                    {/* Use img tag for flags */}
                    <img
                      src={lang.flagUrl}
                      alt={`${lang.label} flag`}
                      className="w-5 h-4 object-cover rounded-sm"
                    />

                    {/* Language label - hidden on mobile for selected */}
                    <span
                      className={`
                      ${
                        selectedLanguage === lang.code
                          ? "hidden sm:inline"
                          : "hidden"
                      }
                    `}
                    >
                      {lang.label}
                    </span>

                    {/* Short label for mobile */}
                    <span
                      className={`
                      sm:hidden font-semibold
                      ${selectedLanguage === lang.code ? "inline" : "hidden"}
                    `}
                    >
                      {lang.shortLabel}
                    </span>

                    {/* Selected indicator */}
                    {selectedLanguage === lang.code && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center shadow-md"
                      >
                        <Check className="w-3 h-3 text-white" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}

                {/* Sliding background indicator */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-primary-500 to-accent-50 rounded-xl -z-10"
                  initial={false}
                  animate={{
                    x: selectedLanguage === "es" ? 0 : "100%",
                    width: "50%",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
