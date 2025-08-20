"use client"

import React, { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Constants } from '@/app/Constants/Constants'

const PersonalDetails = () => {
  const [formData, setFormData] = useState({
    affiliateId: '',
    companyName: '',
    firstName: '',
    lastName: '',
  })

  // Filter only the personal detail fields from Constants
  const personalFields = Constants.formFields.filter(field => 
    ['affiliateId', 'companyName', 'firstName', 'lastName'].includes(field.name)
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="space-y-6">
      
      {/* Affiliate ID and Company Name - Single Column */}
      <div className="space-y-4">
        {personalFields.slice(0, 2).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>

      {/* First Name and Last Name - Responsive Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalFields.slice(2, 4).map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={formData[field.name as keyof typeof formData]}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default PersonalDetails