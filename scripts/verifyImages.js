#!/usr/bin/env node

/**
 * Image Verification Script
 * Compares images between local configuration and live site
 * Run with: node scripts/verifyImages.js
 */

const { pageImages } = require('../config/imageConfig');

// Add your live site URL here
const LIVE_SITE_URL = 'https://your-live-site.com'; // UPDATE THIS

async function checkImageAvailability(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return {
      url,
      available: response.ok,
      status: response.status,
      contentType: response.headers.get('content-type')
    };
  } catch (error) {
    return {
      url,
      available: false,
      error: error.message
    };
  }
}

async function verifyImages() {
  console.log('🔍 Verifying Supabase image availability...\n');
  
  const allImages = [];
  
  // Flatten all image URLs
  for (const category in pageImages) {
    for (const imageName in pageImages[category]) {
      allImages.push({
        category,
        name: imageName,
        url: pageImages[category][imageName]
      });
    }
  }
  
  console.log(`Found ${allImages.length} images to verify\n`);
  
  // Check each image
  const results = await Promise.all(
    allImages.map(async (img) => {
      const result = await checkImageAvailability(img.url);
      return { ...img, ...result };
    })
  );
  
  // Report results
  const available = results.filter(r => r.available);
  const missing = results.filter(r => !r.available);
  
  console.log(`✅ Available: ${available.length} images`);
  console.log(`❌ Missing: ${missing.length} images\n`);
  
  if (missing.length > 0) {
    console.log('Missing images:');
    missing.forEach(img => {
      console.log(`  - ${img.category}.${img.name}: ${img.url}`);
      if (img.error) console.log(`    Error: ${img.error}`);
    });
    console.log('\nTo fix missing images:');
    console.log('1. Check if the images exist in your Supabase storage');
    console.log('2. Update the paths in config/imageConfig.js');
    console.log('3. Ensure the images are set to public in Supabase');
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    total: allImages.length,
    available: available.length,
    missing: missing.length,
    details: results
  };
  
  const fs = require('fs');
  fs.writeFileSync(
    'image-verification-report.json',
    JSON.stringify(report, null, 2)
  );
  
  console.log('\n📄 Full report saved to image-verification-report.json');
}

// Run verification if called directly
if (require.main === module) {
  verifyImages().catch(console.error);
}

module.exports = { verifyImages, checkImageAvailability };