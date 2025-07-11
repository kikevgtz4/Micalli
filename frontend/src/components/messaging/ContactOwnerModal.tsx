// frontend/src/components/messaging/ContactOwnerModal.tsx
import { useState, useEffect } from "react";
import { Property } from "@/types/api";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import { 
  XMarkIcon,
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon,
  ShieldCheckIcon,
  InformationCircleIcon
} from "@heroicons/react/24/outline";
import { MESSAGE_TEMPLATES } from "@/utils/constants";
import PolicyWarning from "./PolicyWarning";
import PropertyImage from "@/components/common/PropertyImage";

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
  onSuccess,
}: ContactOwnerModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState("initial_inquiry");
  const [message, setMessage] = useState("");
  const [moveInDate, setMoveInDate] = useState("");
  const [duration, setDuration] = useState("12");
  const [occupants, setOccupants] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [contentViolations, setContentViolations] = useState<any[]>([]);

  // Load templates from API or use defaults
  const templates: TemplateOption[] = Object.entries(MESSAGE_TEMPLATES).map(
    ([key, value]) => ({
      id: key,
      ...value,
    })
  );

  useEffect(() => {
    // Set initial message based on template
    handleTemplateChange("initial_inquiry");
  }, []);

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);

    if (template) {
      // Fill in template with actual values
      let filledMessage = template.content
        .replace("{property_title}", property.title)
        .replace(
          "{move_in_date}",
          moveInDate || "[Please specify move-in date]"
        )
        .replace(
          "{duration}",
          duration ? `${duration} months` : "[Please specify duration]"
        )
        .replace("{occupants}", occupants || "1");

      setMessage(filledMessage);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
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
        },
      });

      // Check for content warnings
      if (response.data.contentWarning) {
        setContentViolations(response.data.contentWarning.violations);
        setShowWarning(true);
        setIsSubmitting(false);
        return;
      }

      toast.success("Message sent successfully!");
      onSuccess(response.data.id); // Pass conversation ID to onSuccess
      onClose();
    } catch (error: any) {
      if (error.response?.data?.violations) {
        // Content was blocked
        setContentViolations(error.response.data.violations);
        setShowWarning(true);
      } else {
        toast.error("Failed to send message");
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
      {/* Backdrop with blur effect */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-300">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-r from-primary-500 to-primary-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
                </div>
                <h2 className="text-xl font-semibold text-white">Contact Property Owner</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Property Info Card */}
            <div className="mb-6 bg-gradient-to-br from-neutral-50 to-neutral-100 rounded-xl p-4 border border-neutral-200">
              <div className="flex items-center space-x-4">
                {property.images?.[0] && (
                  <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                    <PropertyImage
                      image={property.images[0]}
                      alt={property.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-neutral-900 text-lg">
                    {property.title}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-primary-600 font-semibold">
                      ${property.rentAmount}/month
                    </span>
                    <span className="text-sm text-neutral-600">
                      {property.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Message Type
              </label>
              <div className="relative">
                <SparklesIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Info Fields */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Move-in Date
                </label>
                <div className="relative">
                  <CalendarDaysIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <input
                    type="date"
                    value={moveInDate}
                    onChange={(e) => {
                      setMoveInDate(e.target.value);
                      handleTemplateChange(selectedTemplate);
                    }}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Duration
                </label>
                <div className="relative">
                  <ClockIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <select
                    value={duration}
                    onChange={(e) => {
                      setDuration(e.target.value);
                      handleTemplateChange(selectedTemplate);
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Occupants
                </label>
                <div className="relative">
                  <UserGroupIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                  <select
                    value={occupants}
                    onChange={(e) => {
                      setOccupants(e.target.value);
                      handleTemplateChange(selectedTemplate);
                    }}
                    className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all appearance-none"
                  >
                    <option value="1">1 person</option>
                    <option value="2">2 people</option>
                    <option value="3">3 people</option>
                    <option value="4">4+ people</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Message Field */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Your Message
              </label>
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                  placeholder="Introduce yourself and ask any questions about the property..."
                />
                <div className="absolute bottom-3 right-3 text-xs text-neutral-400">
                  {message.length}/1000
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
              <div className="flex space-x-3">
                <InformationCircleIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Tips for a great first message:</p>
                  <ul className="space-y-1 text-blue-800">
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Introduce yourself briefly
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Mention your move-in date and duration
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Ask specific questions about the property
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      Keep all communication on the platform
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with Security Notice */}
          <div className="border-t bg-neutral-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-sm text-neutral-600">
                <ShieldCheckIcon className="h-5 w-5 mr-2 text-green-600" />
                <span>Your message is protected by our safety policies</span>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 text-neutral-700 hover:bg-neutral-200 rounded-xl font-medium transition-all"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={isSubmitting || !message.trim()}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Message"
                  )}
                </button>
              </div>
            </div>
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