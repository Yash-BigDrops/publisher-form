"use client";

import React from "react";
import { CreativeFormData } from "@/types/creative";

interface PersonalDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  handleInputChange: (field: string, value: string) => void;
}

export default function PersonalDetailsForm({
  formData,
  errors,
  handleInputChange,
}: PersonalDetailsFormProps) {
  return (
    <>
      <div>
        <input
          type="text"
          placeholder="Affiliate ID"
          value={formData.affiliateId}
          onChange={(e) => handleInputChange("affiliateId", e.target.value)}
          className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left ${
            errors.affiliateId ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.affiliateId && (
          <p className="text-red-500 text-sm mt-1 animate-fade-in">
            {errors.affiliateId}
          </p>
        )}
      </div>

      <div>
        <input
          type="text"
          placeholder="Company Name"
          value={formData.companyName}
          onChange={(e) => handleInputChange("companyName", e.target.value)}
          className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay ${
            errors.companyName ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.companyName && (
          <p className="text-red-500 text-sm mt-1 animate-fade-in">
            {errors.companyName}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <input
            type="text"
            placeholder="First Name"
            value={formData.firstName}
            onChange={(e) => handleInputChange("firstName", e.target.value)}
            className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay-2 ${
              errors.firstName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.firstName && (
            <p className="text-red-500 text-sm mt-1 animate-fade-in">
              {errors.firstName}
            </p>
          )}
        </div>
        <div>
          <input
            type="text"
            placeholder="Last Name"
            value={formData.lastName}
            onChange={(e) => handleInputChange("lastName", e.target.value)}
            className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 animate-slide-in-left-delay-3 ${
              errors.lastName ? "border-red-500" : "border-gray-300"
            }`}
          />
          {errors.lastName && (
            <p className="text-red-500 text-sm mt-1 animate-fade-in">
              {errors.lastName}
            </p>
          )}
        </div>
      </div>
    </>
  );
} 