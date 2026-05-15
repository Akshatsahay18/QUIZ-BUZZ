"use client";
/* eslint-disable @next/next/no-img-element */

import { ImageKitProvider, IKUpload } from "imagekitio-next";
import { ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import {
  QUESTION_IMAGE_ACCEPTED_TYPES,
  QUESTION_IMAGE_MAX_BYTES,
} from "@/lib/question-builder";

type AuthParams = {
  signature: string;
  token: string;
  expire: number;
};

type UploadResponse = {
  url: string;
};

interface QuestionImageUploadProps {
  questionId: string;
  image?: string;
  isUploading?: boolean;
  onImageChange: (image?: string) => void;
  onUploadingChange: (isUploading: boolean) => void;
}

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

export function QuestionImageUpload({
  questionId,
  image,
  isUploading = false,
  onImageChange,
  onUploadingChange,
}: QuestionImageUploadProps) {
  const inputId = useId();
  const uploadRef = useRef<(HTMLInputElement & { abort?: () => void }) | null>(
    null
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const authenticator = async (): Promise<AuthParams> => {
    const response = await fetch("/api/imagekit-auth");

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Unable to authenticate upload.");
    }

    return (await response.json()) as AuthParams;
  };

  const validateFile = (file: File) => {
    if (!QUESTION_IMAGE_ACCEPTED_TYPES.includes(file.type as never)) {
      setError("Only JPG, PNG, and WEBP files are allowed.");
      return false;
    }

    if (file.size > QUESTION_IMAGE_MAX_BYTES) {
      setError("Image must be 5MB or smaller.");
      return false;
    }

    setError(null);
    return true;
  };

  const handleUploadStart = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    onUploadingChange(true);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUploadSuccess = (response: UploadResponse) => {
    onUploadingChange(false);
    setError(null);
    onImageChange(response.url);
  };

  const handleUploadError = (uploadError: { message: string }) => {
    onUploadingChange(false);
    setError(uploadError.message || "Upload failed. Please try again.");
  };

  const handleRemove = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    if (uploadRef.current?.value) {
      uploadRef.current.value = "";
    }

    setError(null);
    onUploadingChange(false);
    onImageChange(undefined);
  };

  const displayImage = previewUrl ?? image;
  const uploadsConfigured = Boolean(publicKey && urlEndpoint);

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            Optional question image
          </label>
          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, or WEBP up to 5MB.
          </p>
        </div>
        {displayImage ? (
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-2 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Remove image
          </button>
        ) : null}
      </div>

      <div className="min-h-52 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50">
        {uploadsConfigured ? (
          <ImageKitProvider
            publicKey={publicKey}
            urlEndpoint={urlEndpoint}
            authenticator={authenticator}
          >
            <IKUpload
              id={inputId}
              ref={uploadRef}
              accept=".jpg,.jpeg,.png,.webp"
              className="sr-only"
              fileName={`${questionId}-question-image`}
              folder="/quiz-buzz/questions"
              useUniqueFileName
              validateFile={validateFile}
              onUploadStart={handleUploadStart}
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          </ImageKitProvider>
        ) : null}

        {displayImage ? (
          <div className="relative h-52 w-full bg-slate-100">
            <img
              src={displayImage}
              alt="Uploaded preview for this question"
              className="h-full w-full object-cover"
            />
            {isUploading ? (
              <div
                aria-live="polite"
                className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-white"
              >
                <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Uploading image...
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex h-52 flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm">
              <ImagePlus className="size-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-slate-800">
                Add a visual hint to this question
              </p>
              <p className="text-sm text-slate-500">
                Upload an optional image to make the prompt more engaging.
              </p>
            </div>
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              disabled={!uploadsConfigured || isUploading}
              className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="size-4" aria-hidden="true" />
                  Upload image
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {!uploadsConfigured ? (
        <p className="text-xs text-amber-700">
          Image uploads are unavailable until the ImageKit environment variables
          are configured.
        </p>
      ) : null}

      {displayImage && !isUploading ? (
        <button
          type="button"
          onClick={() => uploadRef.current?.click()}
          className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          <UploadCloud className="size-4" aria-hidden="true" />
          Replace image
        </button>
      ) : null}

      {error ? (
        <p aria-live="polite" className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
