import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { 
  MoonIcon, 
  SunIcon, 
  SparklesIcon,
  SpeakerWaveIcon,
  UserGroupIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/solid'; // Changed to solid for CheckCircleIcon

interface QuickProfileData {
  sleepSchedule?: 'early_bird' | 'night_owl' | 'flexible' | undefined;
  cleanliness?: 1 | 2 | 3 | 4 | 5 | undefined;
  noiseTolerance?: 1 | 2 | 3 | 4 | 5 | undefined;
  studyHabits?: 'quiet' | 'social' | 'flexible' | undefined;
  guestPolicy?: 'rarely' | 'occasionally' | 'frequently' | undefined;
}

const QUESTIONS = [
  {
    id: 'sleepSchedule',
    title: "When do you usually sleep? 🌙",
    subtitle: "This helps us match you with compatible schedules",
    type: 'choice',
    options: [
      { value: 'early_bird', label: 'Early Bird', icon: '🌅', description: 'In bed by 10pm' },
      { value: 'night_owl', label: 'Night Owl', icon: '🦉', description: 'Up past midnight' },
      { value: 'flexible', label: 'Flexible', icon: '😊', description: 'Varies by day' }
    ]
  },
  {
    id: 'cleanliness',
    title: "How tidy do you keep your space? 🧹",
    subtitle: "Rate from messy to spotless",
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['Messy', 'Relaxed', 'Balanced', 'Tidy', 'Spotless']
  },
  {
    id: 'noiseTolerance',
    title: "How much noise can you handle? 🔊",
    subtitle: "From library quiet to party ready",
    type: 'scale',
    min: 1,
    max: 5,
    labels: ['Silent', 'Quiet', 'Moderate', 'Social', 'Party']
  },
  {
    id: 'studyHabits',
    title: "How do you prefer to study? 📚",
    subtitle: "Your ideal study environment",
    type: 'choice',
    options: [
      { value: 'quiet', label: 'Quiet Focus', icon: '🤫', description: 'Need silence to concentrate' },
      { value: 'social', label: 'Study Groups', icon: '👥', description: 'Learn better with others' },
      { value: 'flexible', label: 'Both Work', icon: '🎯', description: 'Depends on the subject' }
    ]
  },
  {
    id: 'guestPolicy',
    title: "How often do you have guests? 🏠",
    subtitle: "Your social hosting style",
    type: 'choice',
    options: [
      { value: 'rarely', label: 'Rarely', icon: '🚪', description: 'Home is my quiet space' },
      { value: 'occasionally', label: 'Sometimes', icon: '☕', description: 'Friends over occasionally' },
      { value: 'frequently', label: 'Often', icon: '🎉', description: 'Love hosting friends' }
    ]
  }
];

export default function QuickProfileSetup({ onComplete }: { onComplete?: () => void }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<QuickProfileData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);

  const progress = ((Object.keys(answers).length) / QUESTIONS.length) * 100;
  const question = QUESTIONS[currentQuestion];

  const handleAnswer = (value: any) => {
    setAnswers(prev => ({ ...prev, [question.id as keyof QuickProfileData]: value }));
    
    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(prev => prev + 1);
      }
    }, 300);
  };

  const handleBack = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      const response = await apiService.roommates.quickSetup({
        sleepSchedule: answers.sleepSchedule as 'early_bird' | 'night_owl' | 'flexible',
        cleanliness: answers.cleanliness as 1 | 2 | 3 | 4 | 5,
        noiseTolerance: answers.noiseTolerance as 1 | 2 | 3 | 4 | 5,
        studyHabits: answers.studyHabits as 'quiet' | 'social' | 'flexible',
        guestPolicy: answers.guestPolicy as 'rarely' | 'occasionally' | 'frequently'
      });

      setMatchCount(response.data.matchCount);
      
      // Show success screen briefly
      setTimeout(() => {
        toast.success('Profile created! Finding your matches...');
        if (onComplete) {
          onComplete();
        } else {
          router.push('/roommates');
        }
      }, 2000);
      
    } catch (error) {
      toast.error('Failed to create profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const renderQuestion = () => {
    if (question.type === 'choice') {
      return (
        <div className="grid gap-4">
          {question.options?.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleAnswer(option.value)}
              className={`p-6 rounded-2xl border-2 transition-all ${
                answers[question.id as keyof QuickProfileData] === option.value
                  ? 'border-primary-500 bg-primary-50 shadow-lg'
                  : 'border-stone-200 hover:border-stone-300 bg-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="text-4xl">{option.icon}</div>
                <div className="text-left flex-1">
                  <h4 className="text-lg font-semibold text-stone-900">{option.label}</h4>
                  <p className="text-sm text-stone-600">{option.description}</p>
                </div>
                {answers[question.id as keyof QuickProfileData] === option.value && (
                  <CheckCircleIcon className="w-6 h-6 text-primary-500" />
                )}
              </div>
            </motion.button>
          ))}
        </div>
      );
    }

    if (question.type === 'scale') {
      return (
        <div className="space-y-6">
          <div className="flex justify-between px-2">
            {question.labels?.map((label, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index + 1)}
                className="text-center flex-1"
              >
                <div
                  className={`w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center transition-all ${
                    answers[question.id as keyof QuickProfileData] === index + 1
                      ? 'bg-primary-500 text-white scale-125 shadow-lg'
                      : 'bg-stone-100 hover:bg-stone-200'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`text-xs ${answers[question.id as keyof QuickProfileData] === index + 1 ? 'font-semibold' : ''
                }`}>
                  {label}
                </span>
              </button>
            ))}
          </div>
          
          <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-400 to-primary-600"
              initial={{ width: 0 }}
              animate={{ width: answers[question.id as keyof QuickProfileData] ? `${(answers[question.id as keyof QuickProfileData] as number) * 20}%` : 0 }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      );
    }
  };

  // Success state
  if (matchCount !== null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircleIcon className="w-12 h-12 text-green-600" />
          </motion.div>
          
          <h2 className="text-3xl font-bold text-stone-900 mb-4">
            Profile Created! 🎉
          </h2>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-6xl font-bold text-primary-600 mb-2"
          >
            {matchCount}
          </motion.p>
          
          <p className="text-stone-600 text-lg">
            potential matches found for you!
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="h-2 bg-white/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-center mt-2 text-sm text-stone-600">
            Question {Object.keys(answers).length + 1} of {QUESTIONS.length}
          </p>
        </div>

        {/* Question card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -50, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-6 text-white">
              <h3 className="text-2xl font-bold mb-2">{question.title}</h3>
              <p className="text-white/80">{question.subtitle}</p>
            </div>
            
            <div className="p-6">
              {renderQuestion()}
            </div>

            <div className="px-6 pb-6 flex justify-between">
              <button
                onClick={handleBack}
                disabled={currentQuestion === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  currentQuestion === 0
                    ? 'text-stone-400 cursor-not-allowed'
                    : 'text-stone-600 hover:text-stone-800'
                }`}
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back
              </button>

              {currentQuestion === QUESTIONS.length - 1 && 
               Object.keys(answers).length === QUESTIONS.length && (
                <motion.button
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>Creating Profile...</>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button
            onClick={() => router.push('/roommates')}
            className="text-stone-500 hover:text-stone-700 text-sm"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}