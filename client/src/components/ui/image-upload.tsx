import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  currentImageUrl?: string;
  onImageRemoved?: () => void;
  className?: string;
}

// Compress image to reduce file size and storage costs
const compressImage = (file: File, maxWidth = 400, maxHeight = 300, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create compressed blob'));
          }
        }, 'image/jpeg', quality);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    // Use createObjectURL for better mobile compatibility
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after a timeout as fallback
    setTimeout(() => {
      URL.revokeObjectURL(objectUrl);
    }, 10000);
  });
};

export function ImageUpload({ onImageUploaded, currentImageUrl, onImageRemoved, className }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsUploading(true);

      // Compress the image
      const compressedBlob = await compressImage(file);
      
      if (!compressedBlob) {
        throw new Error("Failed to compress image");
      }

      // Create preview
      const previewUrl = URL.createObjectURL(compressedBlob);
      setPreviewUrl(previewUrl);

      // Get upload URL from server
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const uploadResponse = await response.json();
      const { uploadURL } = uploadResponse;
      
      if (!uploadURL) {
        throw new Error('No upload URL received from server');
      }

      // Upload compressed image directly to object storage
      const uploadResult = await fetch(uploadURL, {
        method: 'PUT',
        body: compressedBlob,
        headers: {
          'Content-Type': 'image/jpeg',
        },
      });

      if (!uploadResult.ok) {
        const errorText = await uploadResult.text().catch(() => 'Network error');
        throw new Error(`Upload failed: ${uploadResult.status} - ${errorText}`);
      }

      // Update server with the uploaded image info
      const updateResponse = await fetch('/api/vision-images', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          imageURL: uploadURL.split('?')[0], // Remove query parameters
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Server error: ${updateResponse.status}`);
      }
      
      const updateData = await updateResponse.json();
      const { objectPath } = updateData;
      
      if (!objectPath) {
        throw new Error('No object path received from server');
      }

      onImageUploaded(objectPath);
      
      toast({
        title: "Image uploaded successfully!",
        description: "Your vision board image has been added.",
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Upload failed",
        description: `Error: ${errorMessage}. Please try again.`,
        variant: "destructive"
      });
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    onImageRemoved?.();
  };

  const displayImageUrl = previewUrl || currentImageUrl;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium">Vision Image</label>
        {displayImageUrl && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {displayImageUrl ? (
        <div className="relative">
          <img 
            src={displayImageUrl}
            alt="Vision preview"
            className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-2 right-2"
          >
            Change
          </Button>
        </div>
      ) : (
        <div 
          className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            {isUploading ? (
              <>
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Click to upload image</p>
                <p className="text-xs text-gray-400">JPG, PNG up to 5MB</p>
              </>
            )}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
}