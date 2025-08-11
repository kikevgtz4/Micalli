// components/layout/HeroSection.tsx
"use client"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"
import Link from "next/link"
import { 
  Search, 
  MapPin, 
  Users, 
  Heart, 
  Sparkles, 
  Home,
  Calendar,
  Shield,
  Star,
  ChevronRight,
  Play
} from "lucide-react"

// Typing animation component
const TypingText = ({ texts }: { texts: string[] }) => {
  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    const currentFullText = texts[currentTextIndex]
    
    if (isTyping) {
      if (displayedText.length < currentFullText.length) {
        const timeout = setTimeout(() => {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1))
        }, 100)
        return () => clearTimeout(timeout)
      } else {
        const timeout = setTimeout(() => {
          setIsTyping(false)
        }, 2000)
        return () => clearTimeout(timeout)
      }
    } else {
      if (displayedText.length > 0) {
        const timeout = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1))
        }, 50)
        return () => clearTimeout(timeout)
      } else {
        setCurrentTextIndex((prev) => (prev + 1) % texts.length)
        setIsTyping(true)
      }
    }
  }, [displayedText, isTyping, currentTextIndex, texts])

  return (
    <span className="block text-4xl lg:text-6xl xl:text-7xl font-black bg-gradient-to-r from-accent-500 to-accent-600 bg-clip-text text-transparent">
      {displayedText}
      <span className="text-accent-600 animate-pulse">|</span>
    </span>
  )
}

// Story bubble component
const StoryBubble = ({ story, position, delay }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.6, type: "spring" }}
      className={`absolute ${position} hidden xl:block z-0`}
    >
      <div className="relative group cursor-pointer">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-400/40 to-accent-400/40 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
        <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg max-w-[250px] border border-white/50">
          <div className="flex items-center gap-3 mb-2">
            <img 
              src={story.avatar} 
              alt={story.name}
              className="w-10 h-10 rounded-full object-cover border-2 border-accent-300"
            />
            <div>
              <p className="font-semibold text-sm text-gray-900">{story.name}</p>
              <p className="text-xs text-gray-600">{story.time}</p>
            </div>
          </div>
          <p className="text-sm text-gray-700 italic">"{story.message}"</p>
          <div className="flex items-center gap-1 mt-2">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-3 h-3 fill-accent-400 text-accent-400" />
            ))}
          </div>
        </div>
        
        {/* Bottom navigation hint for mobile */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8 lg:mt-12 text-center lg:hidden"
        >
          <p className="text-sm text-gray-600">
            ¿Primera vez aquí?
          </p>
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 mt-2 text-primary-600 font-medium"
          >
            Aprende cómo funciona
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function HeroSection() {
  const [selectedUniversity, setSelectedUniversity] = useState("")
  const [budget, setBudget] = useState("")
  const [moveInDate, setMoveInDate] = useState("")
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const { scrollY } = useScroll()
  const parallaxY = useTransform(scrollY, [0, 300], [0, -50])

  const typingTexts = [
    "tu nuevo hogar",
    "roomies increíbles", 
    "tu próxima aventura",
    "amigos para toda la vida"
  ]

  const stories = [
    {
      name: "Ana García",
      avatar: "https://i.pravatar.cc/150?img=5",
      message: "Encontré mi depa ideal en 2 días!",
      time: "Hace 3 horas",
      position: "-top-16 -left-24"
    },
    {
      name: "Luis Mendoza", 
      avatar: "https://i.pravatar.cc/150?img=8",
      message: "Mis roomies son los mejores 🎉",
      time: "Hace 5 horas",
      position: "-top-12 -right-20"
    },
    {
      name: "Sofía Ruiz",
      avatar: "https://i.pravatar.cc/150?img=9",
      message: "El proceso fue súper seguro",
      time: "Hace 1 día",
      position: "-bottom-16 -left-16"
    }
  ]

  const universities = [
    { value: "tec", label: "Tec de Monterrey", icon: "🎓" },
    { value: "udem", label: "UDEM", icon: "🏛️" },
    { value: "uanl", label: "UANL", icon: "🦅" },
    { value: "itesm", label: "ITESM", icon: "💙" }
  ]

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (selectedUniversity) params.set("university", selectedUniversity)
    if (budget) params.set("budget", budget)
    if (moveInDate) params.set("moveIn", moveInDate)
    
    window.location.href = `/properties?${params.toString()}`
  }

  return (
    <section className="relative min-h-[100dvh] lg:min-h-screen flex items-center justify-center overflow-hidden pr-6 pl-6 bg-gradient-to-br from-cream-50 via-cream-50 to-primary-50/20">
      {/* Animated background patterns - More subtle */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full pattern-talavera" />
      </div>

      {/* Floating geometric shapes - Reduced opacity */}
      <motion.div
        style={{ y: parallaxY }}
        className="absolute top-20 left-20 w-32 h-32 bg-primary-300/20 rounded-full blur-3xl"
      />
      <motion.div
        style={{ y: parallaxY }}
        className="absolute bottom-40 right-20 w-48 h-48 bg-accent-300/20 rounded-full blur-3xl"
      />

      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20 pb-20 lg:pb-24 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column - Emotional Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left order-1 lg:order-1"
          >
            {/* Trust badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-full mb-8 shadow-lg mx-auto lg:mx-0"
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-bold">
                Plataforma 100% Verificada
              </span>
            </motion.div>

            {/* Main headline with typing effect */}
            <h1 className="text-4xl lg:text-6xl xl:text-7xl font-black leading-tight mb-8">
              <span className="text-gray-900 block mb-3">Encuentra</span>
              <TypingText texts={typingTexts} />
            </h1>

            {/* Mi casa, Mi historia - Enhanced prominence */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="mb-8"
            >
              <div className="inline-block">
                <h2 className="text-3xl lg:text-4xl xl:text-5xl font-black bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Mi casa, Mi historia
                </h2>
                <div className="h-1 w-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full mt-2"></div>
              </div>
            </motion.div>

            <p className="text-lg lg:text-xl text-gray-600 mb-10 max-w-xl leading-relaxed">
              Más que un lugar para vivir. Conectamos estudiantes con hogares y 
              compañeros que transforman su experiencia universitaria.
            </p>

            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 lg:gap-6 mb-6 lg:mb-8 justify-center lg:justify-start">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-700">
                  <span className="font-bold">127</span> estudiantes buscando ahora
                </span>
              </motion.div>
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
              >
                <Home className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-gray-700">
                  <span className="font-bold">450+</span> propiedades verificadas
                </span>
              </motion.div>
            </div>

            {/* Video preview button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="mb-8 lg:mb-0"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="group inline-flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all"
              >
                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
                <span className="font-bold">Ver cómo funciona</span>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Right Column - Search Card */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative order-2 lg:order-2 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
          >
            {/* Story bubbles - Hidden on mobile, visible on lg+ */}
            <div className="hidden xl:block absolute inset-0 pointer-events-none">
              {stories.map((story, index) => (
                <StoryBubble 
                  key={index} 
                  story={story} 
                  position={story.position}
                  delay={0.5 + index * 0.2}
                />
              ))}
            </div>

            {/* Main search card */}
            <motion.div
              whileHover={{ y: -5 }}
              className={`relative bg-white lg:bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl lg:shadow-2xl p-6 lg:p-8 transition-all duration-300 border border-primary-100/50 ${
                isSearchFocused ? "ring-4 ring-primary-200" : ""
              }`}
            >
              {/* Glowing effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 to-accent-400 rounded-2xl blur opacity-10" />
              
              <div className="relative z-10">
                <div className="text-center mb-6">
                  <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                    Comienza tu búsqueda
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600">
                    En promedio, tardas solo <span className="font-bold text-primary-600">3.5 días</span>
                  </p>
                </div>

                <div 
                  className="space-y-3 lg:space-y-4"
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                >
                  {/* University selector */}
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <select
                      value={selectedUniversity}
                      onChange={(e) => setSelectedUniversity(e.target.value)}
                      className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all appearance-none bg-white text-gray-900 font-medium text-sm lg:text-base"
                    >
                      <option value="">Selecciona tu universidad</option>
                      {universities.map((uni) => (
                        <option key={uni.value} value={uni.value}>
                          {uni.label}
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Budget range */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 font-medium text-sm lg:text-base">
                      $
                    </span>
                    <select
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                      className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all appearance-none bg-white text-gray-900 font-medium text-sm lg:text-base"
                    >
                      <option value="">Presupuesto mensual</option>
                      <option value="3000-5000">$3,000 - $5,000 MXN</option>
                      <option value="5000-8000">$5,000 - $8,000 MXN</option>
                      <option value="8000-12000">$8,000 - $12,000 MXN</option>
                      <option value="12000+">$12,000+ MXN</option>
                    </select>
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 lg:w-5 lg:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Move-in date */}
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 lg:w-5 lg:h-5 text-gray-400" />
                    <input
                      type="date"
                      value={moveInDate}
                      onChange={(e) => setMoveInDate(e.target.value)}
                      className="w-full pl-11 lg:pl-12 pr-4 py-3 lg:py-4 border-2 border-gray-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all bg-white text-gray-900 font-medium text-sm lg:text-base"
                      placeholder="Fecha de mudanza"
                    />
                  </div>

                  {/* Search button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSearch}
                    className="w-full py-3 lg:py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 group text-sm lg:text-base"
                  >
                    <Search className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span>Buscar mi hogar ideal</span>
                    <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </div>

                {/* Quick options */}
                <div className="mt-4 lg:mt-6 flex items-center justify-center gap-4 text-xs lg:text-sm">
                  <Link
                    href="/roommates"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium group"
                  >
                    <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>Buscar roomies</span>
                  </Link>
                  <span className="text-gray-300">|</span>
                  <Link
                    href="/how-it-works"
                    className="flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium group"
                  >
                    <Heart className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span>¿Cómo funciona?</span>
                  </Link>
                </div>
              </div>
            </motion.div>

            {/* Trust indicators below card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="mt-4 lg:mt-6 flex items-center justify-center gap-4 lg:gap-6 text-xs lg:text-sm text-gray-600"
            >
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span>100% Gratis</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3 lg:w-4 lg:h-4 text-primary-600" />
                <span>Verificado</span>
              </div>
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-accent-600" />
                <span>Instantáneo</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0 z-0">
  <svg 
    viewBox="0 0 1440 120" 
    className="w-full h-16 lg:h-20 fill-white"
    preserveAspectRatio="none"  // ← Add this
  >
    <path d="M0,20 Q360,60 720,30 T1440,20 L1440,120 L0,120 Z" />
  </svg>
</div>
    </section>
  )
}