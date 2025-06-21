"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import UniversitySearchDropdown from '@/components/roommates/UniversitySearchDropdown';
import apiService from '@/lib/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AcademicCapIcon, CalendarIcon } from '@heroicons/react/24/outline';

export default function UniversityOnboardingPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  interface FormData {
    university: number | undefined;
    graduationYear: number;
  }
  
  const [formData, setFormData] = useState<FormData>({
    university: undefined,
    graduationYear: new Date().getFullYear() + 4,
  });

  useEffect(() => {
    // Redirect if not a student or already has university
    if (!user) {
      router.push('/login');
    } else if (user.userType !== 'student') {
      router.push('/dashboard');
    } else if (user.university) {
      router.push('/properties');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.university) {
      toast.error('Please select your university');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiService.auth.updateProfile({
        university: formData.university!,  // We know it's defined at this point
        graduationYear: formData.graduationYear,
      });
      
      // Update the user context
      await updateProfile({
        university: formData.university!,
        graduationYear: formData.graduationYear,
      });
      
      toast.success('Welcome to UniHousing! 🎉');
      router.push('/properties');
    } catch (error) {
      toast.error('Failed to save university info');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate year options (current year to +6 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => currentYear + i);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <AcademicCapIcon className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-stone-900 mb-2">
            Welcome, {user?.firstName}! 🎓
          </h1>
          <p className="text-stone-600">
            Let's connect you with housing near your university
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Which university do you attend?
            </label>
            <UniversitySearchDropdown
              value={formData.university}
              onChange={(value: number | undefined) => setFormData({ ...formData, university: value })}
              placeholder="Search for your university..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">
              Expected graduation year
            </label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <select
                value={formData.graduationYear}
                onChange={(e) => setFormData({ ...formData, graduationYear: parseInt(e.target.value) })}
                className="w-full pl-10 pr-4 py-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                required
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !formData.university}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Start Browsing Properties →'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}