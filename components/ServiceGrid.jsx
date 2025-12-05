import React from 'react';
import Link from 'next/link';
import { Inter } from "next/font/google"
import Image from 'next/image';

const inter = Inter({ subsets: ['latin'] })

const LogoImage = () => (
  <Image
    className="w-full max-w-[250px] h-auto object-contain"
    src='/att.png'
    height={250}
    width={250}
    alt='S&W Foundations Logo'
    loading='lazy'
    quality={80}
  />
);

const ServicesGrid = () => {
  return (
    <>
        {/* Services Grid Section */}
        <div className="min-h-[40vh] w-[95vw] max-w-7xl mx-auto overflow-hidden border border-gray-800 rounded-lg bg-white shadow-xl">
            {/* Container */}
            <div className="h-full w-full flex items-center justify-between p-6">
                <div className="flex items-center justify-between h-full w-full">
                    
                    {/* Services Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full h-full gap-4">
                        
                        {/* Service Card 1 */}
                        <div className="group flex flex-col items-center justify-between w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 hover:text-blue-900 transition-all duration-300 hover:shadow-xl">
                            <h2 className={`${inter.className} text-xl font-bold text-gray-800 group-hover:text-blue-900 mb-4 text-center`}>
                                Pier Drilling
                            </h2>
                            <p className={`${inter.className} text-sm text-gray-600 group-hover:text-blue-800 leading-relaxed text-center mb-6 flex-grow`}>
                                S&W Foundations specializes in high-quality pier drilling for commercial and industrial projects. With expert teams and advanced technology, we deliver tailored solutions from planning to installation. Trust us for all your pier drilling needs and rest assured that your project is in good hands.
                            </p>
                            <Link href='/contact'>
                                <button className="w-full h-12 px-4 py-2 rounded-lg border border-blue-900 bg-black text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:bg-blue-900 hover:border-blue-700 transition-all duration-300">
                                    Get A Free Quote
                                </button>
                            </Link>
                        </div>
                        
                        {/* Service Card 2 */}
                        <div className="group flex flex-col items-center justify-between w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 hover:text-blue-900 transition-all duration-300 hover:shadow-xl">
                            <h2 className={`${inter.className} text-xl font-bold text-gray-800 group-hover:text-blue-900 mb-4 text-center`}>
                                Limited-Access Pier Drilling
                            </h2>
                            <p className={`${inter.className} text-sm text-gray-600 group-hover:text-blue-800 leading-relaxed text-center mb-6 flex-grow`}>
                                S&W Foundations offers specialized limited-access pier drilling services for challenging site conditions. Our experienced team and state-of-the-art equipment provide safe and efficient drilling in hard-to-reach areas. Trust us for quality and safety in all your limited-access pier drilling needs.
                            </p>
                            <Link href='/contact'>
                                <button className="w-full h-12 px-4 py-2 rounded-lg border border-blue-900 bg-black text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:bg-blue-900 hover:border-blue-700 transition-all duration-300">
                                    Get A Free Quote
                                </button>
                            </Link>
                        </div>
                        
                        {/* Service Card 3 */}
                        <div className="group flex flex-col items-center justify-between w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 hover:text-blue-900 transition-all duration-300 hover:shadow-xl">
                            <h2 className={`${inter.className} text-xl font-bold text-gray-800 group-hover:text-blue-900 mb-4 text-center`}>
                                Turn-Key Drilling Solutions
                            </h2>
                            <p className={`${inter.className} text-sm text-gray-600 group-hover:text-blue-800 leading-relaxed text-center mb-6 flex-grow`}>
                                S&W Foundations provides turn-key drilling solutions through a versatile, experienced team and state-of-the-art fleet. We offer a wide range of services for all your drilling needs. Choose us for skilled labor and complete solutions.
                            </p>
                            <Link href='/contact'>
                                <button className="w-full h-12 px-4 py-2 rounded-lg border border-blue-900 bg-black text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:bg-blue-900 hover:border-blue-700 transition-all duration-300">
                                    Get A Free Quote
                                </button>
                            </Link>
                        </div>
                        
                        {/* Service Card 4 */}
                        <div className="group flex flex-col items-center justify-between w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 hover:text-blue-900 transition-all duration-300 hover:shadow-xl">
                            <h2 className={`${inter.className} text-xl font-bold text-gray-800 group-hover:text-blue-900 mb-4 text-center`}>
                                Crane Services
                            </h2>
                            <p className={`${inter.className} text-sm text-gray-600 group-hover:text-blue-800 leading-relaxed text-center mb-6 flex-grow`}>
                                S&W Foundations offers reliable crane services with a fleet of well-maintained cranes and experienced operators for a variety of lifting and hoisting needs, ensuring safety and efficiency in every project. Trust us for all your crane service needs.
                            </p>
                            <Link href='/contact'>
                                <button className="w-full h-12 px-4 py-2 rounded-lg border border-blue-900 bg-black text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:bg-blue-900 hover:border-blue-700 transition-all duration-300">
                                    Get A Free Quote
                                </button>
                            </Link>
                        </div>
                        
                        {/* Logo Card */}
                        <div className="group flex flex-col items-center justify-center w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 transition-all duration-300 hover:shadow-xl">
                            <LogoImage />
                        </div>
                        
                        {/* Service Card 5 */}
                        <div className="group flex flex-col items-center justify-between w-full min-h-[300px] bg-white border border-gray-800 rounded-lg p-6 hover:bg-gray-50 hover:border-blue-900 hover:text-blue-900 transition-all duration-300 hover:shadow-xl">
                            <h2 className={`${inter.className} text-xl font-bold text-gray-800 group-hover:text-blue-900 mb-4 text-center`}>
                                Soil Retention
                            </h2>
                            <p className={`${inter.className} text-sm text-gray-600 group-hover:text-blue-800 leading-relaxed text-center mb-6 flex-grow`}>
                                S&W Foundations provides comprehensive soil retention services with advanced technology and techniques for safe and efficient completion of your construction project, offering a wide range of tailored services for temporary shoring. Trust us for quality soil retention solutions.
                            </p>
                            <Link href='/contact'>
                                <button className="w-full h-12 px-4 py-2 rounded-lg border border-blue-900 bg-black text-white shadow-lg shadow-blue-900/50 cursor-pointer hover:bg-blue-900 hover:border-blue-700 transition-all duration-300">
                                    Get A Free Quote
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </>
  )
}

export default ServicesGrid