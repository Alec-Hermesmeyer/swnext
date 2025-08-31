import React, { useState } from "react";
import Link from "next/link";
import { FaLinkedin, FaFacebookSquare, FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

// Full mobile list mirrors legacy navbar
const mobileLinks = [
  { name: "Home", link: "/tw" },
  { name: "About", link: "/tw/about" },
  { name: "Services", link: "/tw/services" },
  { name: "Pier Drilling", link: "/tw/pier-drilling" },
  { name: "Limited Access Pier Drilling", link: "/tw/limited-access" },
  { name: "Turn Key Drilling Solutions", link: "/tw/turn-key" },
  { name: "Crane Services", link: "/tw/crane" },
  { name: "Helical Piles", link: "/tw/helical-piles" },
  { name: "Contact", link: "/tw/contact" },
  { name: "Careers", link: "/tw/careers" },
  { name: "Gallery", link: "/tw/gallery" },
  { name: "Safety", link: "/tw/safety" },
  { name: "Core Values", link: "/tw/core-values" },
  { name: "Blog", link: "/tw/blog" },
  { name: "Login", link: "/tw/login" },
];

const aboutMenu = [
  { name: "Safety", link: "/tw/safety" },
  { name: "Core Values", link: "/tw/core-values" },
  { name: "Blog", link: "/tw/blog" },
];

const servicesMenu = [
  { name: "Pier Drilling", link: "/tw/pier-drilling" },
  { name: "Limited Access Pier Drilling", link: "/tw/limited-access" },
  { name: "Turn Key Drilling Solutions", link: "/tw/turn-key" },
  { name: "Crane Services", link: "/tw/crane" },
  { name: "Helical Piles", link: "/tw/helical-piles" },
];

const NavTailwind = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm sticky top-0 z-50 py-2">
      <div className="mx-auto w-full max-w-[1600px] px-4 md:px-6">
        <div className="flex items-center justify-between min-h-16 py-1">
          
          {/* Logo */}
          <Link href="/tw" className="flex items-center">
            <Image
              src="/swlogorwb.png"
              alt="S&W Foundation Contractors"
              width={140}
              height={40}
              sizes="140px"
              priority
              unoptimized
              loader={({ src }) => src}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {/* About dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setAboutOpen(true)}
              onMouseLeave={() => setAboutOpen(false)}
            >
              <Link href="/tw/about" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>
                About
              </Link>
              {aboutOpen && (
                <div className="absolute left-0 top-full z-50 w-56 rounded-md border border-neutral-200 bg-white py-2 shadow-xl">
                  {aboutMenu.map((i) => (
                    <Link key={i.link} href={i.link} className="block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50">
                      {i.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Services dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setServicesOpen(true)}
              onMouseLeave={() => setServicesOpen(false)}
            >
              <Link href="/tw/services" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>
                Services
              </Link>
              {servicesOpen && (
                <div className="absolute left-0 top-full z-50 w-72 rounded-md border border-neutral-200 bg-white py-2 shadow-xl">
                  {servicesMenu.map((i) => (
                    <Link key={i.link} href={i.link} className="block px-4 py-2 text-sm text-neutral-800 hover:bg-neutral-50">
                      {i.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Direct links */}
            <Link href="/tw/contact" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>Contact</Link>
            <Link href="/tw/careers" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>Careers</Link>
            <Link href="/tw/gallery" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>Gallery</Link>
            <Link href="/tw/blog" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>Blog</Link>
            <Link href="/tw/login" className={`${lato.className} text-base font-semibold text-neutral-800 hover:text-red-600`}>Login</Link>
          </div>

          {/* Social Links & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {/* Social Links */}
            <div className="hidden md:flex items-center space-x-3">
              <a
                href="https://www.facebook.com/SWFoundationContractors"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <FaFacebookSquare size={24} />
              </a>
              <a
                href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
              >
                <FaLinkedin size={24} />
              </a>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMobileMenu}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors duration-200"
            >
              {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            <div className="flex flex-col space-y-1">
              {mobileLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 text-base font-medium text-gray-800 hover:text-red-600 hover:bg-gray-50 transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile Social */}
              <div className="px-4 py-3 border-t border-gray-200 mt-4">
                <div className="flex items-center space-x-4">
                  <a
                    href="https://www.facebook.com/SWFoundationContractors"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    <FaFacebookSquare size={24} />
                  </a>
                  <a
                    href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    <FaLinkedin size={24} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavTailwind;