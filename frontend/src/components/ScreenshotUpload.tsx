'use client';

import { useState, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, FileImage, Loader2, CheckCircle } from 'lucide-react';

interface ScreenshotUploadProps {
  onUpload: (pages: { imageBase64: string; pageNumber: number }[]) => void;
  maxFiles?: number;
}

export default function ScreenshotUpload({ onUpload, maxFiles = 10 }: ScreenshotUploadProps) {
  const [files, setFiles] = useState<{ file: File; preview: string; base64: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    setIsProcessing(true);
    
    const validFiles = Array.from(newFiles).filter(file => 
      file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024
    );

    const processed = await Promise.all(
      validFiles.slice(0, maxFiles - files.length).map(async (file) => {
        const base64 = await processFile(file);
        return {
          file,
          preview: URL.createObjectURL(file),
          base64
        };
      })
    );

    const updatedFiles = [...files, ...processed].slice(0, maxFiles);
    setFiles(updatedFiles);
    
    // Notify parent
    onUpload(updatedFiles.map((f, i) => ({
      imageBase64: f.base64,
      pageNumber: i + 1
    })));

    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  }, [files]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onUpload(updated.map((f, i) => ({
      imageBase64: f.base64,
      pageNumber: i + 1
    })));
  };

  const clearAll = () => {
    files.forEach(f => URL.revokeObjectURL(f.preview));
    setFiles([]);
    onUpload([]);
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50'
          }
        `}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
            <p className="text-gray-600">Processing images...</p>
          </div>
        ) : (
          <>
            <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="text-gray-700 font-medium">
              Drop screenshots here or click to upload
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Up to {maxFiles} images • PNG, JPG, GIF • Max 10MB each
            </p>
          </>
        )}
      </div>

      {/* Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {files.length} screenshot{files.length !== 1 ? 's' : ''} ready
            </span>
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white"
              >
                <img
                  src={file.preview}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Page number badge */}
                <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white font-medium">
                  {index + 1}
                </div>
                
                {/* Remove button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Success indicator */}
                <div className="absolute bottom-1 right-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
              </div>
            ))}
            
            {/* Add more button */}
            {files.length < maxFiles && (
              <label className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-400 flex items-center justify-center cursor-pointer transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => e.target.files && handleFiles(e.target.files)}
                  className="hidden"
                />
                <div className="text-center">
                  <FileImage className="w-6 h-6 text-gray-400 mx-auto" />
                  <span className="text-xs text-gray-500 mt-1">Add more</span>
                </div>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
}