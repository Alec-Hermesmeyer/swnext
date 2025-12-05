// Centralized image configuration for all pages
// Maps image keys to their Supabase storage paths

const IMAGE_BASE_URL = 'https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public';
const GALLERY_BASE_URL = `${IMAGE_BASE_URL}/galleryImages`;

export const pageImages = {
  // Homepage specific images
  homepage: {
    hero: `${IMAGE_BASE_URL}/trucks2.webp`,
    infoBlock1: `${IMAGE_BASE_URL}/IMG_8061.webp`,
    infoBlock2: `${IMAGE_BASE_URL}/IMG_7620.webp`, 
    infoBlock3: `${IMAGE_BASE_URL}/IMG_7653.webp`,
    // Service cards - mapping from broken local paths to working Supabase URLs
    pierDrillingCard: `${IMAGE_BASE_URL}/redrig.webp`,
    limitedAccessCard: `${IMAGE_BASE_URL}/home1.webp`,
    turnKeyCard: `${IMAGE_BASE_URL}/rigcraneposing.webp`,
    craneCard: `${IMAGE_BASE_URL}/newimages/IMG_6825.webp`,
    helicalPilesCard: `${IMAGE_BASE_URL}/Pratt3.webp`,
    safetyCard: `${IMAGE_BASE_URL}/IMG_7642.webp`,
    contactCTA: `${IMAGE_BASE_URL}/IMG_7753.webp`
  },

  // Hero/Banner Images
  hero: {
    main: `${IMAGE_BASE_URL}/trucks2.webp`,
    service: `${IMAGE_BASE_URL}/IMG_7517.webp`,
    about: `${IMAGE_BASE_URL}/IMG_7297.webp`,
    contact: `${IMAGE_BASE_URL}/rig112211.webp`,
    careers: `${IMAGE_BASE_URL}/newimages/IMG_5171.webp`,
    pierDrilling: `${IMAGE_BASE_URL}/newimages/IMG_8084.webp`,
    footer: `${IMAGE_BASE_URL}/IMG_7753.webp`,
    // Correct images from GitHub repo
    safety: `${IMAGE_BASE_URL}/IMG_7642.webp`, // Main safety hero image
    coreValues: `${IMAGE_BASE_URL}/coreValue.webp` // Core values hero image
  },
  
  // Service Images - Correct mappings from GitHub repo
  services: {
    // Service card images from services.jsx
    preparation: `${IMAGE_BASE_URL}/preperation.webp`,
    pratt1: `${IMAGE_BASE_URL}/prat1e.webp`,
    cutting: `${IMAGE_BASE_URL}/indacut.webp`,
    home: `${IMAGE_BASE_URL}/home.webp`,
    pratt3: `${IMAGE_BASE_URL}/Pratt3.webp`,
    
    // Hero images for service pages - from GitHub repo
    servicesHero: `${IMAGE_BASE_URL}/galleryImages/gal18.webp`, // Main services page
    pierDrillingHero: `${IMAGE_BASE_URL}/redrig.webp`, // Pier drilling page
    limitedAccessHero: `${IMAGE_BASE_URL}/home1.webp`, // Limited access page
    craneHero: `${IMAGE_BASE_URL}/newimages/IMG_6825.webp`, // Crane services page
    helicalPilesHero: `${IMAGE_BASE_URL}/Pratt3.webp`, // Helical piles page
    turnKeyHero: `${IMAGE_BASE_URL}/rigcraneposing.webp`, // Turn-key page
    
    // Content images for service pages - fixed broken gallery paths
    pierDrillingContent: `${IMAGE_BASE_URL}/redrig.webp`,
    limitedAccessContent: `${IMAGE_BASE_URL}/home1.webp`,
    craneContent: `${IMAGE_BASE_URL}/newimages/IMG_6825.webp`,
    helicalPilesContent: `${IMAGE_BASE_URL}/Pratt3.webp`,
    turnKeyContent: `${IMAGE_BASE_URL}/rigcraneposing.webp`,
    safetyContent: `${IMAGE_BASE_URL}/IMG_7642.webp`, // was /galleryImages/gal35.jpeg
    contactCTA: `${IMAGE_BASE_URL}/IMG_7753.webp`
  },
  
  // Blog/Social Images
  social: {
    defaultOg: `${IMAGE_BASE_URL}/att.webp`
  },

  // Gallery Images - dynamically loaded from Supabase
  gallery: {
    baseUrl: GALLERY_BASE_URL
  }
};

// Export base URLs for dynamic image loading
export const imageBaseUrls = {
  main: IMAGE_BASE_URL,
  gallery: GALLERY_BASE_URL
};

// Helper function to get image URL with optional version/timestamp
export const getImageUrl = (category, imageName, version = null) => {
  const baseUrl = pageImages[category]?.[imageName];
  if (!baseUrl) {
    console.warn(`Image not found: ${category}.${imageName}`);
    return '';
  }
  return version ? `${baseUrl}?version=${version}` : baseUrl;
};

// Function to preload critical images
export const preloadCriticalImages = () => {
  const criticalImages = [
    pageImages.hero.main,
    pageImages.hero.service,
    pageImages.hero.about
  ];
  
  if (typeof window !== 'undefined') {
    criticalImages.forEach(src => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = src;
      document.head.appendChild(link);
    });
  }
};