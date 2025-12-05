import React from 'react';
import Link from 'next/link';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ['latin'] });

const HeroTailwind = () => {
  return (
    <>
      {/* Hero Section with Construction Background */}
      <section className="relative h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('/heroImg1.png')"}}>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        
        {/* Hero Content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className={`${inter.className} text-3xl md:text-5xl lg:text-6xl font-bold leading-tight`}>
              Commercial Pier Drilling - Dallas, Texas
            </h1>
            <h2 className={`${inter.className} text-xl md:text-2xl lg:text-3xl font-light text-gray-200`}>
              S&W Foundation Contractors
            </h2>
            <p className={`${inter.className} text-lg md:text-xl lg:text-2xl font-light italic text-gray-300 mt-4`}>
              Drilling Beyond Limits
            </p>
            
            {/* Red CTA Button */}
            <div className="mt-8">
              <Link 
                href="/services"
                className="inline-block px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold text-lg rounded transition-colors duration-300 shadow-lg"
              >
                Our Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Blue Contact Section */}
      <section className="bg-blue-800 text-white py-8">
        {/* Red Stripe */}
        <div className="h-2 bg-red-600 w-full"></div>
        
        <div className="container mx-auto px-4 text-center py-6">
          <h2 className={`${inter.className} text-2xl md:text-3xl font-bold mb-4`}>
            We Provide Nation-Wide Service
          </h2>
          <div className="space-y-2 mb-6">
            <p className={`${inter.className} text-lg md:text-xl`}>
              Call: (214)-703-0484
            </p>
            <p className={`${inter.className} text-base md:text-lg text-gray-200`}>
              Address: 2806 Singleton St. Rowlett, TX 75088
            </p>
          </div>
          
          {/* Red CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/contact"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors duration-300"
            >
              Contact Us
            </Link>
            <Link 
              href="/careers"
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded transition-colors duration-300"
            >
              Careers
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroTailwind;