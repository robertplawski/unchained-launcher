import { useState, useEffect } from 'react';

// Simple in-memory cache for images
const imageCache = new Map<string, string>();

export const useImageCache = (imageUrl?: string) => {
  const [cachedImageUrl, setCachedImageUrl] = useState<string | undefined>(imageUrl);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!imageUrl) {
      setCachedImageUrl(undefined);
      setLoading(false);
      return;
    }

    // Check if image is already in cache
    if (imageCache.has(imageUrl)) {
      setCachedImageUrl(imageCache.get(imageUrl));
      setLoading(false);
      return;
    }

    // Load image and cache it
    setLoading(true);
    const img = new Image();
    
    img.onload = () => {
      // Convert image to data URL for caching
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          imageCache.set(imageUrl, dataUrl);
          setCachedImageUrl(dataUrl);
        } catch (e) {
          // If canvas conversion fails, use original URL
          imageCache.set(imageUrl, imageUrl);
          setCachedImageUrl(imageUrl);
        }
      } else {
        // If canvas context is not available, use original URL
        imageCache.set(imageUrl, imageUrl);
        setCachedImageUrl(imageUrl);
      }
      setLoading(false);
    };

    img.onerror = () => {
      // If image fails to load, use original URL
      imageCache.set(imageUrl, imageUrl);
      setCachedImageUrl(imageUrl);
      setLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return { cachedImageUrl, loading };
};