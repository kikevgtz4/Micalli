// frontend/src/app/(main)/properties/page.tsx
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import MainLayout from "@/components/layout/MainLayout"
import PropertyCard from "@/components/property/PropertyCard"
import PropertyMap from "@/components/map/PropertyMap"
import apiService from "@/lib/api"
import { useInView } from "react-intersection-observer"

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid")
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: "",
    university: "",
    minPrice: "",
    maxPrice: "",
    propertyType: "",
    bedrooms: "",
    furnished: false,
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setIsLoading(true)
      const response = await apiService.properties.getAll()
      const activeProperties = response.data.filter((prop: any) => prop.isActive)
      setProperties(activeProperties)
    } catch (error) {
      console.error("Failed to fetch properties:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredProperties = properties.filter((property) => {
    if (filters.search && !property.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !property.address.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    if (filters.minPrice && property.rentAmount < parseInt(filters.minPrice)) return false
    if (filters.maxPrice && property.rentAmount > parseInt(filters.maxPrice)) return false
    if (filters.propertyType && property.propertyType !== filters.propertyType) return false
    if (filters.bedrooms && property.bedrooms !== parseInt(filters.bedrooms)) return false
    if (filters.furnished && !property.furnished) return false
    return true
  })

  return (
    <MainLayout>
      <div className="bg-neutral-50 min-h-screen">
        {/* Header */}
        <div className="bg-white border-b sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Search bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by location, property name..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <svg className="absolute left-3 top-3.5 w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Filters
                  {Object.values(filters).filter(v => v && v !== "").length > 0 && (
                    <span className="px-2 py-0.5 bg-primary-600 text-white text-xs rounded-full">
                      {Object.values(filters).filter(v => v && v !== "").length}
                    </span>
                  )}
                </button>

                <div className="flex bg-neutral-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      viewMode === "grid" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("map")}
                    className={`px-3 py-1.5 rounded-md transition-all ${
                      viewMode === "map" ? "bg-white shadow-sm" : ""
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Filters panel */}
            {showFilters && (
              <div className="mt-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  <select
                    value={filters.university}
                    onChange={(e) => setFilters({ ...filters, university: e.target.value })}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Universities</option>
                    <option value="tec">Tec de Monterrey</option>
                    <option value="uanl">UANL</option>
                    <option value="udem">UDEM</option>
                  </select>

                  <select
                    value={filters.propertyType}
                    onChange={(e) => setFilters({ ...filters, propertyType: e.target.value })}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">All Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="studio">Studio</option>
                    <option value="room">Room</option>
                  </select>

                  <select
                    value={filters.bedrooms}
                    onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value })}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Any Bedrooms</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>

                  <input
                    type="number"
                    placeholder="Min Price"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <input
                    type="number"
                    placeholder="Max Price"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="px-3 py-2 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />

                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.furnished}
                      onChange={(e) => setFilters({ ...filters, furnished: e.target.checked })}
                      className="rounded text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-neutral-700">Furnished Only</span>
                  </label>
                </div>

                <div className="mt-4 flex justify-between">
                  <button
                    onClick={() => setFilters({
                      search: "",
                      university: "",
                      minPrice: "",
                      maxPrice: "",
                      propertyType: "",
                      bedrooms: "",
                      furnished: false,
                    })}
                    className="text-sm text-neutral-600 hover:text-neutral-900"
                  >
                    Clear all filters
                  </button>
                  <p className="text-sm text-neutral-600">
                    {filteredProperties.length} properties found
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-neutral-200 rounded-2xl h-64"></div>
                  <div className="p-5 space-y-3">
                    <div className="h-4 bg-neutral-200 rounded w-3/4"></div>
                    <div className="h-3 bg-neutral-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  id={property.id}
                  title={property.title}
                  address={property.address}
                  price={property.rentAmount}
                  bedrooms={property.bedrooms}
                  bathrooms={property.bathrooms}
                  imageUrl={property.images?.[0]?.image}
                  isVerified={property.isVerified}
                  furnished={property.furnished}
                  totalArea={property.totalArea}
                  availableFrom={property.availableFrom}
                  universityDistance={
                    property.universityProximities?.[0]
                      ? `${property.universityProximities[0].distanceInMeters}m from ${property.universityProximities[0].university.name}`
                      : undefined
                  }
                />
              ))}
            </div>
          ) : (
            <div className="h-[calc(100vh-200px)]">
              <PropertyMap
                properties={filteredProperties.filter(p => p.latitude && p.longitude).map(p => ({
                  id: p.id,
                  title: p.title,
                  latitude: p.latitude,
                  longitude: p.longitude,
                  price: p.rentAmount,
                }))}
                onMarkerClick={(id) => router.push(`/properties/${id}`)}
              />
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}