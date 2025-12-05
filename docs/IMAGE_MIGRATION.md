# Image Migration Guide

## Problem
Images not matching between development and live site due to:
- Hardcoded Supabase URLs in components
- Inconsistent path structures
- No centralized image management

## Solution Implementation

### 1. Created centralized image config
- Location: `/config/imageConfig.js`
- Maps all page images to Supabase URLs
- Provides helper functions for image retrieval

### 2. Fixed Supabase image loader
- Updated to handle both relative and absolute paths
- Extracts project ID from environment or uses default

### 3. Created verification script
- Location: `/scripts/verifyImages.js`
- Checks all configured images for availability
- Generates report of missing images

## How to Update Components

### Before (hardcoded):
```jsx
style={{backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7517.webp')"}}
```

### After (using config):
```jsx
import { pageImages } from '@/config/imageConfig';

// In component:
style={{backgroundImage: `url('${pageImages.hero.service}')`}}
```

## Next Steps

1. **Run verification**: `node scripts/verifyImages.js`
2. **Check Supabase Storage** for correct paths
3. **Update imageConfig.js** with correct URLs from live site
4. **Migrate components** to use centralized config
5. **Test locally** to ensure images load

## Components to Update

- [ ] `/components/Hero.jsx`
- [ ] `/components/ServiceHero.jsx`
- [ ] `/components/AboutHero.jsx`
- [ ] `/pages/services.jsx`
- [ ] `/pages/about.jsx`
- [ ] `/pages/careers.jsx`
- [ ] `/pages/contact.jsx`
- [ ] `/pages/pier-drilling.jsx`

## Verification Checklist

- [ ] All images load in development
- [ ] Image paths match live site structure
- [ ] No 404 errors in console
- [ ] Responsive images work correctly
- [ ] SEO/OG images are accessible