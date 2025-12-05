import React from 'react'
import Link from 'next/link'
import { FaLinkedin, FaFacebookSquare } from 'react-icons/fa'
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

const FooterTailwind = () => {
  return (
    <footer className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-[#0b2a5a] text-white">
      <div className="mx-auto w-full px-0">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-6 px-6 py-10 md:grid-cols-3 lg:grid-cols-4 md:px-10">
          
          {/* Company Logo & Description */}
          <div className="flex flex-col items-start">
            <div className="inline-flex h-20 w-20 items-center justify-center mb-4">
              <Image
                src="/att.png"
                alt="S&W Foundation Contractors"
                width={90}
                height={26}
                sizes="90px"
                priority
                unoptimized
                loader={({ src }) => src}
              />
            </div>
            <p className="text-sm text-neutral-200 leading-relaxed">
              Commercial Pier Drilling - Dallas, Texas
            </p>
          </div>

          {/* Company Links */}
          <div className="flex flex-col">
            <h4 className={`${lato.className} font-black text-white text-base mb-4`}>Company</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Home
              </Link>
              <Link 
                href="/about" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                About
              </Link>
              <Link 
                href="/services" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Services
              </Link>
              <Link 
                href="/core-values" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Core Values
              </Link>
              <Link 
                href="/safety" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Safety
              </Link>
              <Link 
                href="/blog" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Blog
              </Link>
            </nav>
          </div>

          {/* Additional Links */}
          <div className="flex flex-col">
            <h4 className={`${lato.className} font-black text-white text-base mb-4`}>More</h4>
            <nav className="flex flex-col space-y-2">
              <Link 
                href="/contact" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Contact
              </Link>
              <Link 
                href="/careers" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Careers
              </Link>
              <Link 
                href="/gallery" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Gallery
              </Link>
              <Link 
                href="/sitemap.xml" 
                className="text-sm text-neutral-200 hover:text-red-400 transition-colors duration-200"
              >
                Site Map
              </Link>
            </nav>
          </div>

          {/* Contact & Social */}
          <div className="flex flex-col">
            <h4 className={`${lato.className} font-black text-white text-base mb-4`}>Contact</h4>
            <div className="space-y-3">
              <div className="flex flex-col space-y-1 text-sm text-neutral-200">
                <span>Phone: (214)-703-0484</span>
                <Link 
                  href="https://www.google.com/maps/place/S%26W+Foundation+Contractors,+Inc/@32.9011454,-96.5784943,17z/data=!3m1!4b1!4m5!3m4!1s0x864c1f00ef50672f:0xdd234fc753135183!8m2!3d32.9011454!4d-96.5759194" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-red-400 transition-colors duration-200"
                >
                  2806 Singleton St, Rowlett, TX 75088
                </Link>
              </div>
              
              {/* Social Icons */}
              <div className="flex items-center space-x-4 pt-2">
                <a
                  href="https://www.facebook.com/SWFoundationContractors"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-red-400 transition-colors duration-200"
                  aria-label="Facebook"
                >
                  <FaFacebookSquare size={24} />
                </a>
                <a
                  href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-red-400 transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin size={24} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Footer Bar */}
        <div className="border-t border-white/10 px-6 py-4 md:px-10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
            <p className="text-sm text-neutral-400 text-center md:text-left">
              © {new Date().getFullYear()} S&W Foundation Contractors. All Rights Reserved
            </p>
            <div className="flex items-center space-x-4 text-sm">
              <Link 
                href="/sitemap.xml" 
                className="text-neutral-400 hover:text-red-400 transition-colors duration-200"
              >
                Site Map
              </Link>
              <span className="text-neutral-600">|</span>
              <Link 
                href="/privacy" 
                className="text-neutral-400 hover:text-red-400 transition-colors duration-200"
              >
                Privacy Policy
              </Link>
              <span className="text-neutral-600">|</span>
              <Link 
                href="/terms" 
                className="text-neutral-400 hover:text-red-400 transition-colors duration-200"
              >
                Terms of Use
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default FooterTailwind