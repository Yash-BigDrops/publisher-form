"use client";

import React from "react";
import { CheckCircle, RotateCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface SuccessScreenProps {
  trackingLink: string;
  handleResetForm: () => void;
}

export default function SuccessScreen({
  trackingLink,
  handleResetForm,
}: SuccessScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-center mb-2">
            Form Submitted Successfully!
          </h2>
          <p className="text-muted-foreground text-center">
            Thank you for your submission. Please save your tracking link.
          </p>
          {trackingLink && (
            <div className="mt-6 w-full text-center">
              <p className="text-sm text-gray-600">Your tracking link is:</p>
              <div className="mt-2 w-full bg-gray-100 p-3 rounded-md text-center">
                <a
                  href={trackingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-mono break-all"
                >
                  {trackingLink}
                </a>
              </div>
            </div>
          )}
          <button
            onClick={handleResetForm}
            className="mt-8 w-full bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-semibold rounded-lg shadow-md hover:shadow-lg hover:shadow-sky-200 transition-all duration-300 active:scale-95 py-3 px-6"
          >
            <RotateCw className="mr-2 h-4 w-4 inline" /> Submit Another Request
          </button>
        </CardContent>
      </Card>
    </div>
  );
} 