// frontend/src/components/profile/PasswordChange.tsx
'use client';
import { useState } from 'react';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { validation, validatePasswordConfirmation } from '@/utils/validation';
import PasswordStrengthIndicator from '@/components/common/PasswordStrengthIndicator';
import {
  LockClosedIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  FingerPrintIcon,
} from '@heroicons/react/24/outline';

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordChange() {
  const [formData, setFormData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setPasswordChangeSuccess(false);
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Real-time validation for new password
    if (name === 'newPassword' && value) {
      const result = validation.password(value);
      if (!result.isValid) {
        setErrors(prev => ({ ...prev, newPassword: result.error || '' }));
      }
    }

    // Real-time validation for password confirmation
    if (name === 'confirmPassword' && value && formData.newPassword) {
      const result = validatePasswordConfirmation(formData.newPassword, value);
      if (!result.isValid) {
        setErrors(prev => ({ ...prev, confirmPassword: result.error || '' }));
      }
    }
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate current password
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    // Validate new password
    const passwordResult = validation.password(formData.newPassword);
    if (!passwordResult.isValid) {
      newErrors.newPassword = passwordResult.error || 'Invalid password';
    }

    // Validate password confirmation
    const confirmResult = validatePasswordConfirmation(formData.newPassword, formData.confirmPassword);
    if (!confirmResult.isValid) {
      newErrors.confirmPassword = confirmResult.error || 'Passwords do not match';
    }

    // Check if new password is different from current
    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'New password must be different from current password';
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
      setIsSubmitting(true);
      
      await apiService.auth.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setPasswordChangeSuccess(true);
      toast.success('Password changed successfully!');
    } catch (error: any) {
      console.error('Password change error:', error);
      
      if (error.response?.data) {
        const errorData = error.response.data;
        const newErrors: Record<string, string> = {};
        
        Object.entries(errorData).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            newErrors[key] = typeof value[0] === 'string' ? value[0] : value[0].toString();
          } else if (typeof value === 'string') {
            newErrors[key] = value;
          }
        });
        
        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
        } else {
          toast.error('Password change failed. Please check your input.');
        }
      } else {
        const errorMessage = error.response?.data?.detail || 'Failed to change password';
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate password requirements met
  const passwordRequirements = [
    { met: formData.newPassword.length >= 8, text: 'At least 8 characters' },
    { met: /[A-Z]/.test(formData.newPassword), text: 'One uppercase letter' },
    { met: /[a-z]/.test(formData.newPassword), text: 'One lowercase letter' },
    { met: /\d/.test(formData.newPassword), text: 'One number' },
    { met: /[^A-Za-z0-9]/.test(formData.newPassword), text: 'One special character' },
  ];

  const requirementsMet = passwordRequirements.filter(req => req.met).length;
  const allRequirementsMet = requirementsMet === passwordRequirements.length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-stone-900">Security Settings</h3>
            <p className="mt-1 text-sm text-stone-600">
              Manage your password and security preferences to keep your account safe.
            </p>
          </div>
          <div className="flex items-center bg-stone-100 rounded-full px-4 py-2">
            <ShieldCheckIcon className="w-5 h-5 text-stone-600 mr-2" />
            <span className="text-sm font-medium text-stone-700">Protected</span>
          </div>
        </div>
      </div>

      {/* Success Message */}
      {passwordChangeSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start animate-fadeIn">
          <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-green-800">Password Updated Successfully</h4>
            <p className="mt-1 text-sm text-green-700">
              Your password has been changed. Use your new password for your next login.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Current Password Section */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-stone-100 rounded-lg mr-3">
              <KeyIcon className="w-5 h-5 text-stone-600" />
            </div>
            <h4 className="text-lg font-medium text-stone-900">Verify Your Identity</h4>
          </div>

          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-stone-700 mb-2">
              Current Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon 
                  className={`h-5 w-5 transition-colors ${
                    focusedField === 'currentPassword' ? 'text-primary-500' : 'text-stone-400'
                  }`} 
                />
              </div>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                onFocus={() => setFocusedField('currentPassword')}
                onBlur={() => setFocusedField(null)}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                  errors.currentPassword 
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                    : 'border-stone-200 focus:border-primary-500 focus:ring-primary-500/20'
                } focus:ring-2 transition-all`}
                placeholder="Enter your current password"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                )}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-2 text-sm text-red-600 flex items-center">
                <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                {errors.currentPassword}
              </p>
            )}
          </div>
        </div>

        {/* New Password Section */}
        <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="p-2 bg-primary-100 rounded-lg mr-3">
              <FingerPrintIcon className="w-5 h-5 text-primary-600" />
            </div>
            <h4 className="text-lg font-medium text-stone-900">Create New Password</h4>
          </div>

          <div className="space-y-6">
            {/* New Password Field */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-stone-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon 
                    className={`h-5 w-5 transition-colors ${
                      focusedField === 'newPassword' ? 'text-primary-500' : 'text-stone-400'
                    }`} 
                  />
                </div>
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  id="newPassword"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('newPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    errors.newPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : 'border-stone-200 focus:border-primary-500 focus:ring-primary-500/20'
                  } focus:ring-2 transition-all`}
                  placeholder="Create a strong password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('new')}
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.newPassword}
                </p>
              )}
              
              {/* Password Strength Indicator */}
              {formData.newPassword && (
                <div className="mt-3">
                  <PasswordStrengthIndicator password={formData.newPassword} />
                  
                  {/* Requirements Checklist */}
                  <div className="mt-3 bg-stone-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-stone-700 mb-2">Password Requirements:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {passwordRequirements.map((req, index) => (
                        <div key={index} className="flex items-center text-xs">
                          {req.met ? (
                            <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1.5" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-stone-300 mr-1.5" />
                          )}
                          <span className={req.met ? 'text-green-700' : 'text-stone-500'}>
                            {req.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-stone-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon 
                    className={`h-5 w-5 transition-colors ${
                      focusedField === 'confirmPassword' ? 'text-primary-500' : 'text-stone-400'
                    }`} 
                  />
                </div>
                <input
                  type={showPasswords.confirm ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('confirmPassword')}
                  onBlur={() => setFocusedField(null)}
                  className={`w-full pl-10 pr-10 py-2.5 rounded-lg border ${
                    errors.confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20' 
                      : formData.confirmPassword && formData.newPassword === formData.confirmPassword
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : 'border-stone-200 focus:border-primary-500 focus:ring-primary-500/20'
                  } focus:ring-2 transition-all`}
                  placeholder="Re-enter your new password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => togglePasswordVisibility('confirm')}
                >
                  {showPasswords.confirm ? (
                    <EyeSlashIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-stone-400 hover:text-stone-600 transition-colors" />
                  )}
                </button>
                {formData.confirmPassword && formData.newPassword === formData.confirmPassword && (
                  <CheckCircleIcon className="absolute right-10 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                )}
              </div>
              {errors.confirmPassword && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Security Tips */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-3 flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                Security Best Practices
              </h4>
              <ul className="text-sm text-blue-800 space-y-1.5">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Use a unique password that you don't use on other websites</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Consider using a trusted password manager to generate and store passwords</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>Change your password regularly, especially if you suspect unauthorized access</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-stone-500">
            Last password change: Never
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
            className={`inline-flex items-center px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-all ${
              isSubmitting || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword
                ? 'bg-stone-300 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md hover:shadow-lg transform hover:scale-[1.02]'
            }`}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Updating Password...
              </>
            ) : (
              <>
                <LockClosedIcon className="w-4 h-4 mr-2" />
                Update Password
              </>
            )}
          </button>
        </div>
      </form>

      {/* Additional Security Options */}
      <div className="mt-8 bg-stone-50 border border-stone-200 rounded-xl p-6">
        <h4 className="text-sm font-medium text-stone-900 mb-4">Additional Security Options</h4>
        <div className="space-y-3">
          <button className="w-full text-left px-4 py-3 bg-white rounded-lg border border-stone-200 hover:border-stone-300 transition-colors flex items-center justify-between group">
            <div className="flex items-center">
              <ShieldCheckIcon className="w-5 h-5 text-stone-500 mr-3" />
              <div>
                <p className="text-sm font-medium text-stone-900">Two-Factor Authentication</p>
                <p className="text-xs text-stone-500">Add an extra layer of security to your account</p>
              </div>
            </div>
            <span className="text-xs text-primary-600 group-hover:text-primary-700">Coming Soon</span>
          </button>
          
          
        </div>
      </div>
    </div>
  );
}