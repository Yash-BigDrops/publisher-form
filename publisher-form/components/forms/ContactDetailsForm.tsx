"use client";

import React from "react";
import { CreativeFormData, TelegramCheckStatus } from "@/types/creative";
import { CheckCircle, AlertTriangle } from "lucide-react";
import { TELEGRAM_BOT_URL } from "@/constants/creative";

interface ContactDetailsFormProps {
  formData: CreativeFormData;
  errors: { [key: string]: string };
  telegramCheckStatus: TelegramCheckStatus;
  handleInputChange: (field: string, value: string) => void;
  handleTelegramBlur: () => void;
}

export default function ContactDetailsForm({
  formData,
  errors,
  telegramCheckStatus,
  handleInputChange,
  handleTelegramBlur,
}: ContactDetailsFormProps) {
  return (
    <>
      <div className="animate-fade-in">
        <input
          type="email"
          placeholder="Email ID"
          value={formData.contactEmail}
          onChange={(e) => handleInputChange("contactEmail", e.target.value)}
          className={`w-full h-14 border rounded-lg px-4 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 ${
            errors.contactEmail ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.contactEmail && (
          <p className="text-red-500 text-sm mt-1 animate-fade-in">
            {errors.contactEmail}
          </p>
        )}
      </div>

      <div className="animate-fade-in-delay">
        <div className="relative">
          <input
            type="text"
            placeholder="Telegram Username (Optional)"
            value={formData.telegramId}
            onChange={(e) => handleInputChange("telegramId", e.target.value)}
            onBlur={handleTelegramBlur}
            className="w-full h-14 border border-gray-300 rounded-lg px-4 pr-20 font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400"
          />
          
          <button
            type="button"
            onClick={handleTelegramBlur}
            disabled={telegramCheckStatus === "checking"}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all text-sm font-medium"
          >
            {telegramCheckStatus === "checking" ? "Checking..." : "Check"}
          </button>
        </div>

        {telegramCheckStatus === "checking" && (
          <p className="text-gray-500 text-sm mt-1">Checking Telegram connection...</p>
        )}

        {telegramCheckStatus === "unchecked" && formData.telegramId.trim() && (
          <p className="text-gray-500 text-sm mt-1">Click &quot;Check&quot; to verify your Telegram connection</p>
        )}

        {telegramCheckStatus === "not_started" && (
          <div className="mt-2 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-yellow-800 font-medium">Telegram setup required</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                Please follow these steps:
              </p>
              <ol className="text-xs text-yellow-700 mt-1 ml-4 list-decimal">
                <li>Click the &quot;Start Bot&quot; button below to open our bot</li>
                <li>Send <code className="bg-yellow-100 px-1 rounded">/start</code> to the bot</li>
                <li>Come back and click &quot;Check&quot; again</li>
              </ol>
              <div className="flex gap-2 mt-3">
                <a
                  href={TELEGRAM_BOT_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors text-sm font-medium"
                >
                  Start Bot
                </a>
                <button
                  type="button"
                  onClick={handleTelegramBlur}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm font-medium"
                >
                  Check Again
                </button>
              </div>
            </div>
          </div>
        )}

        {telegramCheckStatus === "ok" && (
          <div className="mt-2 flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-800 font-medium">Telegram connected!</p>
              <p className="text-xs text-green-700 mt-0.5">
                You&apos;ll receive notifications on Telegram when your submission is processed.
              </p>
              <button
                type="button"
                onClick={handleTelegramBlur}
                className="text-xs text-sky-600 underline mt-1 hover:text-sky-700"
              >
                Re-check connection
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
} 