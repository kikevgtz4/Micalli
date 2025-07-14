// frontend/src/components/messaging/PolicyWarning.tsx
import { ExclamationTriangleIcon, XMarkIcon, ShieldCheckIcon, InformationCircleIcon } from "@heroicons/react/24/outline";

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
  const getSeverityConfig = (severity: string) => {
    switch (severity) {
      case 'critical':
        return {
          bg: 'bg-gradient-to-r from-red-50 to-rose-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          text: 'text-red-900',
          badge: 'bg-red-100 text-red-700 border-red-200',
        };
      case 'high':
        return {
          bg: 'bg-gradient-to-r from-orange-50 to-amber-50',
          border: 'border-orange-200',
          icon: 'text-orange-600',
          text: 'text-orange-900',
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
        };
      case 'medium':
        return {
          bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
          border: 'border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-900',
          badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-900',
          badge: 'bg-blue-100 text-blue-700 border-blue-200',
        };
    }
  };

  const getViolationIcon = (type: string) => {
    const icons = {
      'phone_number': '📱',
      'email': '📧',
      'messaging_app': '💬',
      'payment_circumvention': '💳',
      'social_media': '🌐',
      'website': '🔗',
      'inappropriate_content': '🚫',
    };
    return icons[type as keyof typeof icons] || '⚠️';
  };

  const getViolationTitle = (type: string) => {
    const titles = {
      'phone_number': 'Phone Number Detected',
      'email': 'Email Address Detected',
      'messaging_app': 'External Messaging App',
      'payment_circumvention': 'Payment Outside Platform',
      'social_media': 'Social Media Contact',
      'website': 'External Website',
      'inappropriate_content': 'Inappropriate Content',
    };
    return titles[type as keyof typeof titles] || 'Policy Violation';
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header with gradient */}
        <div className={`relative px-6 py-5 ${
          isBlocked 
            ? 'bg-gradient-to-r from-red-500 to-rose-600' 
            : 'bg-gradient-to-r from-amber-500 to-orange-600'
        }`}>
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-white">
                {isBlocked ? 'Message Blocked' : 'Content Warning'}
              </h3>
              <p className="mt-1 text-sm text-white/90">
                {isBlocked 
                  ? 'Your message violates our community guidelines'
                  : 'Your message may contain content that violates our policies'}
              </p>
            </div>
          </div>
        </div>

        {/* Violations List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <h4 className="font-medium text-neutral-900 mb-4">
            {violations.length === 1 ? 'Issue detected:' : 'Issues detected:'}
          </h4>
          
          <div className="space-y-3">
            {violations.map((violation, index) => {
              const config = getSeverityConfig(violation.severity);
              
              return (
                <div
                  key={index}
                  className={`rounded-xl border-2 ${config.border} ${config.bg} p-4 transition-all hover:shadow-md`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="text-2xl flex-shrink-0 mt-0.5" aria-hidden="true">
                      {getViolationIcon(violation.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className={`font-semibold text-sm ${config.text}`}>
                          {getViolationTitle(violation.type)}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${config.badge}`}>
                          {violation.severity}
                        </span>
                      </div>
                      <p className={`text-sm ${config.text} opacity-90`}>
                        {violation.education}
                      </p>
                      {violation.matchedText && (
                        <div className="mt-2 p-2 bg-white/60 rounded-lg border border-white/80">
                          <p className="text-xs font-mono text-neutral-700">
                            Detected: <span className="font-semibold">"{violation.matchedText}"</span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Platform Safety Info */}
          <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <div className="flex space-x-3">
              <ShieldCheckIcon className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-semibold text-blue-900 mb-1">
                  Why we have these rules
                </h5>
                <p className="text-sm text-blue-800 leading-relaxed">
                  UniHousing protects both students and property owners by keeping all 
                  communication and payments on our platform. This ensures everyone has 
                  access to our support, dispute resolution, and safety features.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t bg-neutral-50 p-6">
          <div className="flex space-x-3">
            <button
              onClick={onRevise}
              className="flex-1 px-5 py-2.5 bg-white border-2 border-neutral-300 text-neutral-700 rounded-xl font-medium hover:bg-neutral-100 hover:border-neutral-400 transition-all"
            >
              Revise Message
            </button>
            
            {!isBlocked && onAccept && (
              <button
                onClick={onAccept}
                className="flex-1 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
              >
                Send Anyway
              </button>
            )}
          </div>
          
          {!isBlocked && (
            <div className="mt-4 flex items-center justify-center">
              <InformationCircleIcon className="h-4 w-4 text-neutral-500 mr-1.5" />
              <p className="text-xs text-neutral-500">
                Repeatedly violating our policies may result in account restrictions
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}