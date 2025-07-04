// frontend/src/app/(main)/roommates/profile/[id]/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import apiService from "@/lib/api";
import { RoommateProfile } from "@/types/api";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  FlagIcon,
  ChatBubbleLeftIcon,
  CheckBadgeIcon,
  MapPinIcon,
  AcademicCapIcon,
  CalendarIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { getImageUrl } from "@/utils/imageUrls";
import { formatters } from "@/utils/formatters";
import { toast } from "react-hot-toast";

export default function RoommateProfileDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<RoommateProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingImage, setReportingImage] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/roommates/profile/${id}`);
      return;
    }

    const loadProfile = async () => {
      try {
        const response = await apiService.roommates.getProfile(Number(id));
        setProfile(response.data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile");
        router.push("/roommates");
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [id, isAuthenticated, router]);

  const handlePreviousImage = () => {
    if (!profile?.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? profile.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    if (!profile?.images) return;
    setCurrentImageIndex((prev) => 
      prev === profile.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleReportImage = async (imageId: number, reason: string, description: string) => {
    try {
      await apiService.roommates.reportImage({
        imageId,
        reason: reason as any,
        description,
      });
      toast.success("Report submitted successfully");
      setShowReportModal(false);
      setReportingImage(null);
    } catch (error) {
      toast.error("Failed to submit report");
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return null;
  }

  const images = profile.images.length > 0 
    ? profile.images 
    : [{ 
        id: 0, 
        url: getImageUrl(profile.user.profilePicture), 
        isPrimary: true,
        order: 0
      }];

  const isOwnProfile = user?.id === profile.user.id;

  return (
    <MainLayout>
      <div className="min-h-screen bg-stone-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
            Back to matches
          </button>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Images */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Main Image */}
                <div className="relative aspect-[4/3] bg-stone-100">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentImageIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={images[currentImageIndex].url || '/placeholder-property.jpg'}
                        alt={`${profile.user.firstName}'s photo`}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={() => setShowImageModal(true)}
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Navigation */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronLeftIcon className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <ChevronRightIcon className="w-6 h-6" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {currentImageIndex + 1} / {images.length}
                  </div>

                  {/* Report button */}
                  {!isOwnProfile && (
                    <button
                      onClick={() => {
                        setReportingImage(images[currentImageIndex].id);
                        setShowReportModal(true);
                      }}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                    >
                      <FlagIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="p-4 flex gap-2 overflow-x-auto">
                    {images.map((image, idx) => (
                      <button
                        key={image.id}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 ${
                          idx === currentImageIndex
                            ? 'ring-2 ring-primary-500'
                            : 'opacity-70 hover:opacity-100'
                        }`}
                      >
                        <Image
                          src={image.url || '/placeholder-property.jpg'}
                          alt={`Thumbnail ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* About Section */}
              <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-stone-900 mb-4">About</h2>
                <p className="text-stone-600 whitespace-pre-wrap">
                  {profile.bio || "No bio provided yet."}
                </p>
              </div>

              {/* Interests Section */}
              {(profile.hobbies.length > 0 || profile.socialActivities.length > 0) && (
                <div className="mt-6 bg-white rounded-2xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-stone-900 mb-4">
                    Interests & Activities
                  </h2>
                  
                  {profile.hobbies.length > 0 && (
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-stone-700 mb-2">Hobbies</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.hobbies.map((hobby, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                          >
                            {hobby}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {profile.socialActivities.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-stone-700 mb-2">Social Activities</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.socialActivities.map((activity, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-sm"
                          >
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column - Profile Info */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-6">
                {/* Basic Info */}
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-stone-900 flex items-center justify-center gap-2">
                    {profile.user.firstName} {profile.user.lastName?.[0]}.
                    {profile.user.studentIdVerified && (
                      <CheckBadgeIcon className="w-6 h-6 text-primary-500" />
                    )}
                  </h1>
                  
                  {/* Match Score if available */}
                  {/* TODO: Add match score from API */}
                  
                  <div className="mt-4 space-y-2">
                    <p className="flex items-center justify-center gap-2 text-stone-600">
                      <AcademicCapIcon className="w-5 h-5" />
                      {profile.major || "Student"}
                    </p>
                    {profile.university && (
                      <p className="flex items-center justify-center gap-2 text-stone-600">
                        <MapPinIcon className="w-5 h-5" />
                        {profile.university.name}
                      </p>
                    )}
                    {profile.graduationYear && (
                      <p className="flex items-center justify-center gap-2 text-stone-600">
                        <CalendarIcon className="w-5 h-5" />
                        Class of {profile.graduationYear}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-stone-200">
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {profile.sleepSchedule === 'early_bird' ? '🌅' : 
                       profile.sleepSchedule === 'night_owl' ? '🌙' : '😴'}
                    </div>
                    <p className="text-sm text-stone-600">
                      {profile.sleepSchedule?.replace('_', ' ') || 'Sleep'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {["🌪️", "🧹", "✨", "🌟", "💎"][profile.cleanliness ? profile.cleanliness - 1 : 2]}
                    </div>
                    <p className="text-sm text-stone-600">
                      Cleanliness {profile.cleanliness || '?'}/5
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {profile.petFriendly ? '🐾' : '🚫'}
                    </div>
                    <p className="text-sm text-stone-600">
                      {profile.petFriendly ? 'Pet Friendly' : 'No Pets'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl mb-1">
                      {profile.smokingAllowed ? '🚬' : '🚭'}
                    </div>
                    <p className="text-sm text-stone-600">
                      {profile.smokingAllowed ? 'Smoking OK' : 'No Smoking'}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  {isOwnProfile ? (
                    <button
                      onClick={() => router.push('/roommates/profile/edit')}
                      className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {/* TODO: Implement messaging */}}
                        className="w-full py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        Send Message
                      </button>
                      <button
                        onClick={() => setShowReportModal(true)}
                        className="w-full py-3 border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <FlagIcon className="w-5 h-5" />
                        Report Profile
                      </button>
                    </>
                  )}
                </div>

                {/* Additional Info */}
                <div className="mt-6 pt-6 border-t border-stone-200 space-y-3">
                  {profile.languages.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-stone-700 mb-1">Languages</p>
                      <p className="text-sm text-stone-600">
                        {profile.languages.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  {profile.dietaryRestrictions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-stone-700 mb-1">Dietary</p>
                      <p className="text-sm text-stone-600">
                        {profile.dietaryRestrictions.join(', ')}
                      </p>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium text-stone-700 mb-1">Looking for</p>
                    <p className="text-sm text-stone-600">
                      {profile.preferredRoommateCount === 1 
                        ? '1 roommate' 
                        : `${profile.preferredRoommateCount} roommates`}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImageModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setShowImageModal(false)}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
            
            <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
              <Image
                src={images[currentImageIndex].url || '/placeholder-property.jpg'}
                alt={`${profile.user.firstName}'s photo`}
                fill
                className="object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Modal Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviousImage();
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronLeftIcon className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextImage();
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                >
                  <ChevronRightIcon className="w-8 h-8" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-stone-900 mb-4">
              Report {reportingImage ? 'Image' : 'Profile'}
            </h3>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const reason = formData.get('reason') as string;
                const description = formData.get('description') as string;
                
                if (reportingImage) {
                  handleReportImage(reportingImage, reason, description);
                } else {
                  // TODO: Implement profile reporting
                  toast.error("Profile reporting not yet implemented");
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Reason
                </label>
                <select
                  name="reason"
                  required
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select a reason</option>
                  <option value="inappropriate">Inappropriate content</option>
                  <option value="fake">Fake or misleading</option>
                  <option value="offensive">Offensive content</option>
                  <option value="spam">Spam or advertisement</option>
                  <option value="other">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Additional Details (Optional)
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Please provide more details about your report..."
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowReportModal(false);
                    setReportingImage(null);
                  }}
                  className="flex-1 py-2 border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
                >
                  Submit Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}