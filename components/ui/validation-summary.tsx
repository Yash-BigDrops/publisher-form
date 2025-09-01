import React from 'react'
import { cn } from '@/lib/utils'

interface ValidationSummaryProps {
  errors: Record<string, string>
  className?: string
  show?: boolean
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({ 
  errors, 
  className,
  show = true 
}) => {
  if (!show || Object.keys(errors).length === 0) return null

  const errorEntries = Object.entries(errors).filter(([_, message]) => message)

  if (errorEntries.length === 0) return null

  return (
    <div className={cn(
      "p-4 border border-red-200 bg-red-50 rounded-lg",
      className
    )}>
      <div className="flex items-center gap-2 mb-3">
        <svg 
          className="w-5 h-5 text-red-600 flex-shrink-0" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
        <h4 className="text-sm font-medium text-red-800">
          Please fix the following errors:
        </h4>
      </div>
      
      <ul className="space-y-1">
        {errorEntries.map(([fieldName, message]) => (
          <li key={fieldName} className="text-sm text-red-700 flex items-start gap-2">
            <span className="text-red-600 mt-0.5">•</span>
            <span>
              <span className="font-medium capitalize">
                {fieldName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
              </span>{' '}
              {message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
