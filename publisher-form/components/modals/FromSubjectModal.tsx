"use client";

import React from "react";
import { Bot } from "lucide-react";

interface FromSubjectModalProps {
  fromLine: string;
  subjectLines: string;
  aiLoading: boolean;
  setFromLine: (line: string) => void;
  setSubjectLines: (lines: string) => void;
  enhanceWithClaude: () => void;
  closeModal: () => void;
}

export default function FromSubjectModal({
  fromLine,
  subjectLines,
  aiLoading,
  setFromLine,
  setSubjectLines,
  enhanceWithClaude,
  closeModal,
}: FromSubjectModalProps) {
  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="bg-white rounded-lg p-8">
        <h3 className="text-2xl font-semibold mb-8 font-sans text-gray-800">
          From & Subject Lines
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-700 font-sans">
              From Lines
            </label>
            <textarea
              placeholder="Enter your from lines here..."
              value={fromLine}
              onChange={(e) => setFromLine(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-6 min-h-[400px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none text-base"
            />
          </div>

          <div className="space-y-4">
            <label className="block text-lg font-medium text-gray-700 font-sans">
              Subject Lines
            </label>
            <textarea
              placeholder="Enter your subject lines here..."
              value={subjectLines}
              onChange={(e) => setSubjectLines(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-6 min-h-[400px] font-sans text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-400 transition-all duration-300 hover:border-sky-300 focus:border-sky-400 resize-none text-base"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={enhanceWithClaude}
            disabled={aiLoading}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed font-sans font-medium flex items-center gap-2 transition-all duration-300 active:scale-95"
          >
            <Bot size={20} className="inline-block" />
            {aiLoading ? "Generating AI Suggestions..." : "AI Suggest From & Subject Lines"}
          </button>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={closeModal}
            className="bg-sky-400 hover:bg-sky-500 active:bg-sky-600 text-white font-sans font-medium py-4 px-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 active:scale-95 text-lg"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
} 