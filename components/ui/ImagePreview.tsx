"use client";

import * as React from "react";
import { Image as ImageIcon } from "lucide-react";

type Props = {
  src: string;
  alt: string;
  fileName?: string;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
};

export function ImagePreview({
  src,
  alt,
  fileName = "",
  className = "w-full h-auto object-contain rounded-lg shadow-sm",
  onLoad,
  onError,
}: Props) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [errored, setErrored] = React.useState(false);

  React.useEffect(() => {
    setIsLoading(true);
    setErrored(false);
  }, [src]);

  return (
    <div className="relative bg-gray-50">
      {!errored && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${isLoading ? "opacity-0" : "opacity-100"}`}
          crossOrigin="anonymous"
          onLoad={() => {
            setIsLoading(false);
            onLoad?.();
          }}
          onError={(e) => {
            console.error("Failed to load image:", src, "for file:", fileName, e);
            setErrored(true);
            setIsLoading(false);
            onError?.();
          }}
        />
      )}

      {isLoading && !errored && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="text-center">
            <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-500">Loading…</p>
          </div>
        </div>
      )}

      {errored && (
        <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
          <div className="text-center">
            <ImageIcon className="h-10 w-10 text-blue-500 mx-auto mb-2" />
            <p className="text-xs font-medium text-blue-600">Image</p>
            <p className="text-xs text-blue-500 mt-1">{fileName.split(".").pop()?.toUpperCase()}</p>
            <p className="text-xs text-gray-400 mt-1">Failed to load</p>
          </div>
        </div>
      )}
    </div>
  );
}
