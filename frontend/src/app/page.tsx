// frontend/src/app/page.tsx
"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useInView } from "react-intersection-observer"
import Header from "@/components/layout/Header"
import Footer from "@/components/layout/Footer"

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

export default function HomePage() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0)

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

  return (
    <div className="min-h-screen bg-neutral-50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary-200 rounded-full blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-200 rounded-full blur-3xl opacity-30 animate-float-random"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-highlight-200 rounded-full blur-3xl opacity-20 animate-pulse"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Find Your Perfect
              <span className="block bg-gradient-warm bg-clip-text text-transparent animate-gradient">
                Student Room & Roomie
              </span>
            </h1>
            
            <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
              🏠 Verified housing + 👥 Compatible roommates = Your best student life in Monterrey!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link
                href="/properties"
                className="group relative px-8 py-4 bg-gradient-primary text-white font-medium rounded-full hover:shadow-2xl transform hover:-translate-y-1 transition-all overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center space-x-2">
                  <span>Find a Room</span>
                  <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-warm opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
              
              <Link
                href="/roommates"
                className="px-8 py-4 bg-white border-2 border-primary-500 text-primary-600 font-medium rounded-full hover:bg-primary-50 hover:shadow-xl transform hover:-translate-y-1 transition-all"
              >
                Find Roommates 👥
              </Link>
            </div>

            {/* Quick search */}
            <div className="max-w-2xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-neutral-100">
                <div className="flex flex-col md:flex-row gap-4">
                  <select className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors">
                    <option>🎓 Select University</option>
                    <option>Tec de Monterrey</option>
                    <option>UANL</option>
                    <option>UDEM</option>
                  </select>
                  <select className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:border-primary-500 transition-colors">
                    <option>💰 Budget Range</option>
                    <option>$3,000 - $5,000 MXN</option>
                    <option>$5,000 - $8,000 MXN</option>
                    <option>$8,000+ MXN</option>
                  </select>
                  <button className="px-8 py-3 bg-gradient-warm text-white font-medium rounded-xl hover:shadow-lg transform hover:scale-105 transition-all">
                    Search 🔍
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <AnimatedSection className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Why Students Love Roomigo 💚</h2>
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
          <AnimatedSection className="text-center mb-12">
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