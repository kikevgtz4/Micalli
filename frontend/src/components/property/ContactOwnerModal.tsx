// frontend/src/components/messaging/ContactOwnerModal.tsx
import { useState, useEffect } from 'react';
import { Property } from '@/types/api';
import apiService from '@/lib/api';
import { toast } from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { MESSAGE_TEMPLATES } from '@/constants/messageTemplates';
import PolicyWarning from './PolicyWarning';

interface ContactOwnerModalProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (conversationId: number) => void;
}

interface TemplateOption {
  id: string;
  title: string;
  content: string;
  variables: string[];
}

export default function ContactOwnerModal({ 
  property, 
  isOpen, 
  onClose, 
  onSuccess 
}: ContactOwnerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState('initial_inquiry');
  const [message, setMessage] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [duration, setDuration] = useState('12');
  const [occupants, setOccupants] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [contentViolations, setContentViolations] = useState<any[]>([]);

  // Load templates from API or use defaults
  const templates: TemplateOption[] = Object.entries(MESSAGE_TEMPLATES).map(([key, value]) => ({
    id: key,
    ...value
  }));

  useEffect(() => {
    // Set initial message based on template
    handleTemplateChange('initial_inquiry');
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      // Fill in template with actual values
      let filledMessage = template.content
        .replace('{property_title}', property.title)
        .replace('{move_in_date}', moveInDate || '[Please specify move-in date]')
        .replace('{duration}', duration ? `${duration} months` : '[Please specify duration]')
        .replace('{occupants}', occupants || '1');
      
      setMessage(filledMessage);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error('Please write a message');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiService.messaging.startPropertyConversation({
        userId: property.owner.id,
        propertyId: property.id,
        message: message.trim(),
        templateType: selectedTemplate,
        metadata: {
          moveInDate,
          duration: parseInt(duration),
          occupants: parseInt(occupants),
        }
      });

      // Check for content warnings
      if (response.data.contentWarning) {
        setContentViolations(response.data.contentWarning.violations);
        setShowWarning(true);
        setIsSubmitting(false);
        return;
      }

      toast.success('Message sent successfully!');
      onSuccess(response.data.id);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.violations) {
        // Content was blocked
        setContentViolations(error.response.data.violations);
        setShowWarning(true);
      } else {
        toast.error('Failed to send message');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReviseMessage = () => {
    setShowWarning(false);
    // Let user edit their message
  };

  const handleSendAnyway = async () => {
    // This would only be available for warnings, not blocks
    setShowWarning(false);
    await handleSubmit();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">Contact Property Owner</h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {/* Property Info */}
            <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
              <h3 className="font-medium text-neutral-900 mb-1">{property.title}</h3>
              <p className="text-sm text-neutral-600">
                ${property.monthlyRent}/month • {property.address}
              </p>
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Type
              </label>
              <select
                value={selectedTemplate}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              >
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Info Fields */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Move-in Date
                </label>
                <input
                  type="date"
                  value={moveInDate}
                  onChange={(e) => {
                    setMoveInDate(e.target.value);
                    handleTemplateChange(selectedTemplate);
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Duration (months)
                </label>
                <select
                  value={duration}
                  onChange={(e) => {
                    setDuration(e.target.value);
                    handleTemplateChange(selectedTemplate);
                  }}
                  className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="6">6 months</option>
                  <option value="12">12 months</option>
                  <option value="24">24 months</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Occupants
                </label>
                <select
                  value={occupants}
                  onChange={(e) => {
                    setOccupants(e.target.value);
                    handleTemplateChange(selectedTemplate);
                  }}
                  className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="1">1 person</option>
                  <option value="2">2 people</option>
                  <option value="3">3 people</option>
                  <option value="4">4+ people</option>
                </select>
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-md border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="Introduce yourself and ask any questions about the property..."
              />
              <p className="mt-1 text-sm text-neutral-500">
                {message.length}/1000 characters
              </p>
            </div>

            {/* Tips */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tips for a great first message:</strong>
                <br />• Introduce yourself briefly
                <br />• Mention your move-in date and duration
                <br />• Ask specific questions about the property
                <br />• Keep all communication on the platform
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="btn-primary"
              disabled={isSubmitting || !message.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>
      </div>

      {/* Policy Warning Modal */}
      {showWarning && (
        <PolicyWarning
          violations={contentViolations}
          onAccept={handleSendAnyway}
          onRevise={handleReviseMessage}
        />
      )}
    </>
  );
}