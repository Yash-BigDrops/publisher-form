import React from 'react'
import { cn } from '@/lib/utils'

interface ErrorMessageProps {
  message?: string
  className?: string
  show?: boolean
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  className,
  show = true 
}) => {
  if (!show || !message) return null

  return (
    <p className={cn(
      "text-sm text-red-600 mt-1 flex items-center gap-1",
      className
    )}>
      <svg 
        className="w-4 h-4 flex-shrink-0" 
        fill="currentColor" 
        viewBox="0 0 20 20"
      >
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      {message}
    </p>
  )
}
