import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Inter } from "next/font/google"

const inter = Inter({ subsets: ['latin'] })
export default function ServiceHero() {
    return (
        <>
            {/* Services Hero Section */}
            <div className="w-full h-auto">
                {/* Hero Banner */}
                <div className="relative h-[35vw] min-h-96 bg-gradient-to-r from-black/55 to-black/25 bg-cover bg-bottom shadow-xl"
                     style={{backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7517.webp?version=1')"}}>
                    
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-full flex flex-col justify-between items-center">
                            <div className="w-[90%] h-full flex items-start justify-center flex-col">
                                <div className="space-y-6">
                                    <h1 className={`${inter.className} text-4xl md:text-5xl lg:text-7xl font-bold text-white tracking-wider leading-tight`}>
                                        Services
                                    </h1>
                                    
                                    {/* CTA Button */}
                                    <div className="flex items-start justify-between h-15 w-full max-w-md mt-4 -ml-4">
                                        <Link href='/contact'>
                                            <button className="h-10 w-30 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer px-6 flex items-center justify-center shadow-xl transition-colors duration-300">
                                                Get A Free Quote
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Services Info Section */}
                <div className="w-full py-16 md:py-20">
                    <div className="w-full flex flex-col justify-center items-center space-y-16">
                        
                        {/* Info Section 1 */}
                        <div className="w-full flex items-center justify-center pl-0 md:pl-[5%]">
                            <div className="w-full flex items-center justify-center">
                                <div className="w-full flex flex-col md:flex-row items-center justify-center">
                                    
                                    {/* Content */}
                                    <div className="flex-[2] h-full w-full flex items-center justify-center text-white z-10 -mr-0 md:-mr-[2%] mb-8 md:mb-0">
                                        <div className="w-full md:w-[70vw] h-full md:h-[95%] flex items-center justify-between flex-col bg-blue-900 border-t-6 md:border-t-[25px] border-red-600 py-8 px-6">
                                            <h2 className={`${inter.className} text-3xl md:text-5xl font-black text-center w-[90%] text-white mb-6`}>
                                                Pier Drilling Experts
                                            </h2>
                                            <p className={`${inter.className} text-base md:text-lg font-bold text-center w-[90%] text-white leading-relaxed`}>
                                                S&W offers more knowledge and better equipment than your average driller.
                                            </p>
                                            <Link href='/contact'>
                                                <button className="mt-6 h-10 w-48 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer flex items-center justify-center shadow-xl transition-colors duration-300">
                                                    Get A Free Quote
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                    
                                    {/* Image */}
                                    <div className="flex-1 h-full w-full flex items-center justify-center z-20">
                                        <Image
                                            src='/galleryImages/gal18.jpeg'
                                            height={520}
                                            width={520}
                                            quality={100}
                                            alt="Commercial Drilling Rig"
                                            loading='eager'
                                            priority
                                            className="shadow-xl object-cover rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Info Section 2 - Reversed */}
                        <div className="w-full flex items-center justify-center pl-0 md:pl-[1%] pb-0 md:pb-[2%]">
                            <div className="w-full flex items-center justify-center">
                                <div className="w-full flex flex-col-reverse md:flex-row items-center justify-center">
                                    
                                    {/* Image */}
                                    <div className="flex-1 h-full w-full flex items-center justify-center z-20 mb-8 md:mb-0">
                                        <Image
                                            src='/galleryImages/gal18.jpeg'
                                            height={520}
                                            width={520}
                                            quality={100}
                                            alt="Commercial Drilling Equipment"
                                            loading='lazy'
                                            className="shadow-xl object-cover rounded"
                                        />
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-[2] h-full w-full flex items-center justify-center text-white z-10 mr-0 md:mr-[2%]">
                                        <div className="w-full md:w-[70vw] h-full md:h-[95%] flex items-center justify-between flex-col bg-blue-900 border-t-6 md:border-t-[25px] border-red-600 py-8 px-6">
                                            <h2 className={`${inter.className} text-3xl md:text-5xl font-black text-center w-[90%] text-white mb-6`}>
                                                Safe and Professional
                                            </h2>
                                            <p className={`${inter.className} text-base md:text-lg font-bold text-center w-[90%] text-white leading-relaxed`}>
                                                S&W's top priority is Safety and we dedicate ourselves to educating all employees.
                                            </p>
                                            <Link href='/contact'>
                                                <button className="mt-6 h-10 w-48 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer flex items-center justify-center shadow-xl transition-colors duration-300">
                                                    Get A Free Quote
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Info Section 3 */}
                        <div className="w-full flex items-center justify-center pl-0 md:pl-[5%]">
                            <div className="w-full flex items-center justify-center">
                                <div className="w-full flex flex-col md:flex-row items-center justify-center">
                                    
                                    {/* Content */}
                                    <div className="flex-[2] h-full w-full flex items-center justify-center text-white z-10 -mr-0 md:-mr-[2%] mb-8 md:mb-0">
                                        <div className="w-full md:w-[70vw] h-full md:h-[95%] flex items-center justify-between flex-col bg-blue-900 border-t-6 md:border-t-[25px] border-red-600 py-8 px-6">
                                            <h2 className={`${inter.className} text-3xl md:text-5xl font-black text-center w-[90%] text-white mb-6`}>
                                                Top Of The Line Equipment
                                            </h2>
                                            <p className={`${inter.className} text-base md:text-lg font-bold text-center w-[90%] text-white leading-relaxed`}>
                                                We are proudly able to offer the best equipment on the market to our clients.
                                            </p>
                                            <Link href='/contact'>
                                                <button className="mt-6 h-10 w-48 rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-base font-black cursor-pointer flex items-center justify-center shadow-xl transition-colors duration-300">
                                                    Get A Free Quote
                                                </button>
                                            </Link>
                                        </div>
                                    </div>
                                    
                                    {/* Image */}
                                    <div className="flex-1 h-full w-full flex items-center justify-center z-20">
                                        <Image
                                            src='/galleryImages/gal18.jpeg'
                                            height={520}
                                            width={520}
                                            quality={100}
                                            alt="Professional Drilling Equipment"
                                            loading='lazy'
                                            className="shadow-xl object-cover rounded"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Contact Section */}
                <div className="h-[70vh] w-full flex items-center justify-center bg-gradient-to-r from-black/65 to-black/15 bg-cover bg-bottom mt-5 -mb-14"
                     style={{backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/IMG_7753.webp')"}}>
                    
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="w-4/5 h-4/5 flex flex-col items-center justify-center">
                            <div className="h-full w-full flex flex-col items-center justify-between">
                                <h2 className={`${inter.className} text-4xl md:text-6xl font-black text-white w-4/5 pb-4 text-center`}>
                                    Ready to Get Started?
                                </h2>
                                <Link href='/contact'>
                                    <button className="h-20 w-full max-w-md rounded-md border-none bg-red-600 hover:bg-red-700 text-white text-2xl md:text-3xl font-black tracking-wider shadow-lg cursor-pointer transition-colors duration-300">
                                        Contact Us Today
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