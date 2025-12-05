import { useState, useEffect } from 'react';
import { pageImages } from '@/config/imageConfig';

// Cache for assignments to avoid re-fetching
let assignmentsCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Hook to get page images with dynamic assignment support
 * Falls back to default pageImages if no assignment exists
 *
 * @param {string} page - The page category (e.g., 'homepage', 'hero', 'services')
 * @returns {object} - Object containing image URLs for the page
 */
export function usePageImages(page) {
  const [images, setImages] = useState(pageImages[page] || {});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      // Use cache if still valid
      const now = Date.now();
      if (assignmentsCache && (now - cacheTimestamp) < CACHE_DURATION) {
        applyAssignments(assignmentsCache);
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/image-assignments');
        const data = await res.json();
        assignmentsCache = data.assignments || {};
        cacheTimestamp = now;
        applyAssignments(assignmentsCache);
      } catch (err) {
        console.error('Failed to fetch image assignments:', err);
      } finally {
        setLoading(false);
      }
    };

    const applyAssignments = (assignments) => {
      const defaults = pageImages[page] || {};
      const merged = { ...defaults };

      // Override with any saved assignments
      Object.keys(defaults).forEach((slot) => {
        const key = `${page}.${slot}`;
        if (assignments[key]) {
          merged[slot] = assignments[key];
        }
      });

      setImages(merged);
    };

    fetchAssignments();
  }, [page]);

  return { images, loading };
}

/**
 * Get a single image URL with assignment override
 * Synchronous version - checks cache only, falls back to default
 *
 * @param {string} page - The page category
 * @param {string} slot - The image slot
 * @returns {string} - The image URL
 */
export function getPageImage(page, slot) {
  const key = `${page}.${slot}`;

  // Check cache first
  if (assignmentsCache && assignmentsCache[key]) {
    return assignmentsCache[key];
  }

  // Fall back to default
  return pageImages[page]?.[slot] || '';
}

/**
 * Preload assignments cache
 * Call this early in your app to populate the cache
 */
export async function preloadAssignments() {
  try {
    const res = await fetch('/api/image-assignments');
    const data = await res.json();
    assignmentsCache = data.assignments || {};
    cacheTimestamp = Date.now();
    return assignmentsCache;
  } catch (err) {
    console.error('Failed to preload assignments:', err);
    return {};
  }
}

export default usePageImages;
