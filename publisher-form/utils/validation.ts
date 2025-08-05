import { CreativeFormData } from "@/types/creative";

export interface ValidationErrors {
  [key: string]: string;
}

export const validateStep1 = (formData: CreativeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.affiliateId.trim()) {
    errors.affiliateId = "Please enter your Affiliate ID";
  }
  
  if (!formData.companyName.trim()) {
    errors.companyName = "Please enter your Company Name";
  }
  
  if (!formData.firstName.trim()) {
    errors.firstName = "Please enter your First Name";
  } else if (!/^[A-Za-z\s]+$/.test(formData.firstName.trim())) {
    errors.firstName = "First Name can only contain letters and spaces";
  }
  
  if (!formData.lastName.trim()) {
    errors.lastName = "Please enter your Last Name";
  } else if (!/^[A-Za-z\s]+$/.test(formData.lastName.trim())) {
    errors.lastName = "Last Name can only contain letters and spaces";
  }

  return errors;
};

export const validateStep2 = (formData: CreativeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.contactEmail.trim()) {
    errors.contactEmail = "Please enter your Email ID";
  } else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) {
    errors.contactEmail = "Please enter a valid email address";
  }

  return errors;
};

export const validateStep3 = (formData: CreativeFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!formData.offerId.trim()) {
    errors.offerId = "Please enter an Offer ID";
  }
  
  if (!formData.creativeType.trim()) {
    errors.creativeType = "Please enter a Creative Type";
  }

  return errors;
};

export const validateFormData = (formData: CreativeFormData, step: number): ValidationErrors => {
  switch (step) {
    case 1:
      return validateStep1(formData);
    case 2:
      return validateStep2(formData);
    case 3:
      return validateStep3(formData);
    default:
      return {};
  }
};

export const sanitizeNameInput = (value: string): string => {
  return value.replace(/[^A-Za-z\s]/g, '');
};

export const isValidEmail = (email: string): boolean => {
  return /\S+@\S+\.\S+/.test(email);
};

export const isValidName = (name: string): boolean => {
  return /^[A-Za-z\s]+$/.test(name.trim());
}; 