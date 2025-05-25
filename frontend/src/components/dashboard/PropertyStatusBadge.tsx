interface PropertyStatusBadgeProps {
  isActive: boolean;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function PropertyStatusBadge({ 
  isActive, 
  size = 'md', 
  showIcon = true 
}: PropertyStatusBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-2.5 py-0.5 text-xs',
    lg: 'px-3 py-1 text-sm'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${
      isActive
        ? 'bg-success-50 text-success-600'
        : 'bg-error-50 text-error-600'
    } ${sizeClasses[size]}`}>
      {showIcon && (
        <svg 
          className={`${iconSizeClasses[size]} mr-1`} 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          {isActive ? (
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
              clipRule="evenodd" 
            />
          ) : (
            <path 
              fillRule="evenodd" 
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
              clipRule="evenodd" 
            />
          )}
        </svg>
      )}
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}