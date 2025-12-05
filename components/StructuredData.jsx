import Head from 'next/head';

/**
 * Organization Schema for S&W Foundation Contractors
 * Provides comprehensive company information for search engines
 */
export function OrganizationSchema() {
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
    "founders": [
      {
        "@type": "Person",
        "name": "Steve Wardell"
      },
      {
        "@type": "Person", 
        "name": "Wayne Wardell"
      }
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2806 Singleton St",
      "addressLocality": "Rowlett",
      "addressRegion": "TX",
      "postalCode": "75088",
      "addressCountry": "US"
    },
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-214-703-0484",
      "contactType": "customer service",
      "email": "info@swfoundation.com",
      "availableLanguage": "English",
      "areaServed": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "32.90144",
      "longitude": "-96.57587"
    },
    "sameAs": [
      "https://www.facebook.com/swfoundationcontractors",
      "https://www.linkedin.com/company/s-w-foundation-contractors",
      "https://www.bbb.org/us/tx/rowlett/profile/foundation-contractors/sw-foundation-contractors-inc-0875-90364158"
    ],
    "knowsAbout": [
      "Commercial Pier Drilling",
      "Foundation Construction", 
      "Helical Piles",
      "Limited Access Drilling",
      "Crane Services",
      "Deep Foundation Systems",
      "Commercial Construction"
    ],
    "award": [
      "ADSC Safety Award Winner (13 times)",
      "Better Business Bureau A+ Rating"
    ],
    "numberOfEmployees": "50-100",
    "naics": "238910",
    "duns": "608730285"
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
    </Head>
  );
}

/**
 * LocalBusiness Schema for location-based search results
 * Enhanced with service areas and business hours
 */
export function LocalBusinessSchema() {
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": "https://www.swfoundation.com/#localbusiness",
    "name": "S&W Foundation Contractors Inc.",
    "description": "Commercial pier drilling and foundation construction specialists serving Dallas, Texas and nationwide since 1986.",
    "url": "https://www.swfoundation.com",
    "telephone": "+1-214-703-0484",
    "email": "info@swfoundation.com",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "2806 Singleton St",
      "addressLocality": "Rowlett", 
      "addressRegion": "TX",
      "postalCode": "75088",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "32.90144",
      "longitude": "-96.57587"
    },
    "openingHours": [
      "Mo-Fr 07:00-17:00"
    ],
    "priceRange": "$$$",
    "paymentAccepted": [
      "Cash",
      "Check", 
      "Invoice"
    ],
    "currenciesAccepted": "USD",
    "areaServed": [
      {
        "@type": "State",
        "name": "Texas"
      },
      {
        "@type": "Country",
        "name": "United States"
      }
    ],
    "serviceArea": [
      {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": "32.90144",
          "longitude": "-96.57587"
        },
        "geoRadius": "500000"
      }
    ],
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Commercial Foundation Services",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Commercial Pier Drilling"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service", 
            "name": "Helical Pile Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Limited Access Drilling"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Crane Services"
          }
        }
      ]
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "reviewCount": "127",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </Head>
  );
}

/**
 * Service Schema for individual service offerings
 * Configurable for different service types
 */
export function ServiceSchema({ 
  serviceName,
  description,
  serviceType = "ConstructionService",
  category,
  url,
  image,
  areaServed = "United States",
  provider = "S&W Foundation Contractors Inc."
}) {
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    "name": serviceName,
    "description": description,
    "serviceType": serviceType,
    "category": category,
    "url": url,
    "image": image,
    "provider": {
      "@type": "Organization",
      "@id": "https://www.swfoundation.com/#organization",
      "name": provider,
      "url": "https://www.swfoundation.com",
      "telephone": "+1-214-703-0484",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Rowlett",
        "addressRegion": "TX",
        "addressCountry": "US"
      }
    },
    "areaServed": {
      "@type": "Country",
      "name": areaServed
    },
    "availableChannel": {
      "@type": "ServiceChannel",
      "serviceUrl": url,
      "serviceSupportedCountry": "US"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": `${serviceName} Options`,
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": serviceName
          },
          "priceSpecification": {
            "@type": "PriceSpecification",
            "priceCurrency": "USD",
            "price": "Contact for Quote"
          }
        }
      ]
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
    </Head>
  );
}

/**
 * BreadcrumbList Schema for site navigation
 * Helps search engines understand site structure
 */
export function BreadcrumbListSchema({ breadcrumbs }) {
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": crumb.url
    }))
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </Head>
  );
}

/**
 * WebSite Schema with search functionality
 * Enables search box in Google results
 */
export function WebSiteSchema() {
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": "https://www.swfoundation.com/#website",
    "name": "S&W Foundation Contractors",
    "alternateName": "S&W Foundation",
    "description": "Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, and limited access drilling specialists.",
    "url": "https://www.swfoundation.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.swfoundation.com/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "@id": "https://www.swfoundation.com/#organization"
    },
    "copyrightHolder": {
      "@type": "Organization", 
      "@id": "https://www.swfoundation.com/#organization"
    },
    "copyrightYear": "1986"
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </Head>
  );
}

/**
 * FAQ Schema for frequently asked questions
 * Enables FAQ rich snippets in search results
 */
export function FAQSchema({ faqs }) {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </Head>
  );
}

/**
 * Person Schema for company executives/team members
 * Used for About page and contact information
 */
export function PersonSchema({ 
  name, 
  jobTitle, 
  email, 
  telephone,
  image,
  description,
  worksFor = "S&W Foundation Contractors Inc."
}) {
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": name,
    "jobTitle": jobTitle,
    "email": email,
    "telephone": telephone,
    "image": image,
    "description": description,
    "worksFor": {
      "@type": "Organization",
      "@id": "https://www.swfoundation.com/#organization",
      "name": worksFor
    },
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Rowlett",
      "addressRegion": "TX", 
      "addressCountry": "US"
    }
  };

  return (
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
    </Head>
  );
}

/**
 * Review Schema for testimonials and reviews
 * Helps build trust and authority
 */
export function ReviewSchema({ reviews }) {
  const reviewSchemas = reviews.map(review => ({
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "@id": "https://www.swfoundation.com/#localbusiness"
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": review.rating,
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": review.author
    },
    "reviewBody": review.text,
    "publisher": {
      "@type": "Organization",
      "name": review.platform || "S&W Foundation"
    }
  }));

  return (
    <Head>
      {reviewSchemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </Head>
  );
}