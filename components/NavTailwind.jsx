import React, { useState } from "react";
import Link from "next/link";
import { FaLinkedin, FaFacebookSquare, FaBars, FaTimes } from "react-icons/fa";
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

// Full mobile list for navigation
const mobileLinks = [
  { name: "Home", link: "/" },
  { name: "About", link: "/about" },
  { name: "Services", link: "/services" },
  { name: "Pier Drilling", link: "/pier-drilling" },
  { name: "Limited Access Pier Drilling", link: "/limited-access" },
  { name: "Turn Key Drilling Solutions", link: "/turn-key" },
  { name: "Crane Services", link: "/crane" },
  { name: "Helical Piles", link: "/helical-piles" },
  { name: "Contact", link: "/contact" },
  { name: "Careers", link: "/careers" },
  { name: "Gallery", link: "/gallery" },
  { name: "Safety", link: "/safety" },
  { name: "Core Values", link: "/core-values" },
  { name: "Blog", link: "/blog" },
  { name: "Login", link: "/login" },
];

const aboutMenu = [
  { name: "Safety", link: "/safety" },
  { name: "Core Values", link: "/core-values" },
  { name: "Blog", link: "/blog" },
];

const servicesMenu = [
  { name: "Pier Drilling", link: "/pier-drilling" },
  { name: "Limited Access Pier Drilling", link: "/limited-access" },
  { name: "Turn Key Drilling Solutions", link: "/turn-key" },
  { name: "Crane Services", link: "/crane" },
  { name: "Helical Piles", link: "/helical-piles" },
];

const NavTailwind = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-[5px_15px_25px_rgba(0,0,0,0.43)] fixed top-0 w-full z-50 h-[15vh] flex items-center justify-center max-md:h-[12vh]">
      <div className="mx-auto w-[95%] h-full max-w-7xl">
        <div className="flex items-center justify-evenly h-full w-full max-md:justify-between max-md:px-4">
          
          {/* Logo */}
          <div className="flex-1 flex items-center justify-center">
            <Link href="/">
              <Image
                src="Images/public/att.webp"
                alt="S&W Foundation Contractors Logo"
                width={100}
                height={100}
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="flex-[3] h-full w-[70%] hidden lg:flex items-center justify-center">
            <ul className="list-none flex items-center justify-evenly w-full">
              {/* About dropdown */}
              <li
                className="relative cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600 bg-white/60 rounded-lg"
                onMouseEnter={() => setAboutOpen(true)}
                onMouseLeave={() => setAboutOpen(false)}
              >
                <Link href="/about" className={`${lato.className} text-lg`}>
                  About
                </Link>
                {aboutOpen && (
                  <ul className="absolute top-full left-0 w-52 bg-white/60 rounded-lg list-none p-0 m-0 flex flex-col items-center justify-evenly z-[1000] transition-all duration-300 ease-in-out">
                    {aboutMenu.map((item) => (
                      <li key={item.link} className="w-full">
                        <Link
                          href={item.link}
                          className="block w-full py-3 text-center text-black hover:text-red-600 transition-all duration-100 ease-in-out text-lg"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {/* Services dropdown */}
              <li
                className="relative cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600 bg-white/60 rounded-lg"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <Link href="/services" className={`${lato.className} text-lg`}>
                  Services
                </Link>
                {servicesOpen && (
                  <ul className="absolute top-full left-0 w-64 bg-white/60 rounded-lg list-none p-0 m-0 flex flex-col items-center justify-evenly z-[1000] transition-all duration-300 ease-in-out">
                    {servicesMenu.map((item) => (
                      <li key={item.link} className="w-full">
                        <Link
                          href={item.link}
                          className="block w-full py-3 text-center text-black hover:text-red-600 transition-all duration-100 ease-in-out text-lg"
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              {/* Direct links */}
              <li className="cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600">
                <Link href="/contact" className={`${lato.className} text-lg`}>Contact</Link>
              </li>
              <li className="cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600">
                <Link href="/careers" className={`${lato.className} text-lg`}>Careers</Link>
              </li>
              <li className="cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600">
                <Link href="/gallery" className={`${lato.className} text-lg`}>Gallery</Link>
              </li>
            </ul>
          </div>

          {/* Social Links & Mobile Menu Button */}
          <div className="flex-[1.2] h-full w-full flex items-center justify-end">
            <div className="mt-2.5 flex items-center justify-evenly w-[70%] text-[#10275e] text-[30px]">
              {/* Social Links - Hidden on mobile */}
              <a
                href="https://www.facebook.com/SWFoundationContractors"
                target="_blank"
                rel="noopener noreferrer"
                className="lg:block hidden hover:text-red-600 transition-colors duration-200"
                aria-label="Facebook"
              >
                <FaFacebookSquare />
              </a>
              <a
                href="https://www.linkedin.com/company/s-w-foundation-contractors-inc"
                target="_blank"
                rel="noopener noreferrer"
                className="lg:block hidden hover:text-red-600 transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <FaLinkedin />
              </a>

              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="lg:hidden p-2 text-black hover:text-red-600 transition-colors duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="fixed top-[15vh] md:top-[12vh] left-0 w-full h-[calc(100vh-15vh)] md:h-[calc(100vh-12vh)] overflow-y-auto bg-gradient-to-r from-red-800 via-white to-[#10275e] flex transition-all duration-800 ease-in-out lg:hidden z-40">
            <div className="w-full">
              <ul className="list-none flex flex-col items-center justify-evenly h-full w-full py-4">
                {mobileLinks.map((item, index) => (
                  <li key={index} className="w-full text-center py-2">
                    <Link
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="text-black text-center text-xl font-bold flex items-center justify-center py-3 hover:text-red-600 transition-colors duration-200"
                      style={{ textShadow: '2px 2px 2px white' }}
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavTailwind;