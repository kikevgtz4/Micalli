// frontend/src/components/messaging/PolicyWarning.tsx
import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/24/outline";

interface PolicyWarningProps {
  violations: Array<{
    type: string;
    severity: string;
    pattern: string;
    education: string;
    matchedText?: string;
  }>;
  onAccept?: () => void;
  onRevise: () => void;
  isBlocked?: boolean;
}

export default function PolicyWarning({
  violations,
  onAccept,
  onRevise,
  isBlocked = false,
}: PolicyWarningProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getViolationIcon = (type: string) => {
    switch (type) {
      case 'phone_number':
        return '📱';
      case 'email':
        return '📧';
      case 'messaging_app':
        return '💬';
      case 'payment_circumvention':
        return '💳';
      case 'social_media':
        return '🌐';
      default:
        return '⚠️';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className={`p-6 border-b ${isBlocked ? 'bg-red-50' : 'bg-yellow-50'}`}>
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon 
              className={`h-6 w-6 flex-shrink-0 ${
                isBlocked ? 'text-red-600' : 'text-yellow-600'
              }`} 
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-neutral-900">
                {isBlocked ? 'Message Blocked' : 'Content Warning'}
              </h3>
              <p className="mt-1 text-sm text-neutral-600">
                {isBlocked 
                  ? 'Your message contains content that violates our community guidelines.'
                  : 'Your message may contain content that violates our policies.'}
              </p>
            </div>
          </div>
        </div>

        {/* Violations List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-neutral-900 mb-3">
            {violations.length === 1 ? 'Issue detected:' : 'Issues detected:'}
          </h4>
          
          <div className="space-y-3">
            {violations.map((violation, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${getSeverityColor(violation.severity)}`}
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl" aria-hidden="true">
                    {getViolationIcon(violation.type)}
                  </span>
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-1">
                      {violation.pattern}
                    </p>
                    <p className="text-sm opacity-90">
                      {violation.education}
                    </p>
                    {violation.matchedText && (
                      <p className="mt-2 text-xs font-mono bg-white bg-opacity-60 p-2 rounded">
                        Detected: "{violation.matchedText}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Safety Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h5 className="font-medium text-blue-900 mb-2">
              Why we have these rules
            </h5>
            <p className="text-sm text-blue-800">
              UniHousing protects both students and property owners by keeping all 
              communication and payments on our platform. This ensures everyone has 
              access to our support, dispute resolution, and safety features.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-neutral-50">
          <div className="flex space-x-3">
            <button
              onClick={onRevise}
              className="flex-1 btn-secondary"
            >
              Revise Message
            </button>
            
            {!isBlocked && onAccept && (
              <button
                onClick={onAccept}
                className="flex-1 btn-primary bg-yellow-500 hover:bg-yellow-600 border-yellow-500"
              >
                Send Anyway
              </button>
            )}
          </div>
          
          {!isBlocked && (
            <p className="mt-3 text-xs text-center text-neutral-500">
              Repeatedly violating our policies may result in account restrictions
            </p>
          )}
        </div>
      </div>
    </div>
  );
}