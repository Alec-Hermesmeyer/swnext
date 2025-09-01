import Head from "next/head";

export default function HomePage() {
  return (
    <>
      <Head>
        <title>S&W Foundation | Professional Foundation Services</title>
        <meta name="description" content="Professional foundation services including helical piles, pier drilling, and turn-key solutions. Serving commercial and residential projects with expert craftsmanship." />
      </Head>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-[#0b2a5a] to-[#1e40af] text-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Professional Foundation Services
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-gray-200">
                Expert pier drilling, helical piles, and turn-key foundation solutions
              </p>
              <div className="space-x-4">
                <a
                  href="/contact"
                  className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Get Quote
                </a>
                <a
                  href="/services"
                  className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-3 rounded-lg font-semibold transition-colors"
                >
                  Our Services
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Services Preview */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Helical Piles</h3>
                <p className="text-gray-600">Deep foundation solutions with helical piers for maximum stability and load-bearing capacity.</p>
                <a href="/helical-piles" className="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">Learn More →</a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Pier Drilling</h3>
                <p className="text-gray-600">Professional pier drilling services for commercial and residential foundation projects.</p>
                <a href="/pier-drilling" className="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">Learn More →</a>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold mb-4">Turn-Key Solutions</h3>
                <p className="text-gray-600">Complete foundation solutions from planning to completion with expert project management.</p>
                <a href="/turn-key" className="text-blue-600 hover:text-blue-800 font-medium mt-4 inline-block">Learn More →</a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


