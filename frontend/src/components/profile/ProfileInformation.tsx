// frontend/src/components/profile/ProfileInformation.tsx
'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { validation } from '@/utils/validation';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  university?: number;
  graduationYear?: number;
  program?: string;
  businessName?: string;
  businessRegistration?: string;
}

interface University {
  id: number;
  name: string;
}

export default function ProfileInformation() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    university: undefined,
    graduationYear: undefined,
    program: '',
    businessName: '',
    businessRegistration: '',
  });
  const [universities, setUniversities] = useState<University[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 10 }, (_, i) => currentYear + i);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Load universities for student users
        if (user?.userType === 'student') {
          const universitiesResponse = await apiService.universities.getAll();
          setUniversities(universitiesResponse.data.results || universitiesResponse.data);
        }
        
        // Load current profile data
        const profileResponse = await apiService.auth.getProfile();
        const profile = profileResponse.data;
        
        setFormData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          phone: profile.phone || '',
          university: profile.university?.id,
          graduationYear: profile.graduationYear,
          program: profile.program || '',
          businessName: profile.businessName || '',
          businessRegistration: profile.businessRegistration || '',
        });
      } catch (error) {
        console.error('Failed to load profile data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'university' || name === 'graduationYear' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate phone if provided
    if (formData.phone) {
      const phoneResult = validation.phone(formData.phone);
      if (!phoneResult.isValid) {
        newErrors.phone = phoneResult.error || 'Invalid phone number';
      }
    }

    // Student-specific validation
    if (user?.userType === 'student') {
      if (formData.graduationYear && (formData.graduationYear < 2020 || formData.graduationYear > 2030)) {
        newErrors.graduationYear = 'Graduation year must be between 2020 and 2030';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data for API (exclude email as it's read-only)
      const updateData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      };

      // Add user-type specific fields
      if (user?.userType === 'student') {
        Object.assign(updateData, {
          university: formData.university,
          graduation_year: formData.graduationYear,
          program: formData.program,
        });
      } else if (user?.userType === 'property_owner') {
        Object.assign(updateData, {
          business_name: formData.businessName,
          business_registration: formData.businessRegistration,
        });
      }

      await apiService.auth.updateProfile(updateData);
      
      // Update auth context
      await updateProfile(updateData);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update profile';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-stone-900">Profile Information</h3>
        <p className="mt-1 text-sm text-stone-600">
          Update your personal information and account details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-stone-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-stone-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-stone-700">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            disabled
            className="mt-1 block w-full border-stone-200 rounded-md shadow-sm bg-stone-50 text-stone-500 sm:text-sm"
          />
          <p className="mt-2 text-sm text-stone-500">
            Email cannot be changed here. Contact support if you need to update your email.
          </p>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
              errors.phone ? 'border-error-300' : 'border-stone-200'
            }`}
            placeholder="+52 (81) 1234-5678"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-error-600">{errors.phone}</p>
          )}
        </div>

        {/* Student-specific fields */}
        {user?.userType === 'student' && (
  <>
    <div>
      <label htmlFor="university" className="block text-sm font-medium text-stone-700">
        University
      </label>
      <select
        id="university"
        name="university"
        value={formData.university || ''}
        onChange={handleChange}
        className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
      >
        <option value="">Select a university</option>
        {universities.map((uni) => (
          <option key={uni.id} value={uni.id}>
            {uni.name}
          </option>
        ))}
      </select>
    </div>

    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
      <div>
        <label htmlFor="graduationYear" className="block text-sm font-medium text-stone-700">
          Expected Graduation Year
        </label>
        <select
          id="graduationYear"
          name="graduationYear"
          value={formData.graduationYear || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
            errors.graduationYear ? 'border-error-300' : 'border-stone-200'
          }`}
        >
          <option value="">Select graduation year</option>
          {graduationYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        {errors.graduationYear && (
          <p className="mt-1 text-sm text-error-600">{errors.graduationYear}</p>
        )}
      </div>

      <div>
        <label htmlFor="program" className="block text-sm font-medium text-stone-700">
          Program/Major
        </label>
        <input
          type="text"
          id="program"
          name="program"
          value={formData.program}
          onChange={handleChange}
          className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          placeholder="e.g., Computer Science"
        />
      </div>
    </div>
  </>
)}

        {/* Property Owner-specific fields */}
        {user?.userType === 'property_owner' && (
          <>
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-stone-700">
                Business Name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Your business or company name"
              />
            </div>

            <div>
              <label htmlFor="businessRegistration" className="block text-sm font-medium text-stone-700">
                Business Registration Number
              </label>
              <input
                type="text"
                id="businessRegistration"
                name="businessRegistration"
                value={formData.businessRegistration}
                onChange={handleChange}
                className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Business registration or tax ID"
              />
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}