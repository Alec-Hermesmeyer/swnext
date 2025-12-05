#!/usr/bin/env node

/**
 * Quick migration script to update all pages to use centralized image config
 * Run with: node scripts/migrateImages.js
 */

const fs = require('fs');
const path = require('path');

// Mapping of old URLs to new config references
const imageMappings = [
  {
    old: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/trucks2.webp?version=1')",
    new: "url('${pageImages.hero.main}')",
    file: 'components/Hero.jsx'
  },
  {
    old: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7517.webp?version=1')",
    new: "url('${pageImages.hero.service}')",
    files: ['components/ServiceHero.jsx', 'components/AboutHero.jsx']
  },
  {
    old: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7753.webp')",
    new: "url('${pageImages.hero.footer}')",
    files: ['components/ServiceHero.jsx', 'components/AboutHero.jsx']
  },
  {
    old: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7297.webp?version=1')",
    new: "url('${pageImages.hero.about}')",
    file: 'pages/about.jsx'
  },
  {
    old: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_5171.webp?version=1')",
    new: "url('${pageImages.hero.careers}')",
    file: 'pages/careers.jsx'
  }
];

console.log('📝 Image Migration Helper\n');
console.log('This script will show you which files need updates.\n');

imageMappings.forEach(mapping => {
  const files = mapping.files || [mapping.file];
  
  files.forEach(file => {
    const filePath = path.join('swnext', file);
    console.log(`\n📄 ${file}:`);
    console.log(`   OLD: ${mapping.old.substring(0, 60)}...`);
    console.log(`   NEW: ${mapping.new}`);
    console.log(`   ✏️  Add import: import { pageImages } from '@/config/imageConfig';`);
    console.log(`   ✏️  Update style: style={{ backgroundImage: \`${mapping.new}\` }}`);
  });
});

console.log('\n\n✅ Next Steps:');
console.log('1. Add the import statement to each component');
console.log('2. Replace hardcoded URLs with config references');
console.log('3. Test each page to ensure images load correctly');
console.log('\nFor service images, update pages/services.jsx to use:');
console.log('   pageImages.services.preparation');
console.log('   pageImages.services.pratt1');
console.log('   pageImages.services.cutting');
console.log('   pageImages.services.home');
console.log('   pageImages.services.pratt3');