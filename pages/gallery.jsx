import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { useState, useEffect } from "react";
import { Lato } from "next/font/google";
const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

// Gallery images are served from public/galleryImages/
const GALLERY_BASE = "/galleryImages";

const CATEGORY_META = {
  "Pier Drilling": { description: "Commercial and industrial deep foundation drilling projects", badge: "PIER DRILLING" },
  "Equipment & Operations": { description: "Our state-of-the-art drilling equipment and professional crews in action", badge: "EQUIPMENT" },
  "Infrastructure Projects": { description: "Large-scale infrastructure and public works foundation projects", badge: "INFRASTRUCTURE" },
  "Commercial Buildings": { description: "Office buildings, retail centers, and commercial developments", badge: "COMMERCIAL" },
  "Industrial Projects": { description: "Manufacturing facilities, warehouses, and industrial complexes", badge: "INDUSTRIAL" },
};

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[60vh] md:min-h-[70vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/homeHero.webp')" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-6 md:px-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className={`${lato.className} text-4xl md:text-6xl font-extrabold mb-6`}>
            Our Project Portfolio
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Explore our extensive portfolio of commercial pier drilling and foundation projects. 
            From high-rise buildings to industrial complexes, see the quality and expertise that sets us apart.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="#project-categories" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-xl hover:bg-red-700 transition-colors">
              View Projects by Category
            </Link>
            <Link href="/contact" className="inline-flex items-center rounded-md bg-white/10 px-8 py-4 text-lg font-bold text-white ring-1 ring-white/30 hover:bg-white/20 transition-colors">
              Start Your Project
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectStats() {
  const stats = [
    { number: "500+", label: "Projects Completed", description: "Commercial & industrial" },
    { number: "35+", label: "Years of Experience", description: "Since 1986" },
    { number: "50+", label: "States Served", description: "Nationwide coverage" },
    { number: "23", label: "Drilling Rigs", description: "State-of-the-art fleet" },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 bg-[#0b2a5a] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 md:px-10">
        <FadeIn>
          <div className="text-center mb-12">
            <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold mb-4`}>
              Our Track Record
            </h2>
            <p className="text-xl text-white/80 max-w-3xl mx-auto">
              Three decades of excellence in foundation construction across the United States.
            </p>
          </div>
        </FadeIn>
        
        <FadeInStagger>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, index) => (
              <FadeIn key={index}>
                <div>
                  <div className={`${lato.className} text-3xl md:text-4xl font-black text-red-500 mb-2`}>
                    {stat.number}
                  </div>
                  <h3 className={`${lato.className} text-lg font-bold mb-2`}>
                    {stat.label}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {stat.description}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}

function ProjectCategories() {
  const [galleryData, setGalleryData] = useState({});
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loaded, setLoaded] = useState(false);

  // Fetch gallery images from database
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/gallery-images");
        const data = await res.json();
        const images = data.images || [];

        // Group by category
        const grouped = {};
        images.forEach((img) => {
          const cat = img.category || "Uncategorized";
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(img);
        });

        // Sort each category by sort_order
        Object.values(grouped).forEach((arr) =>
          arr.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        );

        const catList = Object.keys(grouped);
        setGalleryData(grouped);
        setCategories(catList);
        if (catList.length) setSelectedCategory(catList[0]);
      } catch {
        // Fallback empty
      } finally {
        setLoaded(true);
      }
    };
    load();
  }, []);

  // Close modal with Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && selectedImage) {
        setSelectedImage(null);
      }
    };

    if (selectedImage) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  const currentImages = galleryData[selectedCategory] || [];
  const meta = CATEGORY_META[selectedCategory] || { description: "", badge: selectedCategory?.toUpperCase() };

  return (
    <section id="project-categories" className="mx-auto w-full max-w-7xl px-6 py-16">
      <div className="text-center mb-12">
        <h2 className={`${lato.className} text-3xl md:text-4xl font-extrabold text-[#0b2a5a] mb-4`}>
          Projects by Category
        </h2>
        <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
          Browse our work organized by project type to see the breadth of our expertise and capabilities.
        </p>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-lg font-bold transition-colors duration-200 ${
              selectedCategory === category
                ? "bg-red-600 text-white shadow-lg"
                : "bg-white text-[#0b2a5a] border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {(CATEGORY_META[category]?.badge) || category.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Selected Category Description */}
      {selectedCategory && (
        <div className="text-center mb-8">
          <h3 className={`${lato.className} text-2xl font-bold text-[#0b2a5a] mb-3`}>
            {selectedCategory}
          </h3>
          {meta.description && (
            <p className="text-neutral-600 max-w-2xl mx-auto">{meta.description}</p>
          )}
        </div>
      )}

      {/* Project Images Grid */}
      {!loaded ? (
        <div className="text-center py-12 text-neutral-500">Loading gallery...</div>
      ) : (
        <div key={selectedCategory}>
          <FadeInStagger>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentImages.map((project) => (
                <FadeIn key={project.id || project.filename}>
                  <div
                    className="group relative overflow-hidden rounded-xl bg-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedImage(project)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedImage(project);
                      }
                    }}
                    aria-label="View project image"
                  >
                    <div className="aspect-[4/3] overflow-hidden">
                      <Image
                        src={`${GALLERY_BASE}/${project.filename}`}
                        alt={project.title || "S&W Foundation project"}
                        width={600}
                        height={450}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        unoptimized
                        loader={({ src }) => src}
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </FadeInStagger>
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setSelectedImage(null)}
        >
          {/* Close button */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 z-20 bg-white/10 hover:bg-white/20 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors text-2xl font-bold backdrop-blur-sm"
            aria-label="Close modal"
          >
            ×
          </button>

          {/* Image container */}
          <div
            className="relative w-full h-full flex flex-col items-center justify-center p-4 md:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative max-w-5xl w-full flex-1 flex items-center justify-center min-h-0">
              <Image
                src={`${GALLERY_BASE}/${selectedImage.filename || selectedImage.src}`}
                alt={selectedImage.title || "S&W Foundation project"}
                width={1400}
                height={1000}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain rounded-lg"
                unoptimized
                loader={({ src }) => src}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function GalleryTW() {
  return (
    <>
      <Head>
        <title>Project Gallery | S&W Foundation Work Portfolio | Dallas Foundation Projects</title>
        <meta 
          name="description" 
          content="View S&W Foundation's project gallery showcasing commercial pier drilling and foundation work in Dallas, TX. See our completed projects, equipment in action, and quality craftsmanship." 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="foundation projects gallery, pier drilling photos, commercial construction portfolio, S&W foundation work, dallas construction projects, drilling equipment photos" />
        <meta name="robots" content="index, follow" />
        
        {/* Open Graph */}
        <meta property="og:title" content="Project Gallery | S&W Foundation Work Portfolio" />
        <meta property="og:description" content="View S&W Foundation's project gallery showcasing commercial pier drilling and foundation work in Dallas, TX with quality craftsmanship." />
        <meta property="og:url" content="https://www.swfoundation.com/gallery" />
        <meta property="og:type" content="website" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://www.swfoundation.com/gallery" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <ProjectStats />
        <ProjectCategories />
      </main>
    </>
  );
}

GalleryTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};
