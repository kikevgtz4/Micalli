import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/lib/api';
import { RoommateProfile, University } from '@/types/api';
import { toast } from 'react-hot-toast';

interface WizardStep {
  id: string;
  title: string;
  description: string;
  fields: string[];
  required: boolean;
}

interface ProfileCompletionWizardProps {
  onComplete?: () => void;
  onSkip?: () => void;
  initialData?: Partial<RoommateProfile> | null;
  isEditing?: boolean;
}

type RoommateProfilePayload = Omit<Partial<RoommateProfile>, 'university'> & {
  university?: number;
};

const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'basics',
    title: 'Basic Information',
    description: 'Tell us about your university and living preferences',
    fields: ['university', 'major', 'year', 'preferredRoommateCount'],
    required: true
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle Preferences',
    description: 'Help us understand your daily habits',
    fields: ['sleepSchedule', 'cleanliness', 'noiseTolerance', 'guestPolicy'],
    required: true
  },
  {
    id: 'compatibility',
    title: 'Compatibility Factors',
    description: 'Important preferences for finding the right match',
    fields: ['smokingAllowed', 'petFriendly', 'preferredRoommateGender', 'ageRangeMin', 'ageRangeMax'],
    required: true
  },
  {
    id: 'interests',
    title: 'Interests & Activities',
    description: 'Share your hobbies and social preferences',
    fields: ['hobbies', 'socialActivities', 'studyHabits'],
    required: false
  },
  {
    id: 'additional',
    title: 'Additional Information',
    description: 'Any other details that might help find your perfect roommate',
    fields: ['languages', 'dietaryRestrictions', 'bio'],
    required: false
  }
];

export default function ProfileCompletionWizard({
  onComplete,
  onSkip,
  initialData,
  isEditing = false
}: ProfileCompletionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [profile, setProfile] = useState<Partial<RoommateProfile>>(initialData || {});
  const [isLoading, setIsLoading] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const router = useRouter();
  const [universities, setUniversities] = useState<University[]>([]);

  // Load universities in useEffect
  useEffect(() => {
    loadUniversities();
  }, []);

  const loadUniversities = async () => {
    try {
      const response = await apiService.universities.getAll();
      // Handle different response formats
      if (Array.isArray(response.data)) {
        setUniversities(response.data);
      } else if (response.data.results) {
        setUniversities(response.data.results);
      } else {
        setUniversities([]);
      }
    } catch (error) {
      console.error('Failed to load universities:', error);
    }
  };

  useEffect(() => {
    if (!initialData && !isEditing) {
      loadProfile();
    }
  }, [initialData, isEditing]);

  useEffect(() => {
    calculateCompletion();
  }, [profile]);

  const loadProfile = async () => {
    try {
      const response = await apiService.roommates.getMyProfile();
      setProfile(response.data);
      
      // Find the first incomplete required step
      const firstIncompleteStep = WIZARD_STEPS.findIndex(step => 
        step.required && !isStepComplete(step, response.data)
      );
      
      setCurrentStep(firstIncompleteStep >= 0 ? firstIncompleteStep : 0);
    } catch (error) {
      console.error('Failed to load profile:', error);
      // If profile doesn't exist, start from beginning
      setCurrentStep(0);
    }
  };

  const calculateCompletion = () => {
    const totalFields = WIZARD_STEPS.flatMap(step => step.fields).length;
    const completedFields = WIZARD_STEPS.flatMap(step => step.fields)
      .filter(field => {
        const value = profile[field as keyof RoommateProfile];
        return value !== null && value !== undefined && 
               (Array.isArray(value) ? value.length > 0 : true);
      }).length;
    
    setCompletionPercentage(Math.round((completedFields / totalFields) * 100));
  };

  const isStepComplete = (step: WizardStep, data: any = profile): boolean => {
    return step.fields.every(field => {
      const value = data[field];
      return value !== null && value !== undefined && 
             (Array.isArray(value) ? value.length > 0 : true);
    });
  };

  const handleNext = async () => {
    if (currentStep < WIZARD_STEPS.length - 1) {
      // Save current step data
      await saveProfile();
      setCurrentStep(currentStep + 1);
    } else {
      // Complete wizard
      await saveProfile();
      if (onComplete) {
        onComplete();
      } else {
        router.push('/roommates');
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkipStep = () => {
    const currentStepData = WIZARD_STEPS[currentStep];
    if (!currentStepData.required) {
      handleNext();
    }
  };

  const handleSkipAll = () => {
    if (onSkip) {
      onSkip();
    } else {
      router.push('/roommates');
    }
  };

  const saveProfile = async () => {
    try {
      setIsLoading(true);
      
      // Create properly typed payload
      const dataToSend: RoommateProfilePayload = {
        ...profile,
        university: typeof profile.university === 'object' 
          ? profile.university.id 
          : profile.university as number | undefined
      };
      
      if (isEditing) {
        await apiService.roommates.updateProfile(dataToSend as any);
      } else {
        await apiService.roommates.createOrUpdateProfile(dataToSend as any);
      }
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const renderStepContent = () => {
    const step = WIZARD_STEPS[currentStep];
    
    return (
      <div className="space-y-6">
        {step.fields.map(field => (
          <div key={field} className="animate-fade-in">
            {renderField(field)}
          </div>
        ))}
      </div>
    );
  };

  const renderField = (field: string) => {
    // Implement field renderers based on field type
    // This would include all the form inputs for each field
    switch (field) {
      // Step 1: Basic Information Fields
    case 'university':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            University
          </label>
          <select
            value={profile.university?.id || ''}
            onChange={(e) => updateField('university', e.target.value ? parseInt(e.target.value) : null)}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Select your university</option>
            {universities.map((uni) => (
              <option key={uni.id} value={uni.id}>
                {uni.name}
              </option>
            ))}
          </select>
        </div>
      );

    case 'major':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Major / Field of Study
          </label>
          <input
            type="text"
            value={profile.major || ''}
            onChange={(e) => updateField('major', e.target.value)}
            placeholder="e.g., Computer Science, Business Administration"
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      );

    case 'year':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Year of Study
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((year) => (
              <button
                key={year}
                onClick={() => updateField('year', year)}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  profile.year === year
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {year === 1 ? '1st Year' : year === 2 ? '2nd Year' : year === 3 ? '3rd Year' : '4th+ Year'}
              </button>
            ))}
          </div>
        </div>
      );

    case 'preferredRoommateCount':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            How many roommates are you looking for?
          </label>
          <div className="grid grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => updateField('preferredRoommateCount', count)}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                  profile.preferredRoommateCount === count
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                {count === 4 ? '3+' : count}
              </button>
            ))}
          </div>
        </div>
      );

    // Step 2: Lifestyle Preferences Fields
    case 'sleepSchedule':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Sleep Schedule
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'early_bird', label: 'Early Bird', emoji: '🌅', description: 'Sleep by 10pm, up by 6am' },
              { value: 'night_owl', label: 'Night Owl', emoji: '🌙', description: 'Sleep after midnight' },
              { value: 'average', label: 'Average', emoji: '☀️', description: 'Sleep 11pm-12am' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('sleepSchedule', option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  profile.sleepSchedule === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-stone-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      );

    case 'cleanliness':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Cleanliness Level
          </label>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-stone-500">Very Messy</span>
              <span className="text-sm text-stone-500">Very Clean</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => updateField('cleanliness', level)}
                  className={`flex-1 h-16 rounded-lg border-2 transition-all relative ${
                    profile.cleanliness === level
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <span className="text-lg font-semibold">{level}</span>
                  {profile.cleanliness === level && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-stone-600">
              {profile.cleanliness === 1 && "I'm comfortable with clutter and mess"}
              {profile.cleanliness === 2 && "I don't mind some mess"}
              {profile.cleanliness === 3 && "I like things moderately clean"}
              {profile.cleanliness === 4 && "I prefer things to be clean and organized"}
              {profile.cleanliness === 5 && "I need everything spotless and perfectly organized"}
            </div>
          </div>
        </div>
      );

    case 'noiseTolerance':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Noise Tolerance
          </label>
          <div className="space-y-4">
            <div className="flex items-center justify-between px-4">
              <span className="text-sm text-stone-500">Very Low</span>
              <span className="text-sm text-stone-500">Very High</span>
            </div>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  onClick={() => updateField('noiseTolerance', level)}
                  className={`flex-1 h-16 rounded-lg border-2 transition-all relative ${
                    profile.noiseTolerance === level
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-stone-200 hover:border-stone-300 bg-white'
                  }`}
                >
                  <span className="text-lg font-semibold">{level}</span>
                  {profile.noiseTolerance === level && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="text-center text-sm text-stone-600">
              {profile.noiseTolerance === 1 && "I need complete silence to study/sleep"}
              {profile.noiseTolerance === 2 && "I prefer quiet environments"}
              {profile.noiseTolerance === 3 && "Moderate noise is fine"}
              {profile.noiseTolerance === 4 && "I don't mind noise"}
              {profile.noiseTolerance === 5 && "I can sleep/study through anything"}
            </div>
          </div>
        </div>
      );

    case 'guestPolicy':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Guest Policy Preference
          </label>
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: 'rarely', label: 'Rarely', emoji: '🚪', description: 'Guests once in a while' },
              { value: 'occasionally', label: 'Occasionally', emoji: '👋', description: 'Guests on weekends' },
              { value: 'frequently', label: 'Frequently', emoji: '🎉', description: 'Regular visitors' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('guestPolicy', option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  profile.guestPolicy === option.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-3xl mb-2">{option.emoji}</div>
                <div className="font-medium">{option.label}</div>
                <div className="text-xs text-stone-500 mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        </div>
      );

    // Step 3: Compatibility Factors Fields
    case 'smokingAllowed':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Smoking Preference
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateField('smokingAllowed', false)}
              className={`p-6 rounded-lg border-2 transition-all text-center ${
                profile.smokingAllowed === false
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-3xl mb-2">🚭</div>
              <div className="font-medium">No Smoking</div>
              <div className="text-xs text-stone-500 mt-1">I prefer a smoke-free environment</div>
            </button>
            <button
              onClick={() => updateField('smokingAllowed', true)}
              className={`p-6 rounded-lg border-2 transition-all text-center ${
                profile.smokingAllowed === true
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-3xl mb-2">🚬</div>
              <div className="font-medium">Smoking OK</div>
              <div className="text-xs text-stone-500 mt-1">I don't mind if roommates smoke</div>
            </button>
          </div>
        </div>
      );

    case 'petFriendly':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Pet Preference
          </label>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => updateField('petFriendly', true)}
              className={`p-6 rounded-lg border-2 transition-all text-center ${
                profile.petFriendly === true
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-3xl mb-2">🐾</div>
              <div className="font-medium">Pet Friendly</div>
              <div className="text-xs text-stone-500 mt-1">I love pets or have pets</div>
            </button>
            <button
              onClick={() => updateField('petFriendly', false)}
              className={`p-6 rounded-lg border-2 transition-all text-center ${
                profile.petFriendly === false
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-stone-200 hover:border-stone-300'
              }`}
            >
              <div className="text-3xl mb-2">🚫</div>
              <div className="font-medium">No Pets</div>
              <div className="text-xs text-stone-500 mt-1">I prefer no pets in the home</div>
            </button>
          </div>
        </div>
      );

    case 'preferredRoommateGender':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Preferred Roommate Gender
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: 'male', label: 'Male', emoji: '👨' },
              { value: 'female', label: 'Female', emoji: '👩' },
              { value: 'other', label: 'Other', emoji: '🧑' },
              { value: 'no_preference', label: 'No Preference', emoji: '🤝' }
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateField('preferredRoommateGender', option.value)}
                className={`py-3 px-4 rounded-lg border-2 font-medium transition-all text-center ${
                  profile.preferredRoommateGender === option.value
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-2xl mb-1">{option.emoji}</div>
                <div className="text-sm">{option.label}</div>
              </button>
            ))}
          </div>
        </div>
      );

    case 'ageRangeMin':
    case 'ageRangeMax':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Preferred Age Range
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-stone-500 mb-1">Minimum Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={profile.ageRangeMin || ''}
                onChange={(e) => updateField('ageRangeMin', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="18"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-stone-500 mb-1">Maximum Age</label>
              <input
                type="number"
                min="18"
                max="100"
                value={profile.ageRangeMax || ''}
                onChange={(e) => updateField('ageRangeMax', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="30"
                className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      );

    // Step 4: Interests & Activities Fields
    case 'hobbies':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Hobbies & Interests
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {[
                '🎮 Gaming', '📚 Reading', '🎨 Art', '🎵 Music', '🏃 Sports',
                '🧑‍🍳 Cooking', '🎬 Movies', '📺 TV Shows', '🧘 Yoga', '💪 Gym',
                '📷 Photography', '✈️ Travel', '🎭 Theater', '💃 Dancing', '🎲 Board Games',
                '🌱 Gardening', '🖥️ Tech', '🎪 Anime', '🎸 Playing Music', '🥾 Hiking'
              ].map((hobby) => (
                <button
                  key={hobby}
                  onClick={() => {
                    const hobbyValue = hobby.split(' ')[1];
                    const currentHobbies = profile.hobbies || [];
                    if (currentHobbies.includes(hobbyValue)) {
                      updateField('hobbies', currentHobbies.filter(h => h !== hobbyValue));
                    } else {
                      updateField('hobbies', [...currentHobbies, hobbyValue]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    profile.hobbies?.includes(hobby.split(' ')[1])
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add custom hobbies (press Enter)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const value = input.value.trim();
                  if (value && !profile.hobbies?.includes(value)) {
                    updateField('hobbies', [...(profile.hobbies || []), value]);
                    input.value = '';
                  }
                }
              }}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      );

    case 'socialActivities':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Social Activities
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { value: 'parties', label: 'Parties', emoji: '🎉' },
              { value: 'study_groups', label: 'Study Groups', emoji: '📖' },
              { value: 'sports_clubs', label: 'Sports Clubs', emoji: '⚽' },
              { value: 'cultural_events', label: 'Cultural Events', emoji: '🎭' },
              { value: 'volunteering', label: 'Volunteering', emoji: '🤝' },
              { value: 'gaming_nights', label: 'Gaming Nights', emoji: '🎮' }
            ].map((activity) => (
              <button
                key={activity.value}
                onClick={() => {
                  const currentActivities = profile.socialActivities || [];
                  if (currentActivities.includes(activity.value)) {
                    updateField('socialActivities', currentActivities.filter(a => a !== activity.value));
                  } else {
                    updateField('socialActivities', [...currentActivities, activity.value]);
                  }
                }}
                className={`py-3 px-4 rounded-lg border-2 transition-all text-center ${
                  profile.socialActivities?.includes(activity.value)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-2xl mb-1">{activity.emoji}</div>
                <div className="text-sm">{activity.label}</div>
              </button>
            ))}
          </div>
        </div>
      );

    case 'studyHabits':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Study Habits
          </label>
          <textarea
            value={profile.studyHabits || ''}
            onChange={(e) => updateField('studyHabits', e.target.value)}
            placeholder="Describe your study habits... (e.g., I study best in the morning, prefer quiet environments, often work in groups)"
            rows={4}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="mt-2 text-xs text-stone-500">
            {profile.studyHabits?.length || 0}/500 characters
          </div>
        </div>
      );

    // Step 5: Additional Information Fields
    case 'languages':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Languages Spoken
          </label>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {['English', 'Spanish', 'French', 'Mandarin', 'Hindi', 'Arabic', 'Portuguese', 'Russian', 'Japanese', 'German'].map((language) => (
                <button
                  key={language}
                  onClick={() => {
                    const currentLanguages = profile.languages || [];
                    if (currentLanguages.includes(language)) {
                      updateField('languages', currentLanguages.filter(l => l !== language));
                    } else {
                      updateField('languages', [...currentLanguages, language]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full border-2 transition-all ${
                    profile.languages?.includes(language)
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  {language}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add other languages (press Enter)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const value = input.value.trim();
                  if (value && !profile.languages?.includes(value)) {
                    updateField('languages', [...(profile.languages || []), value]);
                    input.value = '';
                  }
                }
              }}
              className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
      );

    case 'dietaryRestrictions':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Dietary Restrictions
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
              { value: 'vegan', label: 'Vegan', emoji: '🌱' },
              { value: 'halal', label: 'Halal', emoji: '☪️' },
              { value: 'kosher', label: 'Kosher', emoji: '✡️' },
              { value: 'gluten_free', label: 'Gluten-Free', emoji: '🌾' },
              { value: 'dairy_free', label: 'Dairy-Free', emoji: '🥛' }
            ].map((diet) => (
              <button
                key={diet.value}
                onClick={() => {
                  const currentRestrictions = profile.dietaryRestrictions || [];
                  if (currentRestrictions.includes(diet.value)) {
                    updateField('dietaryRestrictions', currentRestrictions.filter(d => d !== diet.value));
                  } else {
                    updateField('dietaryRestrictions', [...currentRestrictions, diet.value]);
                  }
                }}
                className={`py-3 px-4 rounded-lg border-2 transition-all text-center ${
                  profile.dietaryRestrictions?.includes(diet.value)
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="text-2xl mb-1">{diet.emoji}</div>
                <div className="text-sm">{diet.label}</div>
              </button>
            ))}
          </div>
        </div>
      );

    case 'bio':
      return (
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            About Me
          </label>
          <textarea
            value={profile.bio || ''}
            onChange={(e) => updateField('bio', e.target.value)}
            placeholder="Tell potential roommates about yourself... What makes you a great roommate? What are you looking for in a living situation?"
            rows={6}
            className="w-full px-4 py-2 border border-stone-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
          <div className="mt-2 flex justify-between text-xs text-stone-500">
            <span>{profile.bio?.length || 0}/1000 characters</span>
            <span>Be authentic and specific!</span>
          </div>
        </div>
      );

    default:
      return (
        <div className="p-4 bg-stone-100 rounded-lg">
          <p className="text-stone-600">Field renderer not implemented for: {field}</p>
        </div>
      );
  }
};

   return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-stone-600 mb-2">
          <span>Profile Completion</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-between mb-8">
        {WIZARD_STEPS.map((step, index) => (
          <div
            key={step.id}
            className={`flex items-center ${index <= currentStep ? 'text-primary-600' : 'text-stone-400'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
              index < currentStep ? 'bg-primary-600 text-white border-primary-600' :
              index === currentStep ? 'border-primary-600' : 'border-stone-300'
            }`}>
              {index < currentStep ? '✓' : index + 1}
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`w-12 h-0.5 ${index < currentStep ? 'bg-primary-600' : 'bg-stone-300'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-6">
        <h2 className="text-2xl font-bold text-stone-900 mb-2">
          {WIZARD_STEPS[currentStep].title}
        </h2>
        <p className="text-stone-600 mb-6">
          {WIZARD_STEPS[currentStep].description}
        </p>
        
        {renderStepContent()}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 0}
          className={`px-6 py-2 rounded-lg font-medium ${
            currentStep === 0 
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed' 
              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
          }`}
        >
          Back
        </button>

        <div className="space-x-3">
          {!WIZARD_STEPS[currentStep].required && (
            <button
              onClick={handleSkipStep}
              className="px-6 py-2 text-stone-600 hover:text-stone-800 font-medium"
            >
              Skip
            </button>
          )}
          
          <button
            onClick={handleNext}
            disabled={isLoading || (WIZARD_STEPS[currentStep].required && !isStepComplete(WIZARD_STEPS[currentStep]))}
            className={`px-6 py-2 rounded-lg font-medium ${
              isLoading || (WIZARD_STEPS[currentStep].required && !isStepComplete(WIZARD_STEPS[currentStep]))
                ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            {isLoading ? 'Saving...' : 
             currentStep === WIZARD_STEPS.length - 1 ? 'Complete' : 'Next'}
          </button>
        </div>
      </div>

      {/* Skip All Option */}
      {!isEditing && (
        <div className="text-center mt-6">
          <button
            onClick={handleSkipAll}
            className="text-sm text-stone-600 hover:text-stone-800 underline"
          >
            Skip for now
          </button>
        </div>
      )}
    </div>
  );
}