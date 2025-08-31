// SEO utility functions and constants

export const siteConfig = {
  name: "S&W Foundation Contractors Inc.",
  description: "Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling. 13-time ADSC Safety Award winner.",
  url: "https://www.swfoundation.com",
  ogImage: "https://www.swfoundation.com/homeHero.webp",
  phone: "(214) 703-0484",
  email: "bids@swfoundation.com",
  address: {
    street: "2806 Singleton St.",
    city: "Rowlett",
    state: "TX",
    zip: "75088"
  },
  social: {
    facebook: "https://www.facebook.com/SWFoundationContractors",
    linkedin: "https://www.linkedin.com/company/s-w-foundation-contractors-inc"
  },
  keywords: [
    "commercial pier drilling",
    "dallas foundation contractors", 
    "pier drilling services",
    "texas foundation construction",
    "commercial drilling contractors",
    "limited access drilling",
    "crane services dallas",
    "helical piles texas",
    "deep foundation drilling",
    "turnkey drilling solutions"
  ]
};

// Generate page-specific meta tags
export const generateMetaTags = (pageConfig = {}) => {
  const {
    title,
    description,
    keywords = [],
    image = siteConfig.ogImage,
    url = siteConfig.url,
    type = "website",
    noindex = false
  } = pageConfig;

  const fullTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const fullDescription = description || siteConfig.description;
  const allKeywords = [...siteConfig.keywords, ...keywords].join(", ");

  return {
    title: fullTitle,
    description: fullDescription,
    keywords: allKeywords,
    robots: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    canonical: url,
    openGraph: {
      type,
      title: fullTitle,
      description: fullDescription,
      url,
      siteName: siteConfig.name,
      image: {
        url: image,
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} - Commercial pier drilling and foundation services`
      }
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: fullDescription,
      image
    }
  };
};

// Generate structured data for different page types
export const generateStructuredData = (type, data = {}) => {
  const baseOrganization = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: ["S&W Foundation", "S&W Foundation Contractors"],
    description: siteConfig.description,
    url: siteConfig.url,
    logo: `${siteConfig.url}/swlogorwb.png`,
    telephone: "+12147030484",
    email: siteConfig.email,
    foundingDate: "1986",
    address: {
      "@type": "PostalAddress",
      streetAddress: siteConfig.address.street,
      addressLocality: siteConfig.address.city,
      addressRegion: siteConfig.address.state,
      postalCode: siteConfig.address.zip,
      addressCountry: "US"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 32.90144,
      longitude: -96.57587
    },
    areaServed: [
      { "@type": "Country", name: "United States" },
      { "@type": "State", name: "Texas" },
      { "@type": "City", name: "Dallas" }
    ],
    serviceType: [
      "Commercial Pier Drilling",
      "Foundation Construction", 
      "Limited Access Drilling",
      "Turn-Key Drilling Solutions",
      "Crane Services",
      "Helical Piles",
      "Deep Foundation Drilling",
      "Soil Testing"
    ],
    openingHours: "Mo,Tu,We,Th,Fr 08:00-17:00",
    paymentAccepted: ["Cash", "Check", "Credit Card"],
    sameAs: [siteConfig.social.facebook, siteConfig.social.linkedin]
  };

  switch (type) {
    case "organization":
      return baseOrganization;
    
    case "service":
      return {
        "@context": "https://schema.org",
        "@type": "Service",
        name: data.name,
        description: data.description,
        provider: baseOrganization,
        areaServed: baseOrganization.areaServed,
        serviceType: data.serviceType || "Commercial Construction Service"
      };
    
    case "breadcrumb":
      return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: data.items?.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: item.url
        })) || []
      };
    
    case "faq":
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.questions?.map(q => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer
          }
        })) || []
      };
    
    default:
      return baseOrganization;
  }
};

// Generate breadcrumb data
export const generateBreadcrumbs = (path, customLabels = {}) => {
  const pathSegments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ name: "Home", url: siteConfig.url }];
  
  let currentUrl = siteConfig.url;
  
  pathSegments.forEach(segment => {
    currentUrl += `/${segment}`;
    const label = customLabels[segment] || segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    breadcrumbs.push({
      name: label,
      url: currentUrl
    });
  });
  
  return breadcrumbs;
};

// Page-specific SEO configurations
export const pageConfigs = {
  home: {
    title: "Commercial Pier Drilling Dallas TX | S&W Foundation Contractors | 35+ Years Experience",
    description: "Leading commercial pier drilling contractor in Dallas, TX since 1986. Nationwide foundation construction, crane services, limited access drilling. 13-time ADSC Safety Award winner. Free quotes: (214) 703-0484.",
    keywords: ["commercial pier drilling dallas", "foundation contractors texas", "pier drilling services dallas"]
  },
  
  about: {
    title: "About S&W Foundation Contractors | 35+ Years Commercial Pier Drilling Experience",
    description: "Family-owned commercial pier drilling company serving Dallas, TX since 1986. 13-time ADSC Safety Award winner with nationwide foundation construction expertise.",
    keywords: ["about s&w foundation", "dallas foundation contractor history", "commercial drilling company"]
  },
  
  services: {
    title: "Commercial Pier Drilling Services | Foundation Construction | S&W Contractors",
    description: "Comprehensive commercial pier drilling and foundation services in Dallas, TX. Limited access drilling, crane services, helical piles, and turnkey solutions nationwide.",
    keywords: ["pier drilling services", "foundation construction services", "commercial drilling"]
  },
  
  contact: {
    title: "Contact S&W Foundation Contractors | Free Pier Drilling Quotes | (214) 703-0484",
    description: "Contact S&W Foundation Contractors for commercial pier drilling services in Dallas, TX. Free quotes, nationwide service, 35+ years experience. Call (214) 703-0484.",
    keywords: ["contact foundation contractor", "pier drilling quote dallas", "commercial drilling estimate"]
  },
  
  careers: {
    title: "Careers at S&W Foundation Contractors | Commercial Drilling Jobs Dallas TX",
    description: "Join S&W Foundation Contractors, a leading commercial pier drilling company in Dallas, TX. Competitive benefits, safety-first culture, and career growth opportunities.",
    keywords: ["foundation drilling jobs", "construction careers dallas", "commercial drilling employment"]
  }
};

// Core Web Vitals optimization helpers
export const optimizeImages = {
  // Priority images for above-the-fold content
  priority: ["hero", "banner", "logo"],
  
  // Lazy loading for below-the-fold images
  lazy: ["gallery", "testimonials", "team", "projects"],
  
  // Recommended sizes for responsive images
  sizes: {
    hero: "(min-width: 1280px) 1280px, (min-width: 768px) 768px, 100vw",
    card: "(min-width: 768px) 33vw, 100vw",
    thumbnail: "(min-width: 640px) 200px, 150px"
  }
};

export default {
  siteConfig,
  generateMetaTags,
  generateStructuredData,
  generateBreadcrumbs,
  pageConfigs,
  optimizeImages
};