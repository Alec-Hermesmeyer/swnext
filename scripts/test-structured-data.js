/**
 * Test script to validate structured data implementation
 * Run with: node scripts/test-structured-data.js
 */

const { validateStructuredData, generateSEORecommendations, SW_FOUNDATION_PATTERNS } = require('../utils/validateStructuredData');

// Test Organization Schema
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "S&W Foundation Contractors Inc.",
  "alternateName": "S&W Foundation",
  "description": "Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling, and helical pile installation.",
  "url": "https://www.swfoundation.com",
  "logo": "https://www.swfoundation.com/logo.png",
  "image": "https://www.swfoundation.com/homeHero.webp",
  "foundingDate": "1986",
  "address": SW_FOUNDATION_PATTERNS.baseAddress,
  "contactPoint": SW_FOUNDATION_PATTERNS.baseContactPoint,
  "geo": SW_FOUNDATION_PATTERNS.baseGeo
};

// Test LocalBusiness Schema
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "@id": "https://www.swfoundation.com/#localbusiness",
  "name": "S&W Foundation Contractors Inc.",
  "description": "Commercial pier drilling and foundation construction specialists serving Dallas, Texas and nationwide since 1986.",
  "url": "https://www.swfoundation.com",
  "telephone": "+1-214-703-0484",
  "email": "info@swfoundation.com",
  "address": SW_FOUNDATION_PATTERNS.baseAddress,
  "geo": SW_FOUNDATION_PATTERNS.baseGeo,
  "openingHours": ["Mo-Fr 07:00-17:00"],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "127",
    "bestRating": "5",
    "worstRating": "1"
  }
};

// Test Service Schema
const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  "name": "Commercial Pier Drilling",
  "description": "Expert commercial pier drilling services in Dallas, TX. Professional foundation pier installation for commercial and industrial projects.",
  "serviceType": "ConstructionService",
  "category": "Foundation Construction",
  "url": "https://www.swfoundation.com/pier-drilling",
  "provider": {
    "@type": "Organization",
    "name": "S&W Foundation Contractors Inc.",
    "url": "https://www.swfoundation.com"
  }
};

// Test BreadcrumbList Schema
const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://www.swfoundation.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Services",
      "item": "https://www.swfoundation.com/services"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Pier Drilling",
      "item": "https://www.swfoundation.com/pier-drilling"
    }
  ]
};

// Run Tests
console.log('🔍 Testing Structured Data Implementation\n');

console.log('📊 Organization Schema Validation:');
const orgValidation = validateStructuredData(organizationSchema);
console.log(`✅ Valid: ${orgValidation.isValid}`);
console.log(`📈 Score: ${orgValidation.score}/100`);
if (orgValidation.errors.length > 0) {
  console.log('❌ Errors:', orgValidation.errors);
}
if (orgValidation.warnings.length > 0) {
  console.log('⚠️  Warnings:', orgValidation.warnings);
}
console.log('');

console.log('🏢 LocalBusiness Schema Validation:');
const businessValidation = validateStructuredData(localBusinessSchema);
console.log(`✅ Valid: ${businessValidation.isValid}`);
console.log(`📈 Score: ${businessValidation.score}/100`);
if (businessValidation.errors.length > 0) {
  console.log('❌ Errors:', businessValidation.errors);
}
if (businessValidation.warnings.length > 0) {
  console.log('⚠️  Warnings:', businessValidation.warnings);
}
console.log('');

console.log('🔧 Service Schema Validation:');
const serviceValidation = validateStructuredData(serviceSchema);
console.log(`✅ Valid: ${serviceValidation.isValid}`);
console.log(`📈 Score: ${serviceValidation.score}/100`);
if (serviceValidation.errors.length > 0) {
  console.log('❌ Errors:', serviceValidation.errors);
}
if (serviceValidation.warnings.length > 0) {
  console.log('⚠️  Warnings:', serviceValidation.warnings);
}
console.log('');

console.log('🍞 BreadcrumbList Schema Validation:');
const breadcrumbValidation = validateStructuredData(breadcrumbSchema);
console.log(`✅ Valid: ${breadcrumbValidation.isValid}`);
console.log(`📈 Score: ${breadcrumbValidation.score}/100`);
if (breadcrumbValidation.errors.length > 0) {
  console.log('❌ Errors:', breadcrumbValidation.errors);
}
if (breadcrumbValidation.warnings.length > 0) {
  console.log('⚠️  Warnings:', breadcrumbValidation.warnings);
}
console.log('');

// Generate SEO recommendations
console.log('🎯 SEO Recommendations:');
const allValidations = [orgValidation, businessValidation, serviceValidation, breadcrumbValidation];
allValidations.forEach((validation, index) => {
  const schemaTypes = ['Organization', 'LocalBusiness', 'Service', 'BreadcrumbList'];
  const recommendations = generateSEORecommendations(validation);
  if (recommendations.length > 0) {
    console.log(`\n${schemaTypes[index]} Schema:`);
    recommendations.forEach(rec => {
      console.log(`  ${rec.priority.toUpperCase()}: ${rec.message}`);
    });
  }
});

console.log('\n🚀 Testing Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Test pages in Google Rich Results Test: https://search.google.com/test/rich-results');
console.log('2. Run Lighthouse SEO audit');
console.log('3. Monitor search console for structured data issues');
console.log('4. Check for rich snippets in search results after indexing');

// Generate summary report
const totalScore = allValidations.reduce((sum, val) => sum + val.score, 0);
const avgScore = Math.round(totalScore / allValidations.length);
const totalErrors = allValidations.reduce((sum, val) => sum + val.errors.length, 0);
const totalWarnings = allValidations.reduce((sum, val) => sum + val.warnings.length, 0);

console.log('\n📈 Summary Report:');
console.log(`Average Schema Score: ${avgScore}/100`);
console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);

if (avgScore >= 80) {
  console.log('🎉 Excellent! Your structured data is well optimized.');
} else if (avgScore >= 60) {
  console.log('👍 Good! Consider addressing warnings for better optimization.');
} else {
  console.log('⚠️  Needs improvement. Address errors and warnings to improve SEO.');
}