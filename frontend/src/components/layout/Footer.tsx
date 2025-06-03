"use client"
import Link from "next/link"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Heart, 
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Sparkles,
  Shield
} from "lucide-react"

export default function Footer() {
  const currentYear = new Date().getFullYear()

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
  }

  const socialLinks = [
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Twitter, href: "#", label: "Twitter" },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
  ]

  return (
    <footer className="relative bg-gradient-to-b from-neutral-50 to-white border-t overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
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
                Get exclusive deals, roommate tips, and housing updates delivered to your inbox.
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
              <Link href="/" className="inline-flex items-center space-x-2 group">
                <div className="relative">
                  <div className="absolute -inset-2 bg-gradient-to-r from-primary-400 to-accent-400 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-opacity" />
                  <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold text-xl px-4 py-2 rounded-xl">
                    Roomigo
                  </div>
                </div>
              </Link>
              <p className="mt-4 text-neutral-600 max-w-sm">
                Making student housing simple, safe, and affordable in Monterrey. 
                Find your perfect room and roommate with confidence.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="bg-primary-100 text-primary-700 border-primary-200">
                <Shield className="w-3 h-3 mr-1" />
                Verified Platform
              </Badge>
              <Badge variant="secondary" className="bg-accent-100 text-accent-700 border-accent-200">
                <Heart className="w-3 h-3 mr-1" />
                #1 in Monterrey
              </Badge>
            </div>

            {/* Contact Info */}
            <div className="space-y-3">
              <a href="mailto:hello@roomigo.mx" className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors">
                <Mail className="w-4 h-4 mr-2" />
                hello@roomigo.mx
              </a>
              <a href="tel:+528112345678" className="flex items-center text-neutral-600 hover:text-primary-600 transition-colors">
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
                  <Button variant="ghost" size="icon" className="rounded-full bg-neutral-100 hover:bg-primary-100 hover:text-primary-600 transition-all">
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
                    <span className="mr-2 group-hover:scale-125 transition-transform">{link.emoji}</span>
                    <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
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
                    <span className="mr-2 group-hover:scale-125 transition-transform">{link.emoji}</span>
                    <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
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
            <span>© {currentYear} Roomigo. All rights reserved.</span>
            <span className="text-neutral-400">•</span>
            <span className="flex items-center">
              Made with <Heart className="w-4 h-4 mx-1 fill-red-500 text-red-500" /> 
              for students in Monterrey
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-neutral-500">Language</span>
            <div className="flex items-center bg-neutral-100/50 rounded-lg p-0.5">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-white shadow-sm transition-all"
              >
                <span className="text-base">🇲🇽</span>
                <span className="text-sm font-medium text-neutral-800">Español</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-md hover:bg-white/80 transition-all"
              >
                <span className="text-base">🇺🇸</span>
                <span className="text-sm font-medium text-neutral-600">English</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  )
}