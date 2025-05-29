// frontend/src/app/page.tsx - Updated Hero Section
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useInView } from "react-intersection-observer"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/layout/HeroSection"

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div ref={ref} className={`${className} ${inView ? "animate-slide-up-fade" : "opacity-0"}`}>
      {children}
    </div>
  )
}

function FloatingCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <div 
      className="animate-float"
      style={{ animationDelay: `${delay}s`, animationDuration: '4s' }}
    >
      {children}
    </div>
  )
}

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)
  const [searchData, setSearchData] = useState({
    university: '',
    budget: ''
  })
  const [isSearchFocused, setIsSearchFocused] = useState(false)

  const testimonials = [
    {
      text: "Found my perfect roommate in just 3 days! The matching system is incredible 🎯",
      author: "Sofia García",
      university: "Tec de Monterrey",
      avatar: "👩‍🎓"
    },
    {
      text: "Super easy to find affordable housing near campus. Saved me so much time! ⏰",
      author: "Carlos Mendoza",
      university: "UANL",
      avatar: "👨‍🎓"
    },
    {
      text: "Love how verified everything is. Felt safe throughout the whole process 🛡️",
      author: "Ana Rodríguez",
      university: "UDEM",
      avatar: "👩‍💼"
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [testimonials.length])

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchData.university) params.set('university', searchData.university)
    if (searchData.budget) params.set('budget', searchData.budget)

      // Would navigate to /properties with params
    console.log(`Searching with: ${params.toString()}`)
    
    window.location.href = `/properties?${params.toString()}`
  }

  return (
    <div className="min-h-screen bg-neutral-50">
<Header />
      
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center text-4xl font-bold mb-12">
            <h2 className="font-bold mb-4">Why Students Love Roomigo 💚</h2>
            <p className="text-xl text-neutral-600">Everything you need for the perfect student living</p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "🛡️",
                title: "100% Verified",
                description: "All properties and users are verified for your safety",
                color: "primary"
              },
              {
                icon: "🎯",
                title: "Smart Matching",
                description: "AI-powered roommate matching based on your lifestyle",
                color: "secondary"
              },
              {
                icon: "📍",
                title: "Near Campus",
                description: "Find housing walking distance from your university",
                color: "accent"
              },
              {
                icon: "💬",
                title: "Easy Communication",
                description: "Chat directly with landlords and potential roommates",
                color: "highlight"
              },
              {
                icon: "💰",
                title: "Student Prices",
                description: "Affordable options designed for student budgets",
                color: "primary"
              },
              {
                icon: "⚡",
                title: "Quick Process",
                description: "From search to move-in in less than a week",
                color: "secondary"
              }
            ].map((feature, index) => (
              <AnimatedSection key={index} className={`animation-delay-${index * 100}`}>
                <div className={`bg-white rounded-2xl p-6 shadow-lg border-2 border-transparent hover:border-${feature.color}-500 transition-all hover-lift-rotate card-hover-green`}>
                  <div className="text-5xl mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-neutral-600">{feature.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-accent-50">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection className="text-center text-4xl mb-12">
            <h2 className="text-4xl font-bold mb-4">Students Love Us 💕</h2>
          </AnimatedSection>

          <div className="relative h-48">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-all duration-500 ${
                  index === currentTestimonial ? "opacity-100 scale-100" : "opacity-0 scale-95"
                }`}
              >
                <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                  <div className="text-4xl mb-4">{testimonial.avatar}</div>
                  <p className="text-lg mb-4 italic">"{testimonial.text}"</p>
                  <p className="font-semibold">{testimonial.author}</p>
                  <p className="text-neutral-600">{testimonial.university}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-center space-x-2 mt-6">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentTestimonial ? "w-8 bg-primary-500" : "bg-neutral-300"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
<section className="py-20 px-4 bg-gradient-to-br from-primary-50 to-white">
  <div className="max-w-7xl mx-auto">
    <div className="grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-4xl font-bold text-neutral-900 mb-6">
          Start Your Journey to Better Student Living
        </h2>
        <p className="text-xl text-neutral-600 mb-8">
          Whether you're looking for the perfect room or the ideal roommate, 
          we make the process simple, safe, and stress-free.
        </p>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="ml-3 text-neutral-700">Verified listings from trusted landlords</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="ml-3 text-neutral-700">Smart roommate matching algorithm</p>
          </div>
          <div className="flex items-start">
            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="ml-3 text-neutral-700">Secure messaging and booking system</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-8">
          <Link
            href="/signup"
            className="px-8 py-3 bg-gradient-primary text-white font-semibold rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
          >
            Create Free Account
          </Link>
          <Link
            href="/how-it-works"
            className="px-8 py-3 border-2 border-primary-600 text-primary-600 font-semibold rounded-full hover:bg-primary-50 transition-all"
          >
            Learn More
          </Link>
        </div>
      </div>
      <div className="relative">
        <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl p-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-4 transform rotate-2 hover:rotate-0 transition-transform">
            <p className="text-sm text-neutral-600 mb-2">Average time to find a room</p>
            <p className="text-3xl font-bold text-primary-600">3.5 days</p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg transform -rotate-2 hover:rotate-0 transition-transform">
            <p className="text-sm text-neutral-600 mb-2">Student satisfaction rate</p>
            <p className="text-3xl font-bold text-primary-600">98%</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

      <Footer />
    </div>
  )
}