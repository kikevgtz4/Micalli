// frontend/src/components/messaging/PolicyWarning.tsx
import { ExclamationTriangleIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

interface PolicyWarningProps {
  violations: Array<{
    type: string;
    severity: string;
    education: string;
  }>;
  onAccept: () => void;
  onRevise: () => void;
}

export default function PolicyWarning({ violations, onAccept, onRevise }: PolicyWarningProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': 
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: 'text-red-600'
        };
      case 'high': 
        return {
          bg: 'bg-orange-50',
          border: 'border-orange-200',
          text: 'text-orange-800',
          icon: 'text-orange-600'
        };
      case 'medium': 
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: 'text-yellow-600'
        };
      default: 
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: 'text-blue-600'
        };
    }
  };

  const hasCriticalViolations = violations.some(v => v.severity === 'critical');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center mb-4">
          <ShieldCheckIcon className="h-8 w-8 text-primary-600 mr-3" />
          <h3 className="text-lg font-semibold">Platform Safety Notice</h3>
        </div>
        
        <div className="space-y-3 mb-6">
          <p className="text-neutral-700">
            We noticed your message might violate our platform policies. 
            Here's why these rules help keep you safe:
          </p>
          
          {violations.map((violation, index) => {
            const colors = getSeverityColor(violation.severity);
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${colors.bg} border ${colors.border}`}
              >
                <div className="flex items-start">
                  <ExclamationTriangleIcon 
                    className={`h-5 w-5 ${colors.icon} mr-2 mt-0.5 flex-shrink-0`} 
                  />
                  <p className={`text-sm ${colors.text}`}>{violation.education}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h4 className="font-medium text-blue-900 mb-2">Why use platform messaging?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your conversations are recorded for dispute resolution</li>
            <li>• Payment protection for deposits and rent</li>
            <li>• Verified user identities</li>
            <li>• 24/7 support if issues arise</li>
            <li>• Scam prevention and fraud protection</li>
          </ul>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={onRevise}
            className="flex-1 btn-primary"
          >
            Revise Message
          </button>
          {!hasCriticalViolations && (
            <button
              onClick={onAccept}
              className="flex-1 btn-secondary"
            >
              I Understand, Send Anyway
            </button>
          )}
        </div>
        
        {hasCriticalViolations && (
          <p className="mt-4 text-sm text-red-600 text-center">
            Messages with critical violations cannot be sent.
          </p>
        )}
      </div>
    </div>
  );
}
