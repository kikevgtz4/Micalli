// frontend/src/components/profile/ProfilePicture.tsx
"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import apiService from "@/lib/api";
import { toast } from "react-hot-toast";
import { validateFile } from "@/utils/validation";
import { getImageUrl } from "@/utils/imageUrls";

export default function ProfilePicture() {
  const { user, updateProfile } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log("=== USER STATE CHANGED IN PROFILE PICTURE ===");
    console.log("Current user object:", user);
    console.log("Profile picture from user:", user?.profilePicture);
    console.log("Preview URL:", previewUrl);
    console.log("Selected file:", selectedFile?.name);
  }, [user, previewUrl, selectedFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file, 5, [
      "image/jpeg",
      "image/png",
      "image/gif",
    ]);
    if (!validation.isValid) {
      toast.error(validation.error || "Invalid file");
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append("profile_picture", selectedFile);

      const response = await apiService.auth.uploadProfilePicture(formData);

      // FIX 1: Use the correct field name (profilePicture instead of profile_picture)
      const profilePictureUrl = response.data.profilePicture;
      console.log("Profile picture URL from response:", profilePictureUrl);

      // Update auth context
      await updateProfile({ profilePicture: profilePictureUrl });

      // Clear preview
      setPreviewUrl(null);
      setSelectedFile(null);

      toast.success("Profile picture updated successfully!");
    } catch (error: any) {
      console.error("Upload failed:", error);
      const errorMessage =
        error.response?.data?.detail ||
        error.response?.data?.profilePicture?.[0] ||
        "Failed to upload profile picture";
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!user?.profilePicture) return;

    try {
      setIsRemoving(true);

      await apiService.auth.removeProfilePicture();

      // Update auth context
      await updateProfile({ profile_picture: null });

      toast.success("Profile picture removed successfully!");
    } catch (error: any) {
      console.error("Failed to remove profile picture:", error);
      const errorMessage =
        error.response?.data?.detail || "Failed to remove profile picture";
      toast.error(errorMessage);
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Use the image utility to get proper URLs
  const currentImageUrl = previewUrl || getImageUrl(user?.profilePicture);

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900">Profile Picture</h3>
        <p className="mt-1 text-sm text-gray-600">
          Upload a profile picture to help others recognize you.
        </p>
      </div>

      <div className="flex items-start space-x-6">
        {/* Current/Preview Image */}
        <div className="flex-shrink-0">
          <div className="relative">
            {currentImageUrl ? (
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-200">
                <Image
                  src={currentImageUrl}
                  alt="Profile picture"
                  width={128}
                  height={128}
                  className="w-full h-full object-cover"
                  unoptimized={currentImageUrl.startsWith("data:")} // Don't optimize base64 previews
                />
              </div>
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center border-4 border-gray-200">
                <UserIcon className="w-16 h-16 text-gray-400" />
              </div>
            )}

            {/* Preview indicator */}
            {previewUrl && (
              <div className="absolute -top-2 -right-2">
                <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  Preview
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upload Controls */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Button */}
            <div>
              <button
                type="button"
                onClick={triggerFileInput}
                disabled={isUploading || isRemoving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                <PhotoIcon className="w-5 h-5 mr-2 text-gray-400" />
                {currentImageUrl ? "Change Picture" : "Upload Picture"}
              </button>
            </div>

            {/* Preview Actions */}
            {previewUrl && (
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4 mr-2" />
                      Save Picture
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelPreview}
                  disabled={isUploading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <XMarkIcon className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </div>
            )}

            {/* Remove Button */}
            {user?.profilePicture && !previewUrl && (
              <div>
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isRemoving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                >
                  {isRemoving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-red-700 mr-2"></div>
                      Removing...
                    </>
                  ) : (
                    <>
                      <TrashIcon className="w-4 h-4 mr-2" />
                      Remove Picture
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Upload Guidelines */}
            <div className="text-sm text-gray-500">
              <p className="font-medium mb-2">Guidelines:</p>
              <ul className="space-y-1">
                <li>• Maximum file size: 5MB</li>
                <li>• Supported formats: JPEG, PNG, GIF</li>
                <li>• Recommended dimensions: 400x400 pixels</li>
                <li>• Use a clear, professional photo</li>
              </ul>
            </div>

            {/* File Size Warning */}
            {selectedFile && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-blue-700">
                      <strong>Selected file:</strong> {selectedFile.name}
                    </p>
                    <p className="text-sm text-blue-700">
                      <strong>Size:</strong>{" "}
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Icon components
function UserIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
      />
    </svg>
  );
}

function PhotoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
      />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

function XMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
      />
    </svg>
  );
}

function InformationCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      {...props}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
      />
    </svg>
  );
}
