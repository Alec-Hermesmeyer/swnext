import React from 'react';
import Head from 'next/head';
import HeroTailwind from '@/components/HeroTailwind';
import NavTailwind from '@/components/NavTailwind';

export default function HeroShowcase() {
  return (
    <>
      <Head>
        <title>Hero Component Showcase - Tailwind CSS</title>
        <meta name="description" content="Testing the new Tailwind CSS Hero component" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* New Tailwind Navigation */}
        <NavTailwind />

        {/* New Tailwind Hero Component */}
        <HeroTailwind />

        {/* Comparison section */}
        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-6">
                New Tailwind CSS Hero Section
              </h2>
              <div className="grid md:grid-cols-2 gap-8 text-left">
                <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">✅ Improvements</h3>
                  <ul className="space-y-2 text-green-700">
                    <li>• Fully responsive design</li>
                    <li>• Modern gradient background</li>
                    <li>• Glass morphism effect cards</li>
                    <li>• Smooth hover animations</li>
                    <li>• Better mobile layout</li>
                    <li>• No CSS modules needed</li>
                    <li>• Consistent spacing & typography</li>
                  </ul>
                </div>
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">🎨 Design Features</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>• Professional color scheme</li>
                    <li>• Construction industry appropriate</li>
                    <li>• High contrast for readability</li>
                    <li>• Call-to-action optimization</li>
                    <li>• Mobile-first approach</li>
                    <li>• Clean, modern aesthetic</li>
                    <li>• Brand colors maintained</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-12 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">📝 Implementation Notes</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  This new Hero component is built entirely with Tailwind CSS utilities. It's responsive, 
                  accessible, and maintains the same content and functionality as the original while providing 
                  a more modern, professional appearance. The component can be easily customized by modifying 
                  Tailwind classes without touching separate CSS files.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// This prevents the _app.js from wrapping this page with Layout components
HeroShowcase.getLayout = function getLayout(page) {
  return page;
};