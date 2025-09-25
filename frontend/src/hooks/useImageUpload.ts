import { useState, useCallback } from 'react';

interface UseImageUploadReturn {
  imagePreview: string | null;
  imageBase64: string | null;
  isUploading: boolean;
  error: string | null;
  handleImageUpload: (file: File) => Promise<void>;
  clearImage: () => void;
  setImageFromBase64: (base64: string) => void;
}

/**
 * Hook personnalisé pour gérer l'upload d'images et leur conversion en base64
 * @param maxSizeInMB - Taille maximale autorisée en MB (défaut: 5MB)
 * @param allowedTypes - Types MIME autorisés (défaut: images courantes)
 */
export const useImageUpload = (
  maxSizeInMB: number = 5,
  allowedTypes: string[] = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
): UseImageUploadReturn => {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Convertit un fichier en base64
   */
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Erreur lors de la conversion en base64'));
        }
      };
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Valide le fichier image
   */
  const validateFile = (file: File): string | null => {
    // Vérifier le type de fichier
    if (!allowedTypes.includes(file.type)) {
      return `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`;
    }

    // Vérifier la taille du fichier
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      return `Le fichier est trop volumineux. Taille maximale: ${maxSizeInMB}MB`;
    }

    return null;
  };

  /**
   * Gère l'upload d'une image
   */
  const handleImageUpload = useCallback(async (file: File) => {
    setIsUploading(true);
    setError(null);

    try {
      // Valider le fichier
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      // Convertir en base64
      const base64 = await fileToBase64(file);
      
      // Mettre à jour les états
      setImagePreview(base64);
      setImageBase64(base64);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du traitement de l\'image';
      setError(errorMessage);
      console.error('Erreur lors de l\'upload de l\'image:', err);
    } finally {
      setIsUploading(false);
    }
  }, [maxSizeInMB, allowedTypes]);

  /**
   * Efface l'image sélectionnée
   */
  const clearImage = useCallback(() => {
    setImagePreview(null);
    setImageBase64(null);
    setError(null);
  }, []);

  /**
   * Définit une image à partir d'une chaîne base64 (utile pour l'édition)
   */
  const setImageFromBase64 = useCallback((base64: string) => {
    setImagePreview(base64);
    setImageBase64(base64);
    setError(null);
  }, []);

  return {
    imagePreview,
    imageBase64,
    isUploading,
    error,
    handleImageUpload,
    clearImage,
    setImageFromBase64,
  };
};