import { notFound } from "next/navigation";
import Link from "next/link";

interface ThankYouPageProps {
  params: Promise<{ submissionId: string }>;
  searchParams: Promise<{ 
    type?: string; 
    count?: string; 
    trackingLink?: string;
  }>;
}

export default async function ThankYou({ params, searchParams }: ThankYouPageProps) {
  const { submissionId } = await params;
  const { type, count, trackingLink } = await searchParams;
  
  if (!submissionId || submissionId === "unknown") {
    return notFound();
  }



  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h1>
          <p className="text-gray-600 mb-2">
            Your creative has been successfully submitted.
          </p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Submission ID: <span className="font-mono font-semibold">{submissionId}</span></p>
            {type && (
              <p>Type: <span className="font-mono">{type}</span></p>
            )}
            {count && (
              <p>Files: <span className="font-mono">{count}</span></p>
            )}
          </div>
          {trackingLink && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">Track your submission:</p>
              <a 
                className="text-blue-600 underline break-all text-sm hover:text-blue-800" 
                href={trackingLink} 
                target="_blank" 
                rel="noreferrer"
              >
                {trackingLink}
              </a>
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            Submit Another Creative
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}