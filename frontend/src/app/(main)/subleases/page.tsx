// frontend/src/app/(main)/subleases/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import SubleaseCard from "@/components/subleases/SubleaseCard";
import SubleaseFilters from "@/components/subleases/SubleaseFilters";
import { useSubleases } from "@/hooks/subleases/useSubleases";
import { SubleaseFilters as SubleaseFiltersType } from "@/types/sublease";
import apiService from "@/lib/api";
import {
  HomeIcon,
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  Squares2X2Icon,
  Bars3Icon,
  MapIcon,
  UserGroupIcon,
  FunnelIcon,
  Cog6ToothIcon, // Add this for manage icon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

const SORT_OPTIONS = [
  { value: 'newest', label: 'Most Recent' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'urgency', label: 'Most Urgent' },
  { value: 'duration_asc', label: 'Shortest Duration' },
  { value: 'duration_desc', label: 'Longest Duration' },
  { value: 'start_date', label: 'Available Soonest' },
];

export default function SubleasesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  // State Management
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [searchQuery, setSearchQuery] = useState("");
  const [hasActiveSublease, setHasActiveSublease] = useState(false);
  const [isCheckingUserSublease, setIsCheckingUserSublease] = useState(true);
  
  // Filters state
  const [filters, setFilters] = useState<SubleaseFiltersType>({
    search: '',
    ordering: 'newest',
  });

  // Check if user has an active sublease
  useEffect(() => {
    const checkUserSublease = async () => {
      if (!isAuthenticated || user?.userType !== 'student') {
        setIsCheckingUserSublease(false);
        return;
      }

      try {
        const response = await apiService.subleases.getMySubleases();
        const activeSubleases = response.data.results.filter(
          (s: any) => s.status === 'active' || s.status === 'pending'
        );
        setHasActiveSublease(activeSubleases.length > 0);
      } catch (error) {
        console.error('Failed to check user subleases:', error);
      } finally {
        setIsCheckingUserSublease(false);
      }
    };

    checkUserSublease();
  }, [isAuthenticated, user]);

  // Update filter function
  const updateFilter = <K extends keyof SubleaseFiltersType>(
    key: K,
    value: SubleaseFiltersType[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      search: key === 'search' ? value as string : prev.search,
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: searchQuery, // Keep search query
      ordering: 'newest',
    });
  };

  // Use subleases hook with filters
  const {
    subleases,
    isLoading,
    stats,
    hasNext,
    hasPrevious,
    currentPage,
    goToPage,
    nextPage,
    previousPage,
  } = useSubleases({
    filters: {
      ...filters,
      search: searchQuery || filters.search,
    },
    autoFetch: true,
  });

  // Handle save sublease
  const handleSaveSublease = async (id: number) => {
    if (!isAuthenticated) {
      toast("Please login to save subleases", {
        icon: "🔒",
      });
      router.push("/login");
      return false;
    }

    try {
      const response = await apiService.subleases.toggleSave(id);
      toast.success(
        response.data.isSaved ? "Sublease saved!" : "Removed from saved"
      );
      return response.data.isSaved;
    } catch (error) {
      console.error("Failed to save sublease:", error);
      toast.error("Error saving sublease");
      return false;
    }
  };

  // Handle sublease button click (create or manage)
  const handleSubleaseAction = () => {
    if (!isAuthenticated) {
      toast("Please login to create a sublease", {
        icon: "🔒",
      });
      router.push("/login?redirect=/subleases/create");
      return;
    }

    if (user?.userType !== 'student') {
      toast("Only students can create subleases", {
        icon: "📚",
      });
      return;
    }

    if (hasActiveSublease) {
      // Redirect to profile dashboard tab
      router.push('/profile#dashboard');
      // You might want to add a success toast
      toast.success("Redirecting to your profile", {
        icon: "🏠",
      });
    } else {
      // Redirect to create sublease
      router.push('/subleases/create');
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-gray-50 pt-16">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Sublease Opportunities
                </h1>
                <p className="mt-2 text-gray-600">
                  Find temporary housing solutions in Monterrey
                </p>
              </div>
              
              {/* Quick Navigation */}
              <div className="mt-4 md:mt-0 flex gap-3">
                <button
                  onClick={() => router.push('/roommates')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <UserGroupIcon className="w-4 h-4" />
                  Find Roommates
                </button>
                {isAuthenticated && user?.userType === 'student' && !isCheckingUserSublease && (
                  <button
                    onClick={handleSubleaseAction}
                    className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors ${
                      hasActiveSublease 
                        ? 'bg-primary-600 hover:bg-primary-700'
                        : 'bg-primary-600 hover:bg-primary-700'
                    }`}
                  >
                    {hasActiveSublease ? (
                      <>
                        <Cog6ToothIcon className="w-4 h-4" />
                        Manage Sublease
                      </>
                    ) : (
                      <>
                        <PlusIcon className="w-4 h-4" />
                        Post Sublease
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Search and Controls Bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateFilter('search', searchQuery);
                    }
                  }}
                  placeholder="Search by location, type, or amenities..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2">
                {/* Filters Button */}
                <button
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setShowMobileFilters(!showMobileFilters);
                    } else {
                      setShowFilters(!showFilters);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
                    showFilters || showMobileFilters
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <FunnelIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Filters</span>
                  {Object.keys(filters).filter(k => k !== 'ordering' && k !== 'search' && filters[k as keyof SubleaseFiltersType]).length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                      {Object.keys(filters).filter(k => k !== 'ordering' && k !== 'search' && filters[k as keyof SubleaseFiltersType]).length}
                    </span>
                  )}
                </button>

                {/* View Mode Toggle */}
                <div className="flex bg-white border border-gray-200 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2.5 rounded-l-lg ${
                      viewMode === 'grid'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2.5 ${
                      viewMode === 'list'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <Bars3Icon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('map')}
                    className={`p-2.5 rounded-r-lg ${
                      viewMode === 'map'
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <MapIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <select
                  value={filters.ordering || 'newest'}
                  onChange={(e) => updateFilter('ordering', e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex gap-6">
            {/* Desktop Filters Sidebar */}
            {showFilters && (
              <div className="hidden lg:block w-80 flex-shrink-0">
                <div className="sticky top-28">
                  <SubleaseFilters
                    filters={filters}
                    onFilterChange={updateFilter}
                    onClearFilters={clearFilters}
                  />
                </div>
              </div>
            )}

            {/* Mobile Filters Drawer */}
            <AnimatePresence>
              {showMobileFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowMobileFilters(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                  />
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    className="lg:hidden fixed left-0 top-0 h-full w-80 bg-white z-50 overflow-y-auto"
                  >
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Filters</h3>
                        <button
                          onClick={() => setShowMobileFilters(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <SubleaseFilters
                        filters={filters}
                        onFilterChange={updateFilter}
                        onClearFilters={clearFilters}
                      />
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Content Area */}
            <div className="flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  {stats?.totalCount || 0} subleases available
                </p>
                {/* Pagination Info */}
                {stats && stats.totalPages > 1 && (
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {stats.totalPages}
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-2xl aspect-[4/3]"></div>
                    </div>
                  ))}
                </div>
              ) : subleases.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl">
                  <HomeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">
                    No subleases available
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try adjusting your filters or check back later
                  </p>
                  {isAuthenticated && user?.userType === 'student' && !hasActiveSublease && (
                    <button
                      onClick={handleSubleaseAction}
                      className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Post the First Sublease
                    </button>
                  )}
                </div>
              ) : viewMode === 'map' ? (
                <div className="h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <MapIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Map view coming soon</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Switch to grid or list view to browse subleases
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`grid gap-6 ${
                  viewMode === 'grid'
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1'
                }`}>
                  {subleases.map((sublease) => (
                    <SubleaseCard
                      key={sublease.id}
                      sublease={sublease}
                      onSave={handleSaveSublease}
                      variant={viewMode}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!isLoading && stats && stats.totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={previousPage}
                    disabled={!hasPrevious}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex gap-1">
                    {[...Array(Math.min(5, stats.totalPages))].map((_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-primary-600 text-white'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={nextPage}
                    disabled={!hasNext}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}