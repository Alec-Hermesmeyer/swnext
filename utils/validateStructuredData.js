/**
 * Structured Data Validation Utility
 * 
 * This utility helps validate JSON-LD structured data against schema.org standards
 * and provides debugging information for SEO optimization.
 */

/**
 * Validates Organization schema structure
 */
export function validateOrganizationSchema(schema) {
  const required = ['@context', '@type', 'name', 'url', 'address', 'contactPoint'];
  const recommended = ['description', 'foundingDate', 'logo', 'sameAs', 'geo'];
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0
  };

  // Check required fields
  required.forEach(field => {
    if (!schema[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    } else {
      validation.score += 10;
    }
  });

  // Check recommended fields
  recommended.forEach(field => {
    if (!schema[field]) {
      validation.warnings.push(`Missing recommended field: ${field}`);
    } else {
      validation.score += 5;
    }
  });

  // Validate specific field formats
  if (schema['@context'] && schema['@context'] !== 'https://schema.org') {
    validation.warnings.push('Context should be "https://schema.org"');
  }

  if (schema['@type'] && schema['@type'] !== 'Organization') {
    validation.errors.push('Type must be "Organization"');
    validation.isValid = false;
  }

  if (schema.address && !schema.address['@type']) {
    validation.warnings.push('Address should have @type: "PostalAddress"');
  }

  return validation;
}

/**
 * Validates LocalBusiness schema structure
 */
export function validateLocalBusinessSchema(schema) {
  const required = ['@context', '@type', 'name', 'address', 'telephone'];
  const recommended = ['description', 'url', 'geo', 'openingHours', 'areaServed', 'aggregateRating'];
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0
  };

  required.forEach(field => {
    if (!schema[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    } else {
      validation.score += 15;
    }
  });

  recommended.forEach(field => {
    if (!schema[field]) {
      validation.warnings.push(`Missing recommended field: ${field}`);
    } else {
      validation.score += 7;
    }
  });

  if (schema.aggregateRating) {
    const rating = schema.aggregateRating;
    if (!rating.ratingValue || !rating.reviewCount) {
      validation.warnings.push('AggregateRating should include ratingValue and reviewCount');
    }
  }

  return validation;
}

/**
 * Validates Service schema structure
 */
export function validateServiceSchema(schema) {
  const required = ['@context', '@type', 'name', 'description', 'provider'];
  const recommended = ['serviceType', 'category', 'url', 'image', 'areaServed'];
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0
  };

  required.forEach(field => {
    if (!schema[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    } else {
      validation.score += 12;
    }
  });

  recommended.forEach(field => {
    if (!schema[field]) {
      validation.warnings.push(`Missing recommended field: ${field}`);
    } else {
      validation.score += 8;
    }
  });

  if (schema.provider && !schema.provider.name) {
    validation.warnings.push('Provider should include name');
  }

  return validation;
}

/**
 * Validates BreadcrumbList schema structure
 */
export function validateBreadcrumbListSchema(schema) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0
  };

  if (!schema['@context'] || !schema['@type'] || !schema.itemListElement) {
    validation.errors.push('Missing required fields for BreadcrumbList');
    validation.isValid = false;
    return validation;
  }

  if (!Array.isArray(schema.itemListElement)) {
    validation.errors.push('itemListElement must be an array');
    validation.isValid = false;
    return validation;
  }

  schema.itemListElement.forEach((item, index) => {
    if (!item.position || !item.name || !item.item) {
      validation.warnings.push(`Breadcrumb item ${index} missing required fields`);
    } else {
      validation.score += 10;
    }
  });

  return validation;
}

/**
 * Validates Person schema structure
 */
export function validatePersonSchema(schema) {
  const required = ['@context', '@type', 'name'];
  const recommended = ['jobTitle', 'email', 'telephone', 'description', 'worksFor'];
  
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    score: 0
  };

  required.forEach(field => {
    if (!schema[field]) {
      validation.errors.push(`Missing required field: ${field}`);
      validation.isValid = false;
    } else {
      validation.score += 20;
    }
  });

  recommended.forEach(field => {
    if (!schema[field]) {
      validation.warnings.push(`Missing recommended field: ${field}`);
    } else {
      validation.score += 10;
    }
  });

  return validation;
}

/**
 * Main validation function that routes to specific validators
 */
export function validateStructuredData(schema) {
  if (!schema || !schema['@type']) {
    return {
      isValid: false,
      errors: ['Schema missing or invalid @type'],
      warnings: [],
      score: 0
    };
  }

  switch (schema['@type']) {
    case 'Organization':
      return validateOrganizationSchema(schema);
    case 'LocalBusiness':
      return validateLocalBusinessSchema(schema);
    case 'Service':
      return validateServiceSchema(schema);
    case 'BreadcrumbList':
      return validateBreadcrumbListSchema(schema);
    case 'Person':
      return validatePersonSchema(schema);
    default:
      return {
        isValid: false,
        errors: [`Unsupported schema type: ${schema['@type']}`],
        warnings: [],
        score: 0
      };
  }
}

/**
 * Generate SEO recommendations based on validation results
 */
export function generateSEORecommendations(validationResults) {
  const recommendations = [];

  if (validationResults.score < 50) {
    recommendations.push({
      priority: 'high',
      type: 'structure',
      message: 'Schema markup incomplete. Add missing required fields to improve search visibility.'
    });
  }

  if (validationResults.errors.length > 0) {
    recommendations.push({
      priority: 'critical',
      type: 'errors',
      message: 'Fix schema validation errors to ensure search engines can process your structured data.'
    });
  }

  if (validationResults.warnings.length > 3) {
    recommendations.push({
      priority: 'medium',
      type: 'optimization',
      message: 'Add recommended fields to enhance rich snippet appearance.'
    });
  }

  if (validationResults.score >= 80) {
    recommendations.push({
      priority: 'low',
      type: 'success',
      message: 'Excellent schema markup! Consider adding more specific industry fields.'
    });
  }

  return recommendations;
}

/**
 * Testing helper for Google's Structured Data Testing Tool
 */
export function generateTestingInstructions() {
  return {
    googleTestingTool: 'https://search.google.com/test/rich-results',
    instructions: [
      '1. Copy the page URL or HTML source',
      '2. Paste into Google Rich Results Test',
      '3. Check for validation errors and warnings',
      '4. Test on mobile and desktop views',
      '5. Verify rich snippets preview correctly'
    ],
    automatedTesting: {
      lighthouse: 'Run Lighthouse SEO audit to check structured data',
      webPageTest: 'Use WebPageTest.org for comprehensive SEO analysis',
      schemaMarkup: 'Use schema.org validator for detailed validation'
    }
  };
}

/**
 * Common schema patterns for S&W Foundation
 */
export const SW_FOUNDATION_PATTERNS = {
  baseAddress: {
    "@type": "PostalAddress",
    "streetAddress": "2806 Singleton St",
    "addressLocality": "Rowlett",
    "addressRegion": "TX", 
    "postalCode": "75088",
    "addressCountry": "US"
  },
  baseGeo: {
    "@type": "GeoCoordinates",
    "latitude": "32.90144",
    "longitude": "-96.57587"
  },
  baseContactPoint: {
    "@type": "ContactPoint",
    "telephone": "+1-214-703-0484",
    "contactType": "customer service",
    "email": "info@swfoundation.com",
    "availableLanguage": "English",
    "areaServed": "US"
  },
  services: [
    "Commercial Pier Drilling",
    "Helical Piles", 
    "Limited Access Drilling",
    "Crane Services",
    "Turn-Key Solutions"
  ]
};