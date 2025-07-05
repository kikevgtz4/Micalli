// frontend/src/components/profile/ProfileInformation.tsx
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
  ExclamationTriangleIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserIcon,
  BriefcaseIcon,
  DocumentTextIcon,
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
  { value: 'male', label: 'Male', icon: '♂️' },
  { value: 'female', label: 'Female', icon: '♀️' },
  { value: 'other', label: 'Other', icon: '⚧️' },
  { value: '', label: 'Prefer not to specify', icon: '🤐' },
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
  const [hasChanges, setHasChanges] = useState(false);
  
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
        
        const loadedData = {
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
        };
        
        setFormData(loadedData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'university' || name === 'graduationYear' 
        ? (value ? parseInt(value) : undefined)
        : value
    }));
    
    setHasChanges(true);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleGenderSelect = (value: string) => {
    setFormData(prev => ({ ...prev, gender: value }));
    setHasChanges(true);
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
      
      // The API interceptor will automatically convert to snake_case
      const updateData: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null,
      };

      // Add user-type specific fields
      if (user?.userType === 'student') {
        Object.assign(updateData, {
          university: formData.university,
          graduationYear: formData.graduationYear,
          program: formData.program,
        });
      } else if (user?.userType === 'property_owner') {
        Object.assign(updateData, {
          businessName: formData.businessName,
          businessRegistration: formData.businessRegistration || null,
        });
      }

      // Send the update request
      await apiService.auth.updateProfile(updateData);
      
      // Update auth context
      await updateProfile(updateData);
      
      setHasChanges(false);
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

  const currentAge = formData.dateOfBirth 
    ? currentYear - new Date(formData.dateOfBirth).getFullYear()
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header with completion status */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-stone-900">Profile Information</h3>
            <p className="mt-1 text-sm text-stone-600">
              Update your personal information and account details.
            </p>
          </div>
          
          {/* Profile Completion Progress */}
          <div className="text-right">
            <div className="text-sm text-stone-600 mb-1">Profile Completion</div>
            <div className="w-32">
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xl font-bold text-stone-900">{profileCompletion}%</span>
                {profileCompletion >= 90 ? (
                  <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
                )}
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    profileCompletion >= 90
                      ? 'bg-green-500'
                      : profileCompletion >= 70
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>
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

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-medium text-stone-900 mb-6 flex items-center">
            <UserGroupIcon className="w-5 h-5 mr-2 text-primary-500" />
            Basic Information
          </h4>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-stone-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.firstName ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                  } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                  placeholder="Enter your first name"
                />
                <UserIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-stone-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.lastName ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                  } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                  placeholder="Enter your last name"
                />
                <UserIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-stone-700 mb-1">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  max={new Date(currentYear - 18, 0, 1).toISOString().split('T')[0]}
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                    errors.dateOfBirth ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                  } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                />
                <CalendarIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
              {currentAge !== null && (
                <p className="mt-1 text-xs text-stone-500">
                  Current age: {currentAge} years old
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Gender <span className="text-xs text-stone-500">(Optional)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleGenderSelect(option.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      formData.gender === option.value
                        ? 'border-primary-500 bg-primary-50 text-primary-700'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    <span className="mr-1">{option.icon}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information Section */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <h4 className="text-lg font-medium text-stone-900 mb-6">Contact Information</h4>
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-stone-200 bg-stone-50 text-stone-500"
                />
                <EnvelopeIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Contact support to change your email
              </p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-stone-700 mb-1">
                Phone Number <span className="text-xs text-stone-500">(Optional)</span>
              </label>
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                    errors.phone ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                  } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                  placeholder="+52 (81) 1234-5678"
                />
                <PhoneIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
          </div>
        </div>

        {/* Student-specific fields */}
        {user?.userType === 'student' && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-stone-900 mb-6 flex items-center">
              <AcademicCapIcon className="w-5 h-5 mr-2 text-primary-500" />
              Academic Information
            </h4>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="university" className="block text-sm font-medium text-stone-700 mb-1">
                  University <span className="text-red-500">*</span>
                </label>
                <select
                  id="university"
                  name="university"
                  value={formData.university || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 rounded-lg border ${
                    errors.university ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                  } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                >
                  <option value="">Select a university</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
                {errors.university && (
                  <p className="mt-1 text-sm text-red-600">{errors.university}</p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label htmlFor="graduationYear" className="block text-sm font-medium text-stone-700 mb-1">
                    Expected Graduation Year <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="graduationYear"
                    name="graduationYear"
                    value={formData.graduationYear || ''}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.graduationYear ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                    } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                  >
                    <option value="">Select graduation year</option>
                    {graduationYears.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  {errors.graduationYear && (
                    <p className="mt-1 text-sm text-red-600">{errors.graduationYear}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="program" className="block text-sm font-medium text-stone-700 mb-1">
                    Program/Major <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="program"
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 rounded-lg border ${
                      errors.program ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                    } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                    placeholder="e.g., Computer Science"
                  />
                  {errors.program && (
                    <p className="mt-1 text-sm text-red-600">{errors.program}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Property Owner-specific fields */}
        {user?.userType === 'property_owner' && (
          <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
            <h4 className="text-lg font-medium text-stone-900 mb-6 flex items-center">
              <BuildingOfficeIcon className="w-5 h-5 mr-2 text-primary-500" />
              Business Information
            </h4>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-stone-700 mb-1">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="businessName"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 pr-10 rounded-lg border ${
                      errors.businessName ? 'border-red-300 focus:border-red-500' : 'border-stone-200 focus:border-primary-500'
                    } focus:ring-2 focus:ring-primary-500/20 transition-colors`}
                    placeholder="Your business or company name"
                  />
                  <BriefcaseIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
                </div>
                {errors.businessName && (
                  <p className="mt-1 text-sm text-red-600">{errors.businessName}</p>
                )}
              </div>

              <div>
                <label htmlFor="businessRegistration" className="block text-sm font-medium text-stone-700 mb-1">
                  Business Registration Number <span className="text-xs text-stone-500">(Optional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    id="businessRegistration"
                    name="businessRegistration"
                    value={formData.businessRegistration}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 pr-10 rounded-lg border border-stone-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-colors"
                    placeholder="Business registration or tax ID"
                  />
                  <DocumentTextIcon className="absolute right-3 top-3 w-5 h-5 text-stone-400" />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  Providing this helps verify your business
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-stone-500">
            <span className="text-red-500">*</span> Required fields
          </div>
          
          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600">You have unsaved changes</span>
            )}
            <button
              type="submit"
              disabled={isSaving || !hasChanges}
              className={`inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
                hasChanges && !isSaving
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md'
                  : 'bg-stone-300 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}