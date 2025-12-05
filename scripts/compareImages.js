#!/usr/bin/env node

/**
 * Image Comparison Helper
 * Run this to identify which images need to be updated
 */

console.log(`
🖼️  IMAGE FIXING CHECKLIST
========================

STEP 1: Open these pages on your LIVE SITE and note the images:
---------------------------------------------------------------

1. SAFETY PAGE (swfoundation.com/safety)
   Current Local: /galleryImages/gal12.jpeg
   Currently Using: IMG_7517.webp (TEMPORARY)
   Live Site Shows: _________________ (fill this in)

2. CORE VALUES PAGE (swfoundation.com/core-values)
   Current Local: /coreValue.jpg
   Currently Using: IMG_7297.webp (TEMPORARY)
   Live Site Shows: _________________ (fill this in)

3. PIER DRILLING PAGE (swfoundation.com/pier-drilling)
   Current Local: /galleryImages/gal1.png
   Currently Using: IMG_8084.webp
   Live Site Shows: _________________ (fill this in)

4. LIMITED ACCESS PAGE (swfoundation.com/limited-access)
   Current Local: /Pratt2.jpeg
   Currently Using: Pratt3.webp
   Live Site Shows: _________________ (fill this in)

5. SERVICES PAGE (swfoundation.com/services)
   Current Local: /galleryImages/gal18.jpeg
   Currently Using: IMG_7517.webp
   Live Site Shows: _________________ (fill this in)

6. CRANE PAGE (swfoundation.com/crane)
   Current Local: /galleryImages/gal32.jpeg
   Currently Using: IMG_7753.webp
   Live Site Shows: _________________ (fill this in)

7. HELICAL PILES PAGE (swfoundation.com/helical-piles)
   Current Local: /galleryImages/gal8.jpeg
   Currently Using: preperation.webp
   Live Site Shows: _________________ (fill this in)

8. TURN-KEY PAGE (swfoundation.com/turn-key)
   Current Local: /galleryImages/gal28.jpeg
   Currently Using: IMG_7297.webp
   Live Site Shows: _________________ (fill this in)

========================

STEP 2: Check your Supabase Storage
------------------------------------
Go to: https://supabase.com/dashboard/project/edycymyofrowahspzzpg/storage/buckets/Images

Look in these folders:
- Images/public/
- Images/public/newimages/
- Images/public/galleryImages/ (if exists)

List available images here:
_________________________
_________________________
_________________________
_________________________

========================

STEP 3: Update the config file
-------------------------------
Once you know the correct image names, update:
/config/imageConfig.js

Change these lines with the ACTUAL image names from Supabase:

services: {
  servicesHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  pierDrillingHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  limitedAccessHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  craneHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  helicalPilesHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  turnKeyHero: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  // Also update safety and core values:
  safety: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp',
  coreValues: '\${IMAGE_BASE_URL}/[ACTUAL_IMAGE].webp'
}

========================
`);

// Quick check of what's currently configured
const config = require('../config/imageConfig.js');
console.log('\n📋 CURRENT CONFIGURATION:\n');
console.log('Safety:', config.pageImages.hero.safety);
console.log('Core Values:', config.pageImages.hero.coreValues);
console.log('Services:', config.pageImages.services.servicesHero);
console.log('Pier Drilling:', config.pageImages.services.pierDrillingHero);
console.log('Limited Access:', config.pageImages.services.limitedAccessHero);
console.log('Crane:', config.pageImages.services.craneHero);
console.log('Helical Piles:', config.pageImages.services.helicalPilesHero);
console.log('Turn-Key:', config.pageImages.services.turnKeyHero);