import React, { useState } from "react";
import Link from "next/link";
import { FaLinkedin, FaFacebookSquare, FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import Image from "next/image";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900"], subsets: ["latin"] });

const mobileQuickLinks = [
  { name: "Home", link: "/" },
  { name: "Contact", link: "/contact" },
  { name: "Careers", link: "/careers" },
  { name: "Login", link: "/login" },
];

const aboutMenu = [
  { name: "Safety", link: "/safety" },
  { name: "Core Values", link: "/core-values" },
  { name: "Blog", link: "/blog" },
];

const companyMenu = [
  { name: "About", link: "/about" },
  { name: "Gallery", link: "/gallery" },
  ...aboutMenu,
];

const servicesMenu = [
  { name: "Services Overview", link: "/services" },
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
  const [mobileCompanyOpen, setMobileCompanyOpen] = useState(true);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMobileLinkClick = () => {
    setIsMobileMenuOpen(false);
    setMobileCompanyOpen(true);
    setMobileServicesOpen(false);
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
              <li className="cursor-pointer font-bold text-black h-10 w-36 flex items-center justify-center transition-all duration-500 ease-in-out hover:text-red-600">
                <Link href="/login" className={`${lato.className} text-lg`}>Login</Link>
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
            <div className="mx-auto flex w-full max-w-xl flex-col gap-4 px-4 py-5">
              <div className="rounded-3xl border border-white/60 bg-white/78 p-4 shadow-lg backdrop-blur">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-[#10275e]/70">
                  Quick Access
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {mobileQuickLinks.map((item) => (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={handleMobileLinkClick}
                      className="flex min-h-[64px] items-center justify-center rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-center text-base font-bold text-[#10275e] shadow-sm transition-colors duration-200 hover:border-red-200 hover:text-red-600"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/78 p-4 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMobileCompanyOpen((open) => !open)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#10275e]/70">
                      Company
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      About, gallery, safety, and company info.
                    </div>
                  </div>
                  <FaChevronDown
                    className={`text-[#10275e] transition-transform duration-200 ${
                      mobileCompanyOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileCompanyOpen && (
                  <div className="mt-4 grid gap-2">
                    {companyMenu.map((item) => (
                      <Link
                        key={item.link}
                        href={item.link}
                        onClick={handleMobileLinkClick}
                        className="flex items-center justify-between rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors duration-200 hover:border-red-200 hover:text-red-600"
                      >
                        <span>{item.name}</span>
                        <span className="text-xs text-neutral-400">Open</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-3xl border border-white/60 bg-white/78 p-4 shadow-lg backdrop-blur">
                <button
                  type="button"
                  onClick={() => setMobileServicesOpen((open) => !open)}
                  className="flex w-full items-center justify-between text-left"
                >
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.28em] text-[#10275e]/70">
                      Services
                    </div>
                    <div className="mt-1 text-sm text-neutral-600">
                      Start with the overview or jump into a service page.
                    </div>
                  </div>
                  <FaChevronDown
                    className={`text-[#10275e] transition-transform duration-200 ${
                      mobileServicesOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {mobileServicesOpen && (
                  <div className="mt-4 grid gap-2">
                    {servicesMenu.map((item) => (
                      <Link
                        key={item.link}
                        href={item.link}
                        onClick={handleMobileLinkClick}
                        className="rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm font-semibold text-neutral-800 transition-colors duration-200 hover:border-red-200 hover:text-red-600"
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavTailwind;
