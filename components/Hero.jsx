import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ['latin'] });


const Hero = () => {

  return (

    <>
        {/* Hero Section */}
        <div className="relative h-screen w-full flex flex-col items-center justify-center overflow-hidden z-10 shadow-xl">
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 to-black/25 bg-cover bg-center" 
                 style={{backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/trucks2.webp?version=1')"}}>
            </div>
            
            {/* Content Container */}
            <div className="relative z-20 w-full max-w-7xl mx-auto px-6 h-full flex items-center justify-center">
                <div className="w-full h-4/5 flex items-center justify-center">
                    
                    {/* Left Section */}
                    <div className="flex-[2] h-full flex items-center justify-between flex-col lg:flex-row">
                        
                        {/* Hero Content */}
                        <div className="flex-1 flex flex-col items-center justify-center text-center pt-8 pb-5 mt-5">
                            <div className="space-y-4">
                                <h1 className={`${inter.className} text-white text-xl lg:text-4xl xl:text-5xl font-bold tracking-wide leading-tight`}>
                                    Commercial Pier Drilling - Dallas, Texas
                                </h1>
                                <h2 className={`${inter.className} text-white text-lg lg:text-2xl xl:text-3xl font-black tracking-wide leading-relaxed pb-3`}>
                                    S&W Foundation Contractors
                                </h2>
                                <h3 className={`${inter.className} text-white text-base lg:text-xl xl:text-2xl font-black tracking-wide leading-tight pb-3`}>
                                    Drilling Beyond Limits
                                </h3>
                                
                                {/* CTA Button */}
                                <div className="flex justify-center w-full mt-8">
                                    <Link href='/contact'>
                                        <button className="h-12 w-40 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black shadow-lg cursor-pointer transition-colors duration-300">
                                            Get A Free Quote
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                        
                        {/* Hero Image */}
                        <div className="flex-1 flex items-center justify-center">
                            <Image
                                src='/heroImg1.png'
                                height={620}
                                width={720}
                                quality={80}
                                alt="Commercial Drilling Rig" 
                                loading='eager'
                                priority
                                className="max-w-full h-auto object-fill"
                            />
                        </div>
                    </div>
                    
                    {/* Right Section - Cards */}
                    <div className="flex-1 h-full flex items-center justify-center z-10">
                        <div className="h-3/5 w-full bg-blue-900 border-t-8 border-red-600 rounded-md mr-0 lg:mr-4 mt-0 lg:mt-12 flex items-center justify-center">
                            <div className="h-full w-11/12 flex items-center justify-between">
                                <div className="h-full w-full flex items-center justify-between flex-col py-4">
                                    
                                    {/* Company Info */}
                                    <div className="text-center space-y-4">
                                        <h3 className="text-white text-base lg:text-xl font-semibold">
                                            We Provide Nation-Wide Service
                                        </h3>
                                        <ul className="list-none p-0 space-y-2">
                                            <li className="text-white text-sm lg:text-base leading-8 font-normal list-none p-0">
                                                Call: (214)-703-0484
                                            </li>
                                            <li className="text-white text-sm lg:text-base leading-8 font-normal list-none p-0">
                                                Address: 2806 Singleton St.
                                            </li>
                                            <li className="text-white text-sm lg:text-base leading-8 font-normal list-none p-0">
                                                Rowlett, TX 75088
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    {/* CTA Buttons */}
                                    <div className="flex items-center justify-between w-full px-4">
                                        <Link href='/contact'>
                                            <button className="h-10 w-30 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer px-4 transition-colors duration-300">
                                                Contact
                                            </button>
                                        </Link>
                                        <Link href='/careers'>
                                            <button className="h-10 w-30 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer px-4 transition-colors duration-300">
                                                Careers
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        {/* Features Grid Section */}
        <div className="w-full bg-white py-12 shadow-xl">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    
                    {/* Feature Card 1 */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className={`${inter.className} text-xl font-bold text-gray-800 mb-4 flex items-center`}>
                            <span className="text-red-600 mr-2">→</span> 13-Time ADSC Safety Award Winner
                        </h2>
                        <p className={`${inter.className} text-gray-600 leading-relaxed`}>
                            Fully-licensed and insured by the Texas State License Board.
                        </p>
                    </div>
                    
                    {/* Feature Card 2 */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className={`${inter.className} text-xl font-bold text-gray-800 mb-4 flex items-center`}>
                            <span className="text-red-600 mr-2">→</span> Experienced and Knowledgeable
                        </h2>
                        <p className={`${inter.className} text-gray-600 leading-relaxed`}>
                            Privately-owned and locally-operated for more than 30 years.
                        </p>
                    </div>
                    
                    {/* Feature Card 3 */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className={`${inter.className} text-xl font-bold text-gray-800 mb-4 flex items-center`}>
                            <span className="text-red-600 mr-2">→</span> Limited Access Pier Drilling Specialist
                        </h2>
                        <p className={`${inter.className} text-gray-600 leading-relaxed`}>
                            Working conditions cramped? Not an issue for S&W Foundations Contractors Inc.!
                        </p>
                    </div>
                    
                    {/* Feature Card 4 */}
                    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <h2 className={`${inter.className} text-xl font-bold text-gray-800 mb-4 flex items-center`}>
                            <span className="text-red-600 mr-2">→</span> Nation-Wide Service
                        </h2>
                        <p className={`${inter.className} text-gray-600 leading-relaxed`}>
                            Here at S&W Foundation Contractors Inc. we offer our services Nation-Wide!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </>
  );
};
export default Hero;