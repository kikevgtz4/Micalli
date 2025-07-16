// frontend/src/app/page.tsx - Completely Redesigned HomePage
"use client"
import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/layout/HeroSection"
import { 
  Heart, 
  Shield, 
  Users, 
  MapPin, 
  Sparkles, 
  Home,
  Clock,
  CheckCircle,
  Star,
  MessageCircle,
  TrendingUp,
  Coffee,
  BookOpen,
  Music,
  Zap
} from "lucide-react"

// Animated counter component
const AnimatedCounter = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isVisible) {
      const duration = 2000
      const steps = 60
      const increment = value / steps
      let current = 0

      const timer = setInterval(() => {
        current += increment
        if (current >= value) {
          setCount(value)
          clearInterval(timer)
        } else {
          setCount(Math.floor(current))
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [isVisible, value])

  return (
    <div ref={ref} className="text-5xl md:text-6xl font-black text-primary-600">
      {count.toLocaleString()}{suffix}
    </div>
  )
}

// Story card component for student testimonials
const StoryCard = ({ story, index }: { story: any; index: number }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.2 }}
      viewport={{ once: true }}
      className="relative group"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-accent-500/20 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
      <div className="relative bg-cream-50 rounded-3xl p-8 border border-primary-100 hover:border-primary-300 transition-all duration-300">
        <div className="flex items-start gap-4 mb-6">
          <img 
            src={story.avatar} 
            alt={story.name}
            className="w-16 h-16 rounded-full object-cover border-3 border-accent-300"
          />
          <div>
            <h4 className="font-bold text-lg text-gray-900">{story.name}</h4>
            <p className="text-sm text-gray-600">{story.university} • {story.semester}</p>
          </div>
        </div>
        <blockquote className="text-gray-700 mb-4 italic">
          "{story.quote}"
        </blockquote>
        <div className="flex items-center gap-2 text-sm text-primary-600">
          <Clock className="w-4 h-4" />
          <span>Found housing in {story.days} days</span>
        </div>
      </div>
    </motion.div>
  )
}

// Feature card with hover effects
const FeatureCard = ({ feature, index }: { feature: any; index: number }) => {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      viewport={{ once: true }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-white rounded-2xl p-6 border border-gray-100 hover:border-primary-200 hover:shadow-xl transition-all duration-300 h-full">
        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 transform transition-transform duration-300 ${isHovered ? 'scale-110 rotate-3' : ''}`}>
          <feature.icon className="w-7 h-7 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
        <p className="text-gray-600">{feature.description}</p>
      </div>
    </motion.div>
  )
}

export default function HomePage() {
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 500], [0, -150])

  const studentStories = [
    {
      name: "María Fernanda",
      university: "Tec de Monterrey",
      semester: "5th Semester",
      avatar: "https://i.pravatar.cc/150?img=1",
      quote: "Encontré roomies que se convirtieron en mis mejores amigas. Ahora no solo compartimos renta, compartimos vida.",
      days: 3
    },
    {
      name: "Carlos Eduardo",
      university: "UDEM",
      semester: "3rd Semester",
      avatar: "https://i.pravatar.cc/150?img=2",
      quote: "El sistema de matching es increíble. Me conectó con personas que tienen mis mismos horarios y hábitos de estudio.",
      days: 5
    },
    {
      name: "Ana Sofía",
      university: "UANL",
      semester: "7th Semester",
      avatar: "https://i.pravatar.cc/150?img=3",
      quote: "Lo que más me gustó fue la seguridad. Todos los perfiles están verificados y pude conocer a mis roomies antes de decidir.",
      days: 2
    }
  ]

  const features = [
    {
      icon: Shield,
      title: "100% Verificado",
      description: "Cada perfil y propiedad pasa por nuestro riguroso proceso de verificación",
      gradient: "from-primary-500 to-primary-600"
    },
    {
      icon: Heart,
      title: "Match Perfecto",
      description: "Nuestro algoritmo encuentra roomies compatibles con tu estilo de vida",
      gradient: "from-accent-500 to-accent-600"
    },
    {
      icon: MapPin,
      title: "Cerca de Todo",
      description: "Propiedades estratégicamente ubicadas cerca de universidades y transporte",
      gradient: "from-primary-400 to-accent-500"
    },
    {
      icon: MessageCircle,
      title: "Chat Seguro",
      description: "Comunícate directamente sin compartir datos personales hasta estar listo",
      gradient: "from-accent-400 to-primary-500"
    },
    {
      icon: Zap,
      title: "Proceso Rápido",
      description: "De la búsqueda a la mudanza en menos de una semana",
      gradient: "from-primary-600 to-primary-500"
    },
    {
      icon: TrendingUp,
      title: "Precios Justos",
      description: "Sin comisiones ocultas, precios transparentes para estudiantes",
      gradient: "from-accent-600 to-accent-500"
    }
  ]

  const lifestyleCategories = [
    { icon: BookOpen, label: "Estudiosos", color: "text-primary-600" },
    { icon: Music, label: "Fiesteros", color: "text-accent-600" },
    { icon: Coffee, label: "Tranquilos", color: "text-primary-500" },
    { icon: Users, label: "Sociales", color: "text-accent-500" }
  ]

  return (
    <div className="min-h-screen bg-cream-50">
      <Header />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Trust Indicators Section */}
      <section className="py-16 px-4 bg-white border-gray-100">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <AnimatedCounter value={1500} suffix="+" />
              <p className="text-gray-600 mt-2">Estudiantes Felices</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <AnimatedCounter value={98} suffix="%" />
              <p className="text-gray-600 mt-2">Satisfacción</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <AnimatedCounter value={3} suffix=" días" />
              <p className="text-gray-600 mt-2">Tiempo Promedio</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <AnimatedCounter value={100} suffix="%" />
              <p className="text-gray-600 mt-2">Perfiles Verificados</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Student Stories Section - Emotional Connection */}
      <section className="py-20 px-4 bg-gradient-to-br from-cream-50 to-primary-50/20 relative overflow-hidden">
        <motion.div 
          style={{ y: parallaxY }}
          className="absolute top-0 right-0 w-96 h-96 bg-accent-200/20 rounded-full blur-3xl"
        />
        <motion.div 
          style={{ y: parallaxY }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl"
        />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Cada Casa Cuenta una Historia
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Miles de estudiantes ya encontraron más que un lugar para vivir. 
              Encontraron amigos, experiencias y su hogar lejos de casa.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {studentStories.map((story, index) => (
              <StoryCard key={index} story={story} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link 
              href="/stories"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold group"
            >
              <span>Ver más historias</span>
              <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Todo lo que Necesitas
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Diseñado por estudiantes, para estudiantes. Cada función pensada para hacer tu vida más fácil.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} feature={feature} index={index} />
            ))}
          </div>
        </div>
      </section>

      {/* Lifestyle Match Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50/50 to-accent-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6">
                Encuentra tu Tribu
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                No solo buscamos que compartas espacio, buscamos que compartas momentos. 
                Nuestro sistema de matching considera tus horarios, hábitos y personalidad.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-8">
                {lifestyleCategories.map((category, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <category.icon className={`w-6 h-6 ${category.color}`} />
                    <span className="font-medium text-gray-800">{category.label}</span>
                  </motion.div>
                ))}
              </div>

              <Link
                href="/roommates"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-2xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Users className="w-5 h-5" />
                <span>Encuentra Roomies</span>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative z-10 bg-white rounded-3xl p-8 shadow-2xl">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-gradient-to-br from-primary-400 to-accent-400 rounded-full flex items-center justify-center">
                      <span className="text-5xl font-black text-white">92%</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Match Rate
                    </div>
                  </div>
                </div>
                <p className="text-center text-gray-700 font-medium">
                  De nuestros usuarios encuentran roomies compatibles en su primera búsqueda
                </p>
              </div>
              <div className="absolute top-4 -left-4 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-60" />
              <div className="absolute bottom-4 -right-4 w-32 h-32 bg-accent-200 rounded-full blur-2xl opacity-60" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-600 to-accent-600 relative overflow-hidden">
        <div className="absolute inset-0 pattern-papel-picado opacity-10" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
              Tu Historia Comienza Aquí
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Únete a miles de estudiantes que ya encontraron su hogar perfecto. 
              Sin comisiones, sin estrés, solo conexiones reales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                Comenzar Gratis
              </Link>
              <Link
                href="/properties"
                className="px-8 py-4 bg-white/20 backdrop-blur-sm text-white font-bold rounded-2xl border-2 border-white/30 hover:bg-white/30 transition-all duration-300"
              >
                Explorar Propiedades
              </Link>
            </div>
            <p className="mt-6 text-white/80 text-sm">
              ✓ Sin tarjeta de crédito &nbsp;&nbsp; ✓ 100% Gratis &nbsp;&nbsp; ✓ Verificación instantánea
            </p>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  )
}