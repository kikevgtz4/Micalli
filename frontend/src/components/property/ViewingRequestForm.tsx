// src/components/property/ViewingRequestForm.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';

interface ViewingRequestFormProps {
  propertyId: number;
  propertyTitle: string;
}

export default function ViewingRequestForm({ propertyId, propertyTitle }: ViewingRequestFormProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // In ViewingRequestForm component
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!isAuthenticated) {
    router.push(`/login?redirect=/properties/${propertyId}`);
    return;
  }
  
  if (!date || !time) {
    setError('Please select a date and time for viewing.');
    return;
  }
  
  try {
    setIsSubmitting(true);
    setError(null);
    
    // Combine date and time into ISO string
    const proposedDate = new Date(`${date}T${time}`).toISOString();
    
    // Log the request for debugging
    console.log("Submitting viewing request:", {
      propertyId,
      proposedDate,
      message: message || `I would like to view this property on ${date} at ${time}.`
    });
    
    await apiService.messaging.createViewingRequest(
      propertyId,
      proposedDate,
      message || `I would like to view this property on ${date} at ${time}.`
    );
    
    setSuccess(true);
    // Reset form
    setDate('');
    setTime('');
    setMessage('');
  } catch (err) {
    console.error('Failed to request viewing:', err);
    setError('Failed to request viewing. Please try again later.');
  } finally {
    setIsSubmitting(false);
  }
};

  // Get today's date in YYYY-MM-DD format for min date in datepicker
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="bg-surface p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-medium text-stone-900 mb-4">Request a Viewing</h3>
      
      {success ? (
        <div className="bg-success-50 border-l-4 border-green-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">
                Viewing request sent successfully! The owner will contact you soon.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => setSuccess(false)}
                  className="text-sm font-medium text-green-700 hover:text-success-600"
                >
                  Request another viewing
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/messages')}
                  className="ml-4 text-sm font-medium text-primary-600 hover:text-primary-500"
                >
                  Go to messages
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div className="bg-error-50 border-l-4 border-error-400 p-4 mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-error-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-error-700">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mb-4">
            <label htmlFor="date" className="block text-sm font-medium text-stone-700 mb-1">
              Preferred Date*
            </label>
            <input
              type="date"
              id="date"
              name="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="time" className="block text-sm font-medium text-stone-700 mb-1">
              Preferred Time*
            </label>
            <input
              type="time"
              id="time"
              name="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-1">
              Message (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              placeholder={`Hi, I'm interested in viewing "${propertyTitle}".`}
            />
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Request Viewing'}
          </button>
        </form>
      )}
    </div>
  );
}