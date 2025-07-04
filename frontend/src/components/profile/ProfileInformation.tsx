// Enhanced ProfileInformation.tsx with Date of Birth and improved UI

'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { validation } from '@/utils/validation';
import Link from 'next/link';
import { 
  CalendarIcon, 
  AcademicCapIcon, 
  BuildingOfficeIcon,
  UserGroupIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  gender?: string;
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

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

export default function ProfileInformation() {
  const { user, updateProfile } = useAuth();
  const [formData, setFormData] = useState<ProfileData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
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
  const [profileCompletion, setProfileCompletion] = useState(0);
  
  const currentYear = new Date().getFullYear();
  const graduationYears = Array.from({ length: 15 }, (_, i) => currentYear - 4 + i);

  // Calculate profile completion
  useEffect(() => {
    const calculateCompletion = () => {
      const requiredFields = ['firstName', 'lastName', 'dateOfBirth'];
      const optionalFields = ['phone', 'gender'];
      
      if (user?.userType === 'student') {
        requiredFields.push('university', 'graduationYear', 'program');
      } else if (user?.userType === 'property_owner') {
        requiredFields.push('businessName');
        optionalFields.push('businessRegistration');
      }
      
      const totalFields = requiredFields.length + optionalFields.length;
      let completedFields = 0;
      
      requiredFields.forEach(field => {
        if (formData[field as keyof ProfileData]) completedFields += 1;
      });
      
      optionalFields.forEach(field => {
        if (formData[field as keyof ProfileData]) completedFields += 0.5;
      });
      
      setProfileCompletion(Math.round((completedFields / totalFields) * 100));
    };
    
    calculateCompletion();
  }, [formData, user?.userType]);

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
          dateOfBirth: profile.dateOfBirth || '',
          gender: profile.gender || '',
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
    const currentYear = new Date().getFullYear();

    // Validate required fields
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    
    // Validate date of birth
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const birthDate = new Date(formData.dateOfBirth);
      const age = currentYear - birthDate.getFullYear();
      if (age < 18) {
        newErrors.dateOfBirth = 'You must be at least 18 years old';
      }
      if (age > 100) {
        newErrors.dateOfBirth = 'Please enter a valid date of birth';
      }
    }

    // Validate phone if provided
    if (formData.phone) {
      const phoneResult = validation.phone(formData.phone);
      if (!phoneResult.isValid) {
        newErrors.phone = phoneResult.error || 'Invalid phone number';
      }
    }

    // Student-specific validation
    if (user?.userType === 'student') {
      if (!formData.university) newErrors.university = 'University is required';
      if (!formData.graduationYear) newErrors.graduationYear = 'Graduation year is required';
      if (!formData.program) newErrors.program = 'Program is required';
      
      const minYear = currentYear - 4;
      const maxYear = currentYear + 10;
      
      if (formData.graduationYear && (formData.graduationYear < minYear || formData.graduationYear > maxYear)) {
        newErrors.graduationYear = `Graduation year must be between ${minYear} and ${maxYear}`;
      }
    }

    // Property owner validation
    if (user?.userType === 'property_owner' && !formData.businessName) {
      newErrors.businessName = 'Business name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data for API
      const updateData: any = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone || null,
        date_of_birth: formData.dateOfBirth || null,
        gender: formData.gender || null,
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
          business_registration: formData.businessRegistration || null,
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
      {/* Header with completion status */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-medium text-stone-900">Profile Information</h3>
            <p className="mt-1 text-sm text-stone-600">
              Update your personal information and account details.
            </p>
          </div>
          
          {/* Profile Completion Badge */}
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              profileCompletion >= 90 ? 'bg-green-100 text-green-800' :
              profileCompletion >= 70 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {profileCompletion >= 90 ? (
                <CheckBadgeIcon className="w-4 h-4 mr-1" />
              ) : (
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
              )}
              {profileCompletion}% Complete
            </div>
            
            {user?.userType === 'student' && (
              <Link 
                href="/roommates/profile/edit"
                className="mt-2 block text-xs text-primary-600 hover:text-primary-700"
              >
                Edit Roommate Profile →
              </Link>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-white border border-stone-200 rounded-lg p-6">
          <h4 className="text-base font-medium text-stone-900 mb-4 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-stone-400" />
            Basic Information
          </h4>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-stone-700">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.firstName ? 'border-error-300' : 'border-stone-200'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-error-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-stone-700">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                  errors.lastName ? 'border-error-300' : 'border-stone-200'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-error-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-stone-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 relative">
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date(currentYear - 18, 0, 1).toISOString().split('T')[0]}
                  className={`block w-full pl-10 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.dateOfBirth ? 'border-error-300' : 'border-stone-200'
                  }`}
                />
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-stone-400" />
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-error-600">{errors.dateOfBirth}</p>
              )}
              {formData.dateOfBirth && (
                <p className="mt-1 text-xs text-stone-500">
                  Age: {currentYear - new Date(formData.dateOfBirth).getFullYear()} years
                </p>
              )}
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-stone-700">
                Gender <span className="text-xs text-stone-500">(Optional)</span>
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full border-stone-200 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="">Prefer not to specify</option>
                {GENDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white border border-stone-200 rounded-lg p-6">
          <h4 className="text-base font-medium text-stone-900 mb-4">Contact Information</h4>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
              <p className="mt-1 text-xs text-stone-500">
                Contact support to change your email
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-stone-700">
                Phone Number <span className="text-xs text-stone-500">(Optional)</span>
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
          </div>
        </div>

        {/* Student-specific fields */}
        {user?.userType === 'student' && (
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-stone-900 mb-4 flex items-center">
              <AcademicCapIcon className="w-5 h-5 mr-2 text-stone-400" />
              Academic Information
            </h4>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-stone-700">
                  University <span className="text-red-500">*</span>
                </label>
                <select
                  id="university"
                  name="university"
                  value={formData.university || ''}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.university ? 'border-error-300' : 'border-stone-200'
                  }`}
                >
                  <option value="">Select a university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
                {errors.university && (
                  <p className="mt-1 text-sm text-error-600">{errors.university}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-stone-700">
                    Expected Graduation Year <span className="text-red-500">*</span>
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
                    Program/Major <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                      errors.program ? 'border-error-300' : 'border-stone-200'
                    }`}
                    placeholder="e.g., Computer Science"
                  />
                  {errors.program && (
                    <p className="mt-1 text-sm text-error-600">{errors.program}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Owner-specific fields */}
        {user?.userType === 'property_owner' && (
          <div className="bg-white border border-stone-200 rounded-lg p-6">
            <h4 className="text-base font-medium text-stone-900 mb-4 flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 mr-2 text-stone-400" />
              Business Information
            </h4>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-stone-700">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="businessName"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                    errors.businessName ? 'border-error-300' : 'border-stone-200'
                  }`}
                  placeholder="Your business or company name"
                />
                {errors.businessName && (
                  <p className="mt-1 text-sm text-error-600">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessRegistration" className="block text-sm font-medium text-stone-700">
                  Business Registration Number <span className="text-xs text-stone-500">(Optional)</span>
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
                <p className="mt-1 text-xs text-stone-500">
                  Providing this helps verify your business
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-500">
            <span className="text-red-500">*</span> Required fields
          </div>
          
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-500 hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}