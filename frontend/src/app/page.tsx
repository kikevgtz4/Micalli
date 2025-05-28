"use client"
import { useState, useEffect } from "react"
import type React from "react"

import Link from "next/link"
import { useInView } from "react-intersection-observer"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

// Animation wrapper component
function AnimatedSection({
  children,
  className = "",
  animation = "animate-slide-in-up",
}: {
  children: React.ReactNode
  className?: string
  animation?: string
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div ref={ref} className={`${className} ${inView ? animation : "opacity-0"}`}>
      {children}
    </div>
  )
}

// Counter animation component
function CountUp({ end, duration = 2000 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const { ref, inView } = useInView({ triggerOnce: true })

  useEffect(() => {
    if (!inView) return

    let startTime: number
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      setCount(Math.floor(progress * end))
      if (progress < 1) {
        requestAnimationFrame(step)
      }
    }
    requestAnimationFrame(step)
  }, [end, duration, inView])

  return <span ref={ref}>{count.toLocaleString()}</span>
}

// Hero Section Component
function HeroSection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden min-h-screen flex items-center">
      {/* Animated background */}
      <div className="absolute inset-0 pattern-dots opacity-5"></div>
      <div
        className="absolute inset-0 opacity-30 transition-all duration-300"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(20, 184, 166, 0.15) 0%, transparent 50%)`,
        }}
      />

      <div className="max-w-7xl mx-auto relative z-10 w-full">
        <div className="text-center">
          <AnimatedSection animation="animate-slide-in-down">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block gradient-text">Student Home</span>
              <span className="block text-3xl md:text-4xl text-neutral-600 dark:text-neutral-400 font-normal mt-4">
                in Monterrey, Mexico
              </span>
            </h1>
          </AnimatedSection>

          <AnimatedSection animation="animate-fade-in" className="animation-delay-200">
            <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect with verified properties near your university. Safe, affordable, and designed for student life.
              Join thousands of students who've found their perfect home through UniHousing.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="animate-bounce-in" className="animation-delay-300">
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/properties"
                className="group bg-gradient-primary text-white px-8 py-4 rounded-full text-lg font-medium hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 inline-flex items-center justify-center btn-press"
              >
                Browse Properties
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                href="/roommates"
                className="group bg-white dark:bg-neutral-800 border-2 border-primary-500 text-primary-600 dark:text-primary-400 px-8 py-4 rounded-full text-lg font-medium hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:shadow-lg transform hover:-translate-y-1 transition-all duration-300 btn-press"
              >
                Find Roommates
              </Link>
            </div>
          </AnimatedSection>

          {/* Quick stats */}
          <AnimatedSection animation="animate-scale-in" className="animation-delay-500">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {[
                { number: 500, label: "Properties", suffix: "+" },
                { number: 15, label: "Universities", suffix: "" },
                { number: 2000, label: "Students", suffix: "+" },
                { number: 98, label: "Satisfaction", suffix: "%" },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl md:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                    <CountUp end={stat.number} />
                    {stat.suffix}
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 dark:bg-primary-800 rounded-full blur-3xl animate-float opacity-60"></div>
      <div className="absolute bottom-20 right-10 w-32 h-32 bg-secondary-200 dark:bg-secondary-800 rounded-full blur-3xl animate-float animation-delay-1000 opacity-60"></div>
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-accent-200 dark:bg-accent-800 rounded-full blur-2xl animate-float animation-delay-500 opacity-40"></div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface dark:bg-neutral-900">
      <Header />

      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 px-4 bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">Why Choose UniHousing?</h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">
              Everything you need for the perfect student living experience
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                ),
                title: "Verified & Safe",
                description: "All properties and owners are thoroughly verified for your safety and peace of mind.",
                gradient: "from-primary-400 to-primary-600",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ),
                title: "University Proximity",
                description: "Find housing with detailed distance information to your campus and amenities.",
                gradient: "from-secondary-400 to-secondary-600",
              },
              {
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                ),
                title: "Roommate Matching",
                description: "Connect with compatible roommates based on lifestyle and study preferences.",
                gradient: "from-accent-400 to-accent-600",
              },
            ].map((feature, index) => (
              <AnimatedSection key={index} animation="animate-slide-in-up" className={`animation-delay-${index * 100}`}>
                <div className="group card hover-lift p-8">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform duration-300`}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-neutral-900 dark:text-neutral-100">{feature.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white dark:bg-neutral-900">
        <div className="max-w-7xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">How It Works</h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Get started in just a few simple steps</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-4 gap-8 relative">
            {/* Connection line */}
            <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200"></div>

            {[
              { step: 1, title: "Sign Up", description: "Create your free account as a student or property owner" },
              { step: 2, title: "Browse", description: "Explore verified properties near your university" },
              { step: 3, title: "Connect", description: "Message owners and schedule viewings" },
              { step: 4, title: "Move In", description: "Secure your perfect student home" },
            ].map((item, index) => (
              <AnimatedSection
                key={index}
                animation="animate-scale-in"
                className={`relative animation-delay-${index * 150}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 relative z-10 hover:scale-110 transition-transform duration-300 hover-lift">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-neutral-900 dark:text-neutral-100">{item.title}</h3>
                  <p className="text-neutral-600 dark:text-neutral-400">{item.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-neutral-50 dark:bg-neutral-800">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">What Students Say</h2>
            <p className="text-xl text-neutral-600 dark:text-neutral-400">Join thousands of satisfied students</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "María González",
                university: "Tec de Monterrey",
                text: "Found my perfect apartment in just 2 days! The verification process gave me peace of mind.",
                rating: 5,
                avatar: "/placeholder.svg?height=60&width=60",
              },
              {
                name: "Carlos Rodríguez",
                university: "UANL",
                text: "The roommate matching feature helped me find the perfect study partner and friend.",
                rating: 5,
                avatar: "/placeholder.svg?height=60&width=60",
              },
              {
                name: "Ana Martínez",
                university: "UDEM",
                text: "Great platform! The distance calculator saved me so much time in my search.",
                rating: 5,
                avatar: "/placeholder.svg?height=60&width=60",
              },
            ].map((testimonial, index) => (
              <AnimatedSection key={index} animation="animate-slide-in-up" className={`animation-delay-${index * 100}`}>
                <div className="card hover-lift p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-neutral-700 dark:text-neutral-300 mb-4 italic">"{testimonial.text}"</p>
                  <div className="flex items-center">
                    <img
                      src={testimonial.avatar || "/placeholder.svg"}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">{testimonial.name}</p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">{testimonial.university}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="bg-gradient-primary rounded-3xl p-12 text-center text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 pattern-dots"></div>
              <div className="relative z-10">
                <h2 className="text-4xl font-bold mb-4">Ready to Find Your New Home?</h2>
                <p className="text-xl mb-8 text-white/90">
                  Join thousands of students who've found their perfect housing through UniHousing
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/signup"
                    className="bg-white text-primary-600 px-8 py-4 rounded-full text-lg font-medium hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 btn-press"
                  >
                    Get Started Free
                  </Link>
                  <Link
                    href="/properties"
                    className="bg-white/20 backdrop-blur text-white border-2 border-white/50 px-8 py-4 rounded-full text-lg font-medium hover:bg-white/30 transform hover:-translate-y-1 transition-all duration-300 btn-press"
                  >
                    Browse Properties
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Footer />
    </div>
  )
}
