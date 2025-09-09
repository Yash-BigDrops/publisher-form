// API Endpoints Configuration
// This file centralizes all API endpoint definitions to ensure consistency
// between frontend and backend implementations

export const API_ENDPOINTS = {
  // File Upload & Management
  UPLOAD: '/api/upload',
  UPLOAD_ZIP: '/api/upload-zip', 
  UPLOAD_URL: '/api/upload-url',
  UPLOAD_PROGRESS: '/api/upload-progress',
  ANALYZE_ZIP: '/api/analyze-zip',
  GET_FILE_CONTENT: '/api/get-file-content',
  
  // File Operations
  FILES: '/api/files',
  FILES_BULK_DELETE: '/api/files/bulk-delete',
  
  // Creative Management
  CREATIVE_SAVE: '/api/creative/save',
  CREATIVE_SAVE_HTML: '/api/creative/save-html',
  CREATIVE_SAVE_METADATA: '/api/creative/save-metadata',
  CREATIVE_GET_METADATA: '/api/creative/get-metadata',
  CREATIVE_RENAME: '/api/creative/rename',
  CREATIVE_DELETE: '/api/creative/delete',
  
  // Content Generation & Proofreading
  GENERATE_EMAIL_CONTENT: '/api/generate-email-content',
  ANALYZE_CREATIVES: '/api/analyze-creatives',
  PROOFREAD: '/api/proofread',
  PROOFREAD_CREATIVE: '/api/proofread-creative',
  PROOFREAD_IMAGE: '/api/proofread-image',
  PROOFREAD_TEXT: '/api/proofread-text',
  
  // External Integrations
  EVERFLOW_OFFERS: '/api/everflow/offers',
  
  // Telegram Integration
  TELEGRAM_VERIFY: '/api/telegram/verify',
  TELEGRAM_POLL: '/api/telegram/poll',
  TELEGRAM_WEBHOOK: '/api/telegram-webhook', // Note: This is a separate endpoint, not in /telegram/ folder
  CHECK_TELEGRAM_START: '/api/check-telegram-start',
  
  // Submissions & Tracking
  SUBMISSIONS: '/api/submissions',
  
  // ZIP Preview (Optional - for advanced ZIP preview functionality)
  ZIP_PREVIEW: '/api/zip/preview'
} as const;

// File serving endpoint patterns
// The backend supports multiple file serving patterns for flexibility:
export const FILE_SERVING_PATTERNS = {
  // Single file by ID
  BY_ID: '/api/files/[id]',
  // File by ID and name
  BY_ID_AND_NAME: '/api/files/[id]/[name]', 
  // Dynamic path serving (most flexible)
  DYNAMIC_PATH: '/api/files/[...path]'
} as const;

// Request/Response type definitions for better type safety
export type ApiEndpoint = typeof API_ENDPOINTS[keyof typeof API_ENDPOINTS];

// Helper function to get endpoint URL
export const getApiEndpoint = (endpoint: keyof typeof API_ENDPOINTS): string => {
  return API_ENDPOINTS[endpoint];
};

// Helper function to build file serving URLs
export const buildFileUrl = (id: string, path?: string): string => {
  if (path) {
    return `/api/files/${encodeURIComponent(id)}/${encodeURIComponent(path)}`;
  }
  return `/api/files/${encodeURIComponent(id)}`;
};

// Helper function to build upload progress URL
export const buildUploadProgressUrl = (uploadId: string): string => {
  return `${API_ENDPOINTS.UPLOAD_PROGRESS}?id=${encodeURIComponent(uploadId)}`;
};
