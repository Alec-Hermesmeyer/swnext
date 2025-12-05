import { createContext, useContext, useState, useEffect } from 'react';
import { pageImages as defaultImages } from '@/config/imageConfig';

const ImageContext = createContext({});

export function ImageProvider({ children }) {
  const [assignments, setAssignments] = useState({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const res = await fetch('/api/image-assignments');
        const data = await res.json();
        setAssignments(data.assignments || {});
      } catch (err) {
        console.error('Failed to fetch image assignments:', err);
      } finally {
        setLoaded(true);
      }
    };
    fetchAssignments();
  }, []);

  // Merge assignments with defaults
  const getImage = (page, slot) => {
    const key = `${page}.${slot}`;
    return assignments[key] || defaultImages[page]?.[slot] || '';
  };

  // Get all images for a page with overrides applied
  const getPageImages = (page) => {
    const defaults = defaultImages[page] || {};
    const merged = { ...defaults };

    Object.keys(defaults).forEach((slot) => {
      const key = `${page}.${slot}`;
      if (assignments[key]) {
        merged[slot] = assignments[key];
      }
    });

    return merged;
  };

  return (
    <ImageContext.Provider value={{ getImage, getPageImages, loaded, assignments }}>
      {children}
    </ImageContext.Provider>
  );
}

export function useImages() {
  return useContext(ImageContext);
}

// Hook to get all images for a specific page
export function usePageImages(page) {
  const { getPageImages, loaded } = useContext(ImageContext);
  return { images: getPageImages(page), loaded };
}

// Hook to get a single image
export function useImage(page, slot) {
  const { getImage, loaded } = useContext(ImageContext);
  return { src: getImage(page, slot), loaded };
}
