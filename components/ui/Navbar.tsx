"use client"

import React from 'react'
import Image from 'next/image'
import { Constants } from '@/app/Constants/Constants'

interface NavbarProps {
  submissionId?: string
  showSubmissionId?: boolean
  lastUpdated?: string
  className?: string
}

const Navbar: React.FC<NavbarProps> = ({ 
  submissionId, 
  showSubmissionId = true,
  lastUpdated,
  className = ""
}) => {
  return (
    <nav className={`w-full py-4 px-4 md:px-6 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo on the left */}
        <div className="flex items-center">
          <Image
            src={Constants.logo}
            alt="Logo"
            width={120}
            height={40}
            className="h-8 md:h-10 w-auto"
          />
        </div>

        {/* Submission ID and Last Updated on the right */}
        {showSubmissionId && submissionId && (
          <div className="flex items-center space-x-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium text-blue-700">Submission ID:</span>
                <span className="text-sm font-bold text-blue-900 font-mono">
                  {submissionId}
                </span>
              </div>
            </div>
            
            {lastUpdated && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  <span className="text-xs font-medium text-gray-600">Last updated:</span>
                  <span className="text-sm font-medium text-gray-800">
                    {new Date(lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
