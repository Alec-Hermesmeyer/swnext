import NavTailwind from "./NavTailwind";
import Image from "next/image";
import Link from "next/link";
import { FaFacebook, FaLinkedin, FaPhone, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";

export default function TWLayoutSEO({ children, breadcrumbs = null }) {
  const currentYear = new Date().getFullYear();
  
  // Footer structured data
  const footerStructuredData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": "https://www.swfoundation.com/#organization",
    name: "S&W Foundation Contractors Inc.",
    url: "https://www.swfoundation.com",
    logo: "https://www.swfoundation.com/swlogorwb.png",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+12147030484",
      contactType: "customer service",
      availableLanguage: "en",
      areaServed: "US"
    },
    address: {
      "@type": "PostalAddress",
      streetAddress: "2806 Singleton St.",
      addressLocality: "Rowlett",
      addressRegion: "TX",
      postalCode: "75088",
      addressCountry: "US"
    },
    sameAs: [
      "https://www.facebook.com/SWFoundationContractors",
      "https://www.linkedin.com/company/s-w-foundation-contractors-inc"
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900">
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-red-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      <header className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2">
        <NavTailwind />
      </header>

      {/* Breadcrumbs */}
      {breadcrumbs && (
        <nav 
          className="bg-gray-50 border-b border-gray-200 py-3"
          aria-label="Breadcrumb navigation"
        >
          <div className="container mx-auto px-4">
            <ol className="flex items-center space-x-2 text-sm" role="list">
              <li>
                <Link 
                  href="/" 
                  className="text-gray-500 hover:text-red-600 focus:outline-none focus:underline"
                  aria-label="Return to homepage"
                >
                  Home
                </Link>
              </li>
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.href || crumb.name} className="flex items-center">
                  <svg 
                    className="w-4 h-4 text-gray-400 mx-2" 
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  {crumb.href ? (
                    <Link 
                      href={crumb.href} 
                      className="text-gray-500 hover:text-red-600 focus:outline-none focus:underline"
                      aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}
                    >
                      {crumb.name}
                    </Link>
                  ) : (
                    <span 
                      className="text-gray-900 font-medium" 
                      aria-current="page"
                    >
                      {crumb.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </nav>
      )}

      <main 
        id="main-content"
        className="flex-1 flex flex-col"
        role="main"
      >
        {children}
      </main>

      <footer 
        className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-[#0b2a5a] text-white"
        role="contentinfo"
        aria-labelledby="footer-heading"
      >
        <div className="mx-auto w-full px-0">
          <div className="grid grid-cols-1 gap-8 px-6 py-12 md:grid-cols-4 md:px-10">
            
            {/* Company Logo and Description */}
            <div className="md:col-span-1">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-white mb-4">
                <Image
                  src="/swlogorwb.png"
                  alt="S&W Foundation Contractors - Commercial Pier Drilling Company Logo"
                  width={90}
                  height={26}
                  sizes="90px"
                  priority={false}
                  unoptimized
                  loader={({ src }) => src}
                />
              </div>
              <h2 id="footer-heading" className="text-lg font-bold mb-2">S&W Foundation Contractors</h2>
              <p className="text-sm text-neutral-200 leading-relaxed">
                Leading commercial pier drilling contractor in Dallas, Texas since 1986. 
                Providing nationwide foundation construction services.
              </p>
            </div>

            {/* Company Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Company</h3>
              <nav role="navigation" aria-label="Footer company links">
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      href="/about" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      About Us
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/core-values" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Core Values
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/careers" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Careers
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/safety" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Safety
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Services Links */}
            <div>
              <h3 className="font-bold text-white mb-4">Services</h3>
              <nav role="navigation" aria-label="Footer services links">
                <ul className="space-y-3 text-sm">
                  <li>
                    <Link 
                      href="/pier-drilling" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Pier Drilling
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/limited-access" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Limited Access Drilling
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/turn-key" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Turn-Key Solutions
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/crane" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Crane Services
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="font-bold text-white mb-4">Contact Information</h3>
              <address className="not-italic space-y-3 text-sm">
                <div className="flex items-start space-x-3">
                  <FaPhone className="mt-1 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-neutral-200 mb-1">Phone:</p>
                    <Link 
                      href="tel:+12147030484" 
                      className="text-white font-semibold hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                      aria-label="Call S&W Foundation Contractors at (214) 703-0484"
                    >
                      (214) 703-0484
                    </Link>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <FaEnvelope className="mt-1 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-neutral-200 mb-1">Email:</p>
                    <Link 
                      href="mailto:bids@swfoundation.com" 
                      className="text-white font-semibold hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                      aria-label="Email S&W Foundation Contractors at bids@swfoundation.com"
                    >
                      bids@swfoundation.com
                    </Link>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <FaMapMarkerAlt className="mt-1 text-red-400 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-neutral-200 mb-1">Address:</p>
                    <p className="text-white font-medium">
                      2806 Singleton St.<br />
                      Rowlett, TX 75088
                    </p>
                  </div>
                </div>
              </address>

              {/* Social Media Links */}
              <div className="mt-6">
                <h4 className="font-semibold text-white mb-3">Follow Us</h4>
                <div className="flex space-x-4">
                  <Link
                    href="https://www.facebook.com/SWFoundationContractors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#0b2a5a] rounded transition-colors duration-200"
                    aria-label="Visit S&W Foundation Contractors on Facebook (opens in new window)"
                  >
                    <FaFacebook size={20} />
                  </Link>
                  <Link
                    href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-200 hover:text-red-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-[#0b2a5a] rounded transition-colors duration-200"
                    aria-label="Visit S&W Foundation Contractors on LinkedIn (opens in new window)"
                  >
                    <FaLinkedin size={20} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="border-t border-white/10 px-6 py-6 md:px-10">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-neutral-200">
                © {currentYear} S&W Foundation Contractors Inc. All rights reserved.
              </p>
              <nav role="navigation" aria-label="Footer legal links">
                <ul className="flex space-x-6 text-sm">
                  <li>
                    <Link 
                      href="/privacy-policy" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/terms-of-service" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link 
                      href="/contact" 
                      className="text-neutral-200 hover:text-red-400 focus:outline-none focus:underline transition-colors duration-200"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>
        
        {/* Footer Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(footerStructuredData) }}
        />
      </footer>
    </div>
  );
}