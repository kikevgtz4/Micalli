"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Floating Card Component with improved animations
interface FloatingCardProps {
 children: React.ReactNode;
 delay?: number;
 className?: string;
}
const FloatingCard = ({ children, delay = 0, className = "" }: FloatingCardProps) => (
  <div
    className={`animate-float ${className}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: "6s",
      animationIterationCount: "infinite",
    }}
  >
    {children}
  </div>
)

export default function HeroSection() {
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [searchData, setSearchData] = useState({
    university: "",
    budget: "",
  })

  const handleSearch = () => {
    console.log("Search initiated:", searchData)
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden bg-gradient-to-br from-white via-emerald-50/30 to-yellow-50/40">
        {/* Enhanced Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-emerald-400/15 to-emerald-600/8 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-yellow-400/15 to-yellow-600/8 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: "2s" }}
          ></div>

          {/* Subtle geometric elements */}
          <div
            className="absolute top-20 right-20 w-3 h-3 bg-emerald-500/60 rounded-full animate-bounce"
            style={{ animationDelay: "0.5s" }}
          ></div>
          <div className="absolute top-40 left-1/4 w-2 h-2 bg-yellow-500/60 rotate-45 animate-pulse"></div>
          <div
            className="absolute bottom-1/3 right-1/3 w-1 h-12 bg-gradient-to-b from-emerald-500/60 to-yellow-500/60 animate-bounce"
            style={{ animationDelay: "1s" }}
          ></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            {/* Left Column - Enhanced Content */}
            <div className="text-center lg:text-left space-y-10">
              {/* Premium Badge */}
              <div className="inline-flex items-center">
                <Badge className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-yellow-500 text-white rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300 border-0">
                  <span className="mr-1">✨</span>
                  #1 Student Housing Platform in Monterrey
                  <span className="ml-1">🚀</span>
                </Badge>
              </div>

              {/* Enhanced Headline */}
              <div className="space-y-6 text-center">
                <h1 className="text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight">
                  <span className="block text-5xl text-gray-900 mb-2 font-black leading-[0.9] tracking-tight">Find Your</span>
                  <span className="block bg-gradient-to-r from-green-500 via-green-600 to-green-700 bg-clip-text text-transparent text-5xl lg:text-7xl font-black leading-[0.9] tracking-tight">
                    Perfect Match
                  </span>
                  <span className="block text-3xl lg:text-4xl font-bold text-gray-700 mb-2">Room + Roommate</span>
                </h1>

                <p className="text-xl pl-2 lg:text-2xl text-gray-600 max-w-2xl leading-relaxed text-center xl:text-left">
                  Join{" "}
                  <span className="font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">1,500+ students</span> who
                  found their ideal living situation in
                  <span className="font-bold text-orange-500"> record time</span> 🏆
                </p>
              </div>

              {/* Enhanced Stats Grid */}
              <div className="grid grid-cols-3 gap-8 max-w-md mx-auto lg:mx-0">
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="text-3xl font-black text-emerald-600 mb-1">3.5</div>
                  <div className="text-sm text-gray-600 font-medium">days avg. to find room</div>
                </div>
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="text-3xl font-black text-emerald-600 mb-1">98%</div>
                  <div className="text-sm text-gray-600 font-medium">satisfaction rate</div>
                </div>
                <div className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-emerald-100 shadow-sm">
                  <div className="text-3xl font-black text-emerald-600 mb-1">100%</div>
                  <div className="text-sm text-gray-600 font-medium">verified listings</div>
                </div>
              </div>

              {/* Enhanced CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  size="lg"
                  className="group relative px-8 py-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg border-0"
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-xl">🏠</span>
                    <span>Find Your Room</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-300 text-xl">
                      →
                    </span>
                  </span>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="px-8 py-6 bg-white/90 backdrop-blur-sm border-2 border-purple-500 text-purple-600 font-bold rounded-2xl hover:bg-purple-50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-lg"
                >
                  <span className="flex items-center space-x-3">
                    <span className="text-xl">👥</span>
                    <span>Find Roommates</span>
                  </span>
                </Button>
              </div>
            </div>

            {/* Right Column - Search Card with Scattered Floating Elements */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-md">
                {/* Main Search Card */}
                <Card
                  className={`relative z-20 bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl border-2 border-emerald-100 p-8 transform transition-all duration-300 ${isSearchFocused ? "scale-105 shadow-3xl border-emerald-300" : ""}`}
                >
                  {/* Glowing effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-3xl blur opacity-20 animate-pulse"></div>

                  <CardContent className="relative z-10 p-0">
                    {/* Header */}
                    <div className="text-center font-bold text-xl mb-8">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-400 to-yellow-400 rounded-full mb-4 shadow-lg">
                        <span className="text-2xl">🔍</span>
                      </div>
                      <h3 className="font-black text-2xl text-gray-900 mb-2">Start Your Search</h3>
                      <p className="text-gray-600 font-medium">Find your perfect room in seconds</p>
                    </div>

                    {/* Live Activity */}
                    <div className="flex items-center justify-center mb-8 px-4 py-3 bg-emerald-50 rounded-full border border-emerald-200">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-sm text-emerald-700 font-semibold">12 students searching now</span>
                    </div>



                <FloatingCard delay={2.5}>
                  <div className="absolute -top-75 -left-20 transform -translate-x-1/2 w-36 bg-orange-50/95 backdrop-blur-sm rounded-2xl p-3 shadow-xl border border-orange-200/50 z-40">
                    <div className="text-center">
                      <div className="text-lg mb-1">🔥
                        <p className="font-bold text-orange-800 text-lg">Hot Deals</p>
                      <p className="text-orange-600 text-xs">updated daily</p>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                {/* Top Right - Testimonial with slight overlap */}
                <FloatingCard delay={1}>
                  <div className="absolute -top-81 left-70 w-52 bg-pink-50/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-pink-200/50 z-50">
                    <div className="flex items-center space-x-2">
                      <div className="text-lg">💬</div>
                      <div>
                        <p className="font-bold text-pink-800 text-sm">"Found my dream room!"</p>
                        <p className="text-pink-600 text-xs">- Maria, UANL</p>
                      </div>
                    </div>
                  </div>
                </FloatingCard>

                {/* Bottom Right - New listings */}
                <FloatingCard delay={3}>
                  <div className="absolute -bottom-83 right-10 w-48 bg-blue-50/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-blue-200/50 z-40">
                    <div className="text-center">
                      <p className="font-bold text-lg text-blue-800">🏠 New Listings</p>
                      <p className="text-blue-600 text-xs">added every week</p>
                    </div>
                  </div>
                </FloatingCard>


                    {/* Enhanced Form */}
                    <div
                      className="space-y-6"
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                    >
                      <div className="relative">
                        <select
                          className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700 font-semibold appearance-none bg-white shadow-sm hover:shadow-md text-base"
                          value={searchData.university}
                          onChange={(e) => setSearchData((prev) => ({ ...prev, university: e.target.value }))}
                        >
                          <option value="">🎓 Select Your University</option>
                          <option value="tec">🏛️ Tec de Monterrey</option>
                          <option value="uanl">🏫 UANL</option>
                          <option value="udem">🎨 UDEM</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      <div className="relative">
                        <select
                          className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-gray-700 font-semibold appearance-none bg-white shadow-sm hover:shadow-md text-base"
                          value={searchData.budget}
                          onChange={(e) => setSearchData((prev) => ({ ...prev, budget: e.target.value }))}
                        >
                          <option value="">💰 Your Budget Range</option>
                          <option value="3000-5000">💵 $3,000 - $5,000 MXN</option>
                          <option value="5000-8000">💸 $5,000 - $8,000 MXN</option>
                          <option value="8000+">💎 $8,000+ MXN</option>
                        </select>
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      <Button
                        onClick={handleSearch}
                        className="group w-full px-6 py-4 bg-gradient-to-r from-emerald-500 to-yellow-500 hover:from-emerald-600 hover:to-yellow-600 text-white font-bold rounded-xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 text-lg border-0"
                      >
                        <span className="flex items-center justify-center space-x-2">
                          <span>🚀 Search Perfect Rooms</span>
                          <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                        </span>
                      </Button>
                    </div>

                    {/* Trust Indicators */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <div className="grid grid-cols-3 gap-4 text-center text-sm">
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-500 text-lg mb-1">✓</span>
                          <span className="text-gray-600 font-medium">100% Free</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-500 text-lg mb-1">✓</span>
                          <span className="text-gray-600 font-medium">Verified</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-emerald-500 text-lg mb-1">✓</span>
                          <span className="text-gray-600 font-medium">Instant</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
