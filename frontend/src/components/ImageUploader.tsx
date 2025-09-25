// FILE: components/ImageUploader.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Image as ImageIcon, Camera } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface ImageUploaderProps {
  onUpload: (base64: string) => void;
  currentImage?: string;
  maxSizeInMB?: number;
  acceptedFormats?: string[];
  className?: string;
}

export function ImageUploader({
  onUpload,
  currentImage,
  maxSizeInMB = 5,
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp'],
  className = '',
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Erreur lors de la conversion en base64'));
        }
      };
      reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
      reader.readAsDataURL(file);
    });
  }, []);

  const validateFile = useCallback((file: File): string | null => {
    // Vérifier le format
    if (!acceptedFormats.includes(file.type)) {
      return `Format non supporté. Formats acceptés: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`;
    }

    // Vérifier la taille
    const sizeInMB = file.size / (1024 * 1024);
    if (sizeInMB > maxSizeInMB) {
      return `Fichier trop volumineux. Taille maximum: ${maxSizeInMB}MB`;
    }

    return null;
  }, [acceptedFormats, maxSizeInMB]);

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);

    try {
      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // Convertir en base64
      const base64 = await convertToBase64(file);
      
      // Mettre à jour le preview
      setPreview(base64);
      
      // Notifier le parent
      onUpload(base64);
      
      toast.success('Image uploadée avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    } finally {
      setIsLoading(false);
    }
  }, [convertToBase64, validateFile, onUpload]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const removeImage = useCallback(() => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onUpload]);

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative">
          <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-gray-200">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          <button
            onClick={removeImage}
            disabled={isLoading}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors disabled:opacity-50"
            title="Supprimer l'image"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={openFileDialog}
          className={`
            relative w-full h-64 border-2 border-dashed border-gray-300 rounded-lg
            flex flex-col items-center justify-center cursor-pointer
            hover:border-green-400 hover:bg-green-50 transition-colors
            ${isLoading ? 'pointer-events-none opacity-50' : ''}
          `}
        >
          {isLoading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="text-sm text-gray-600">Upload en cours...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <ImageIcon className="h-8 w-8 text-gray-400" />
                </div>
                
                <div className="text-center">
                  <p className="text-lg font-medium text-gray-900 mb-1">
                    Ajouter une image
                  </p>
                  <p className="text-sm text-gray-600 mb-2">
                    Glissez-déposez ou cliquez pour sélectionner
                  </p>
                  <p className="text-xs text-gray-500">
                    Formats: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')} • 
                    Max: {maxSizeInMB}MB
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm font-medium">Choisir un fichier</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Camera className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600">Ou prendre une photo</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Formats supportés: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}</p>
        <p>• Taille maximum: {maxSizeInMB}MB</p>
        <p>• L'image sera automatiquement redimensionnée si nécessaire</p>
      </div>
    </div>
  );
}