// frontend/src/components/common/PasswordStrengthIndicator.tsx
'use client';

interface PasswordStrengthIndicatorProps {
  password: string;
  showSuggestions?: boolean;
}

export default function PasswordStrengthIndicator({ 
  password, 
  showSuggestions = true 
}: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const checks = [
    { label: 'At least 8 characters', test: password.length >= 8 },
    { label: 'Contains uppercase letter', test: /[A-Z]/.test(password) },
    { label: 'Contains lowercase letter', test: /[a-z]/.test(password) },
    { label: 'Contains number', test: /\d/.test(password) },
    { label: 'Contains special character', test: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: 'Not too common', test: !isCommonPassword(password) },
    { label: 'Not entirely numeric', test: !/^\d+$/.test(password) },
  ];

  const passedChecks = checks.filter(check => check.test).length;
  const strength = passedChecks >= 6 ? 'Strong' : passedChecks >= 4 ? 'Medium' : 'Weak';
  const strengthColor = passedChecks >= 6 ? 'text-green-600' : passedChecks >= 4 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div className="mt-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-600">Password strength:</span>
        <span className={`text-sm font-medium ${strengthColor}`}>{strength}</span>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
        <div 
          className={`h-2 rounded-full transition-all duration-300 ${
            passedChecks >= 6 ? 'bg-green-500' : 
            passedChecks >= 4 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${(passedChecks / checks.length) * 100}%` }}
        />
      </div>
      
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center text-xs">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              check.test ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className={check.test ? 'text-green-600' : 'text-gray-500'}>
              {check.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Password suggestions */}
      {showSuggestions && password && passedChecks < 4 && (
        <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400">
          <p className="text-sm text-blue-700 font-medium">Password suggestions:</p>
          <ul className="text-xs text-blue-600 mt-1 space-y-1">
            <li>• Try: MyS3cur3P@ssw0rd2024</li>
            <li>• Try: Monterrey#Student99</li>
            <li>• Try: UniHousing$2024Safe</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Helper function to check for common passwords
function isCommonPassword(password: string): boolean {
  const commonPasswords = [
    'password', 'password1', 'password123', '123456', '123456789',
    'qwerty', 'abc123', 'admin', 'letmein', 'welcome', 'monkey',
    'password1234', 'newpass1', 'newpass', 'pass123', 'test123'
  ];
  
  return commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase())
  );
}