// src/components/layout/Footer.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
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
  Home,
  Users,
  GraduationCap,
  MessageCircle,
  Instagram,
  Facebook,
  Twitter,
  Linkedin,
  Star,
  Coffee,
  BookOpen,
  Zap,
  ChevronRight,
} from "lucide-react";

// Custom SVG for proper social icons
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
  </svg>
);

const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M19 3a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zm-.5 15.5v-5.3a3.26 3.26 0 00-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 011.4 1.4v4.93h2.79zM6.88 8.56a1.68 1.68 0 001.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 00-1.69 1.69c0 .93.76 1.68 1.69 1.68zm1.39 9.94v-8.37H5.5v8.37h2.77z" />
  </svg>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubscribing(false);
    setEmail("");
  };

  const footerLinks = {
    students: [
      { href: "/properties", label: "Buscar Hogar", icon: Home },
      { href: "/roommates", label: "Encontrar Roomies", icon: Users },
      { href: "/universities", label: "Por Universidad", icon: GraduationCap },
      { href: "/blog", label: "Tips Estudiantiles", icon: BookOpen },
    ],
    support: [
      { href: "/how-it-works", label: "Cómo Funciona", icon: Zap },
      { href: "/safety", label: "Tu Seguridad", icon: Shield },
      { href: "/help", label: "Centro de Ayuda", icon: MessageCircle },
      { href: "/contact", label: "Contacto", icon: Mail },
    ],
    company: [
      { href: "/about", label: "Nuestra Historia", icon: Heart },
      { href: "/careers", label: "Únete al Equipo", icon: Coffee },
      { href: "/press", label: "Prensa", icon: Star },
      { href: "/partners", label: "Universidades", icon: GraduationCap },
    ],
  };

  const socialLinks = [
    { icon: InstagramIcon, href: "https://instagram.com/micalli_mx", label: "Instagram" },
    { icon: FacebookIcon, href: "https://facebook.com/micalli", label: "Facebook" },
    { icon: TwitterIcon, href: "https://twitter.com/micalli_mx", label: "Twitter" },
    { icon: LinkedinIcon, href: "https://linkedin.com/company/micalli", label: "LinkedIn" },
  ];

  const stats = [
    { number: "1,500+", label: "Estudiantes Felices" },
    { number: "450+", label: "Propiedades Verificadas" },
    { number: "98%", label: "Satisfacción" },
    { number: "3.5", label: "Días Promedio" },
  ];

  return (
    <footer className="relative bg-gradient-to-b from-white to-cream-50 overflow-hidden">
      {/* Decorative Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0 pattern-aztec" />
      </div>

      {/* Newsletter Section */}
<section className="relative border-t border-gray-100">
  <div className="container mx-auto px-6 sm:px-8 py-8">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-5xl mx-auto"
    >
      <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-accent-500/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 grid lg:grid-cols-2 gap-6 sm:gap-8 items-center"> {/* Changed from md:grid-cols-2 to lg:grid-cols-2 */}
          <div className="text-white">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl sm:text-2xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 sm:w-6 h-5 sm:h-6" />
                ¡Únete a la Comunidad!
              </h3>
              <p className="text-primary-100 text-sm sm:text-base">
                Recibe las mejores ofertas de vivienda y tips para tu vida universitaria directo en tu inbox.
              </p>
            </motion.div>
          </div>
          
          <motion.form
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubscribe}
            className="flex gap-2 sm:gap-3 w-full" 
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.email@universidad.mx"
              required
              className="flex-1 min-w-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all text-sm sm:text-base"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={isSubscribing}
              className="bg-white text-primary-600 font-semibold px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-1 sm:gap-2 group disabled:opacity-70 whitespace-nowrap flex-shrink-0"
            >
              {isSubscribing ? (
                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="hidden sm:inline">Suscribirme</span>
                  <span className="sm:hidden">Suscribir</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </motion.form>
        </div>
      </div>
    </motion.div>
  </div>
</section>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-4 space-y-6"
          >
            <div>
              <Link href="/" className="inline-block group">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary-500 to-primary-600 text-white font-black text-2xl px-4 py-2 rounded-xl shadow-lg group-hover:shadow-xl transition-all">
                    Micalli
                  </div>
                </div>
              </Link>
              <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                Tu hogar lejos de casa. Conectamos estudiantes con espacios seguros y roomies compatibles en Monterrey.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                100% Verificado
              </div>
              <div className="bg-accent-50 text-accent-700 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                <Heart className="w-4 h-4" />
                Hecho en México
              </div>
            </div>
          </motion.div>

          {/* Links Sections */}
          <div className="lg:col-span-8 grid gap-8 sm:grid-cols-3">
            {/* Para Estudiantes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🎓</span>
                Para Estudiantes
              </h4>
              <ul className="space-y-3">
                {footerLinks.students.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-all"
                    >
                      <link.icon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Soporte */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">💚</span>
                Soporte
              </h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-all"
                    >
                      <link.icon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Empresa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                Empresa
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-all"
                    >
                      <link.icon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform">
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>

        {/* Contact & Social Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-12 pt-12 border-t border-gray-200"
        >
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 items-center">
            {/* Contact Info */}
            <div className="space-y-4">
              <h5 className="font-bold text-gray-900 mb-4">Contáctanos</h5>
              <div className="space-y-3">
                <a
                  href="mailto:hola@micalli.mx"
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                  <span>hola@micalli.mx</span>
                </a>
                <a
                  href="tel:+528112345678"
                  className="flex items-center gap-3 text-gray-600 hover:text-primary-600 transition-colors group"
                >
                  <Phone className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
                  <span>+52 81 1234 5678</span>
                </a>
                <div className="flex items-center gap-3 text-gray-600">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span>Monterrey, Nuevo León, México</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="lg:text-center">
              <h5 className="font-bold text-gray-900 mb-4">Síguenos</h5>
              <div className="flex gap-3 lg:justify-center">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 bg-gray-100 hover:bg-primary-100 rounded-full flex items-center justify-center text-gray-600 hover:text-primary-600 transition-all shadow-sm hover:shadow-md"
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* App Download */}
            <div className="lg:text-right">
              <h5 className="font-bold text-gray-900 mb-4">Próximamente</h5>
              <div className="flex gap-3 lg:justify-end">
                <div className="bg-gray-100 px-4 py-3 rounded-xl text-gray-500 text-sm font-medium">
                  📱 App iOS
                </div>
                <div className="bg-gray-100 px-4 py-3 rounded-xl text-gray-500 text-sm font-medium">
                  🤖 App Android
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-600">
              <span>© {currentYear} Micalli. Todos los derechos reservados.</span>
              <span className="hidden sm:inline text-gray-400">•</span>
              <span className="flex items-center gap-1">
                Hecho con <Heart className="w-4 h-4 text-red-500 fill-current" /> en Monterrey
              </span>
            </div>

            {/* Legal Links */}
            <div className="flex flex-wrap gap-6 text-sm">
              <Link href="/privacy" className="text-gray-600 hover:text-primary-600 transition-colors">
                Privacidad
              </Link>
              <Link href="/terms" className="text-gray-600 hover:text-primary-600 transition-colors">
                Términos
              </Link>
              <Link href="/cookies" className="text-gray-600 hover:text-primary-600 transition-colors">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Decorative Wave */}
<div className="absolute bottom-0 left-0 w-full pointer-events-none z-10">
  <svg 
    viewBox="0 0 1440 120" 
    className="w-full h-12 fill-primary-100 opacity-50"
    preserveAspectRatio="none"
  >
    <path d="M0,60 Q360,20 720,60 T1440,60 L1440,120 L0,120 Z" />
  </svg>
</div>
    </footer>
  );
}