import { useState, useEffect, useCallback } from 'react';
import { buildUploadProgressUrl } from '@/constants/apiEndpoints';

interface UploadProgressState {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'failed';
  percentage: number;
  message: string;
  error?: string;
}

interface UseUploadProgressOptions {
  uploadId?: string;
  pollInterval?: number;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export const useUploadProgress = (options: UseUploadProgressOptions = {}) => {
  const { uploadId, pollInterval = 1000, onComplete, onError } = options;
  
  const [progress, setProgress] = useState<UploadProgressState>({
    status: 'idle',
    percentage: 0,
    message: 'Ready to upload'
  });

  const [isPolling, setIsPolling] = useState(false);

  const startPolling = useCallback(() => {
    if (!uploadId || isPolling) return;
    
    setIsPolling(true);
    setProgress(prev => ({ ...prev, status: 'uploading', message: 'Uploading...' }));
  }, [uploadId, isPolling]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      status: 'idle',
      percentage: 0,
      message: 'Ready to upload'
    });
    setIsPolling(false);
  }, []);

  // Poll for upload progress
  useEffect(() => {
    if (!isPolling || !uploadId) return;

    const pollProgress = async () => {
      try {
        const response = await fetch(buildUploadProgressUrl(uploadId));
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        
        setProgress({
          status: data.status || 'uploading',
          percentage: data.pct || 0,
          message: data.message || 'Processing...'
        });

        // Check if upload is complete
        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          
          if (data.status === 'completed') {
            onComplete?.();
          } else if (data.status === 'failed') {
            onError?.(data.error || 'Upload failed');
          }
        }
      } catch (error) {
        console.error('Failed to fetch upload progress:', error);
        setProgress(prev => ({
          ...prev,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
        setIsPolling(false);
        onError?.(error instanceof Error ? error.message : 'Unknown error');
      }
    };

    const interval = setInterval(pollProgress, pollInterval);
    return () => clearInterval(interval);
  }, [isPolling, uploadId, pollInterval, onComplete, onError]);

  return {
    progress,
    isPolling,
    startPolling,
    stopPolling,
    resetProgress
  };
};
