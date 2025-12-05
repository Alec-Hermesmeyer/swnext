// SEO Configuration for S&W Foundation
// Centralized SEO settings and metadata for organic growth

const BASE_URL = 'https://www.swfoundation.com';
const COMPANY_NAME = 'S&W Foundation Contractors';
const DEFAULT_OG_IMAGE = 'https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/att.webp';

export const seoDefaults = {
  titleTemplate: '%s | S&W Foundation Dallas TX',
  defaultTitle: 'S&W Foundation | Commercial Pier Drilling & Foundation Contractors Dallas TX',
  description: 'Leading commercial pier drilling and foundation contractors in Dallas since 1986. Expert drilling services, limited access solutions, and turn-key foundation projects. 13-time ADSC Safety Award winner.',
  keywords: [
    'pier drilling dallas',
    'foundation contractors texas',
    'commercial drilling services',
    'limited access drilling',
    'turn key foundation',
    'crane services dallas',
    'helical piles installation',
    'ADSC safety award winner',
    'commercial construction dallas',
    'deep foundation specialists'
  ],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: BASE_URL,
    siteName: COMPANY_NAME,
    images: [{
      url: DEFAULT_OG_IMAGE,
      width: 1200,
      height: 630,
      alt: 'S&W Foundation Contractors - Commercial Drilling Services'
    }]
  },
  twitter: {
    handle: '@swfoundation',
    site: '@swfoundation',
    cardType: 'summary_large_image'
  }
};

// Page-specific SEO configurations
export const pageSEO = {
  home: {
    title: 'Commercial Pier Drilling & Foundation Contractors',
    description: 'S&W Foundation: Dallas premier commercial pier drilling contractors since 1986. Specializing in deep foundations, limited access drilling, and turn-key solutions. Call (214) 703-0484.',
    keywords: 'commercial pier drilling dallas, foundation contractors texas, drilling services dfw, commercial construction foundation, pier installation dallas'
  },
  services: {
    title: 'Foundation Services | Drilling, Crane & Turn-Key Solutions',
    description: 'Comprehensive foundation services: pier drilling, limited access, crane operations, helical piles, and turn-key solutions. 35+ years serving Dallas commercial construction.',
    keywords: 'foundation services dallas, commercial drilling services, crane foundation work, limited access drilling, turn key foundation solutions'
  },
  pierDrilling: {
    title: 'Commercial Pier Drilling Dallas | Deep Foundation Specialists',
    description: 'Expert commercial pier drilling services in Dallas. Depths up to 100 feet, diameters to 10 feet. Advanced equipment and experienced operators for any project size.',
    keywords: 'pier drilling dallas, deep foundation drilling, commercial pier installation, foundation drilling contractors, pier drilling services texas'
  },
  limitedAccess: {
    title: 'Limited Access Drilling | Specialized Foundation Solutions',
    description: 'Specialized limited access drilling for confined spaces and challenging sites. Mini-rigs and expert operators for interior work and restricted areas.',
    keywords: 'limited access drilling, confined space drilling, interior foundation work, mini rig drilling, restricted access foundations'
  },
  crane: {
    title: 'Crane Services | Heavy Lifting & Foundation Support',
    description: 'Professional crane services for foundation construction. Heavy lifting, material handling, and precise placement for commercial projects across Dallas-Fort Worth.',
    keywords: 'crane services dallas, foundation crane work, heavy lifting contractors, commercial crane rental, construction crane services'
  },
  helicalPiles: {
    title: 'Helical Piles Installation | Screw Pile Foundations',
    description: 'Professional helical pile installation for commercial foundations. Fast, vibration-free installation ideal for retrofits and new construction in Dallas.',
    keywords: 'helical piles dallas, screw pile foundations, helical pier installation, foundation underpinning, pile driving services'
  },
  turnKey: {
    title: 'Turn-Key Foundation Solutions | Complete Project Management',
    description: 'Complete turn-key foundation solutions from design to completion. Single-source contractor for all foundation needs with project management expertise.',
    keywords: 'turn key foundation, complete foundation solutions, foundation project management, design build foundations, full service foundation contractor'
  },
  about: {
    title: 'About S&W Foundation | Family-Owned Since 1986',
    description: 'Family-owned foundation contractors serving Dallas since 1986. Learn about our commitment to safety, quality, and customer satisfaction in commercial construction.',
    keywords: 'foundation contractors dallas history, family owned construction company, commercial drilling experience, about sw foundation, dallas construction company'
  },
  safety: {
    title: 'Safety First | 13-Time ADSC Safety Award Winner',
    description: '13-time ADSC Safety Award winner committed to zero incidents. Comprehensive safety program, certified operators, and OSHA compliance for all projects.',
    keywords: 'construction safety dallas, ADSC safety award, OSHA compliance construction, safety certified contractors, construction safety program'
  },
  contact: {
    title: 'Contact S&W Foundation | Get Your Free Quote',
    description: 'Contact S&W Foundation for commercial pier drilling and foundation services in Dallas. Free quotes, expert consultation. Call (214) 703-0484 or submit online.',
    keywords: 'contact foundation contractors, pier drilling quote dallas, free foundation estimate, commercial drilling consultation, contact sw foundation'
  },
  careers: {
    title: 'Careers | Join Our Foundation Construction Team',
    description: 'Join S&W Foundation team. Now hiring drill operators, crane operators, CDL drivers, and construction professionals. Competitive pay and benefits in Dallas.',
    keywords: 'construction jobs dallas, drilling operator jobs, foundation construction careers, crane operator employment, cdl driver jobs texas'
  }
};

// Local Business Schema markup generator
export const getLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: COMPANY_NAME,
  image: DEFAULT_OG_IMAGE,
  '@id': BASE_URL,
  url: BASE_URL,
  telephone: '+12147030484',
  priceRange: '$$$$',
  address: {
    '@type': 'PostalAddress',
    streetAddress: '3131 E Plano Pkwy',
    addressLocality: 'Plano',
    addressRegion: 'TX',
    postalCode: '75074',
    addressCountry: 'US'
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 33.0137,
    longitude: -96.7068
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '07:00',
    closes: '17:00'
  },
  sameAs: [
    'https://www.linkedin.com/company/sw-foundation',
    'https://www.facebook.com/swfoundation'
  ],
  areaServed: {
    '@type': 'GeoCircle',
    geoMidpoint: {
      '@type': 'GeoCoordinates',
      latitude: 32.7767,
      longitude: -96.7970
    },
    geoRadius: '200000'
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '127'
  }
});

// Generate breadcrumb schema
export const getBreadcrumbSchema = (breadcrumbs) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url
  }))
});

// Generate service schema
export const getServiceSchema = (service) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: service.type || 'Foundation Construction',
  provider: {
    '@type': 'LocalBusiness',
    name: COMPANY_NAME,
    url: BASE_URL
  },
  areaServed: {
    '@type': 'State',
    name: 'Texas'
  },
  description: service.description,
  url: service.url,
  image: service.image
});

// SEO Best Practices Checklist
export const seoChecklist = {
  technical: [
    'Sitemap.xml generated and submitted',
    'Robots.txt properly configured',
    'SSL certificate active',
    'Mobile-responsive design',
    'Page load speed < 3 seconds',
    'Core Web Vitals passing',
    'Canonical URLs set',
    'Structured data implemented',
    '404 page configured',
    'XML sitemap submitted to Google Search Console'
  ],
  onPage: [
    'Unique title tags (50-60 chars)',
    'Meta descriptions (150-160 chars)',
    'H1 tags on all pages (one per page)',
    'Proper H2-H6 hierarchy',
    'Alt text on all images',
    'Internal linking structure',
    'Keyword optimization (2-3% density)',
    'Content length > 500 words',
    'FAQ schema where applicable',
    'Local business schema'
  ],
  content: [
    'Service area pages (Dallas, Fort Worth, Plano, etc.)',
    'Project case studies',
    'Industry-specific landing pages',
    'Blog posts on foundation topics',
    'FAQ sections',
    'Video content with transcripts',
    'Customer testimonials',
    'Before/after project galleries',
    'Seasonal content updates',
    'Equipment and process explanations'
  ],
  local: [
    'Google My Business optimized',
    'NAP consistency (Name, Address, Phone)',
    'Local citations built',
    'Customer reviews encouraged',
    'Local keywords in content',
    'Service area pages',
    'Community involvement content',
    'Local backlinks acquired',
    'Bing Places listing',
    'Apple Maps listing'
  ],
  linkBuilding: [
    'Industry association memberships (ADSC)',
    'Supplier/partner links',
    'Local business directories',
    'Chamber of Commerce listing',
    'BBB accreditation',
    'Industry publications',
    'Guest posts on construction sites',
    'Case study features',
    'Press releases for major projects',
    'Sponsorship opportunities'
  ]
};

// Recommended content calendar topics
export const contentCalendar = {
  educational: [
    'What is Pier Drilling? A Complete Guide',
    'Signs Your Commercial Building Needs Foundation Work',
    'Limited Access Drilling: Solutions for Tight Spaces',
    'Helical Piles vs Traditional Foundations: Pros and Cons',
    'Understanding Foundation Load Requirements',
    'Seasonal Foundation Maintenance Tips',
    'Cost Factors in Commercial Foundation Work',
    'Safety Standards in Foundation Construction',
    'Environmental Considerations in Drilling',
    'New Technologies in Foundation Engineering'
  ],
  caseStudies: [
    'Major Dallas Office Tower Foundation Project',
    'Limited Access Solution for Historic Building',
    'Emergency Foundation Repair Case Study',
    'Multi-Phase Commercial Development',
    'Challenging Soil Conditions Project',
    'Record-Breaking Deep Pier Installation',
    'Turn-Key Hospital Foundation Project',
    'Retrofit Foundation for Seismic Upgrade',
    'Industrial Facility Expansion Foundation',
    'Bridge Foundation Rehabilitation'
  ],
  seasonal: [
    'Spring: Post-Winter Foundation Inspections',
    'Summer: Heat Effects on Commercial Foundations',
    'Fall: Preparing Foundations for Winter',
    'Winter: Cold Weather Drilling Considerations',
    'Hurricane Season Foundation Preparedness',
    'Drought Impact on Texas Foundations',
    'Rainy Season Foundation Concerns',
    'Year-End Construction Planning',
    'New Year Safety Resolutions',
    'Tax Benefits of Foundation Improvements'
  ]
};