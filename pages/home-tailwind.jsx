import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[70vh] md:min-h-[80vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/homeHero.webp')" }}
      />
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative mx-auto w-full px-0 py-28 md:py-40">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <FadeIn>
              <div className="space-y-3 pl-6 md:pl-10">
                <p className={`${lato.className} text-sm tracking-wide`}>Commercial Pier Drilling - Dallas, Texas</p>
                <h1 className={`${lato.className} text-3xl md:text-5xl font-extrabold`}>
                  S&W Foundation Contractors
                </h1>
                <p className={`${lato.className} italic text-neutral-200`}>Drilling Beyond Limits</p>
                <div className="pt-2">
                  <Link href="/services" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow-md hover:bg-red-700">
                    Our Services
                  </Link>
                </div>
              </div>
            </FadeIn>
            {/* Info card moved to the left side under the hero copy */}
            <div className="mt-8 pl-6 md:pl-10">
              <div className="w-full max-w-md rounded-2xl shadow-2xl ring-1 ring-black/10">
                <div className="h-3 rounded-t-2xl bg-red-600" />
                <div className="rounded-b-2xl bg-[#0b2a5a] p-8 md:p-9">
                  <h3 className={`${lato.className} mb-5 text-lg font-black text-white`}>We Provide Nation-Wide Service</h3>
                  <ul className="space-y-2 text-sm text-neutral-200">
                    <li>
                      Call: <Link href="tel:+12147030484" className="font-semibold text-white hover:text-red-400">(214)-703-0484</Link>
                    </li>
                    <li>Address: 2806 Singleton St. Rowlett, TX 75088</li>
                  </ul>
                  <div className="mt-7 flex gap-3">
                    <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700">Contact Us</Link>
                    <Link href="/careers" className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700">Careers</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div />
        </div>
      </div>
    </section>
  );
}

function InfoBlocks() {
  const blocks = [
    {
      title: "Foundation Contracting Excellence Since 1986",
      text:
        "Based in Rowlett, Texas, S&W Foundation Contractors has been delivering reliable and high-quality pier drilling services for over three decades. Our foundation is rooted in family values, commitment to safety, and innovative technology, which have allowed us to become a nationally recognized name in the foundation construction industry.",
      bullets: [
        "Commercial and industrial foundation projects",
        "Advanced equipment and expert team",
        "Commitment to safety and integrity",
      ],
      img: "/Images/public/IMG_8061.webp",
      bar: "red",
      imageRight: true,
    },
    {
      title: "Nationwide Pier Drilling and Foundation Services",
      text:
        "S&W Foundation Contractors proudly serves Dallas, Texas, and extends our high-quality pier drilling and foundation services nationwide. With years of experience in diverse terrains and challenging environments, our team is equipped to provide region-specific solutions for various projects.",
      bullets: [
        "Specialized pier drilling for commercial projects",
        "Expertise in diverse terrains and soils",
        "Reliable results for projects nationwide",
      ],
      img: "/Images/public/IMG_7620.webp",
      bar: "#0b2a5a",
      imageRight: false,
    },
    {
      title: "Comprehensive Foundation Solutions for Dallas and Beyond",
      text:
        "Our services include not only pier drilling but also soil testing, deep foundation drilling, and site analysis, tailored to meet the specific needs of commercial, industrial, and residential projects. Our commitment to innovation ensures we provide the best foundation solutions.",
      bullets: [
        "Full-service foundation solutions",
        "Customized drilling based on geotechnical needs",
        "Innovative technology for quality assurance",
      ],
      img: "/Images/public/IMG_7653.webp",
      bar: "red",
      imageRight: true,
    },
  ];

  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white">
      <div className="mx-auto w-full px-0">
        <FadeInStagger>
          {blocks.map((b, i) => (
            <FadeIn key={b.title}>
              <div className="py-8 md:py-12">
                <div className="group relative mx-auto w-full md:w-[min(100%,1600px)] overflow-hidden rounded-xl bg-white shadow ring-1 ring-neutral-200 transition duration-300 hover:shadow-lg hover:ring-neutral-300">
                  <div className="absolute left-0 top-0 h-3 w-full overflow-hidden">
                    <div className="absolute inset-0 opacity-40" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                    <div className="absolute inset-0 origin-left scale-x-0 transition-transform duration-700 ease-out group-hover:scale-x-100" style={{background: `linear-gradient(to right, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 0%, ${b.bar==='red'?'#dc2626':'#0b2a5a'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 50%, ${b.bar==='red'?'#0b2a5a':'#dc2626'} 100%)`}} />
                  </div>
                  <div className={`grid grid-cols-1 items-center gap-8 p-6 md:p-12 md:grid-cols-2 ${b.imageRight ? "" : "md:[&>div:first-child]:order-2"}`}>
                    <div>
                      <h2 className={`${lato.className} mb-3 text-center text-3xl font-extrabold text-neutral-900 md:text-left`}>{b.title}</h2>
                      <p className={`${lato.className} mx-auto max-w-3xl text-center text-neutral-700 md:text-left`}>{b.text}</p>
                      <ul className={`${lato.className} mx-auto mt-5 max-w-2xl list-disc space-y-2 pl-5 text-neutral-900 md:mx-0`}>
                        {b.bullets.map((li) => (<li key={li} className="font-semibold">{li}</li>))}
                      </ul>
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="relative aspect-[4/3] w-full max-w-xl rounded-md overflow-hidden transition duration-500 ease-out will-change-transform group-hover:scale-[1.03]">
                        <Image src={b.img} alt={b.title} fill sizes="(min-width: 768px) 600px, 90vw" className="object-contain" priority />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </FadeInStagger>
      </div>
    </section>
  );
}

function Services() {
  const cards = [
    { t: "Pier Drilling", href: "/pier-drilling", img: "/galleryImages/gal9.jpeg" },
    { t: "Core Values", href: "/core-values", img: "/galleryImages/gal31.jpeg" },
    { t: "Turn-Key Drilling Solutions", href: "/turn-key", img: "/galleryImages/gal22.jpeg" },
  ];
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 py-16 md:py-24 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]">
      {/* Smooth red→white→blue gradient background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-red-700 via-white to-[#0b2a5a]" />
      <div className="absolute inset-0 z-0 opacity-60 pointer-events-none">
        <GridPattern
          yOffset={0}
          interactive
          className="h-full w-full"
          strokeColor="#ffffff"
          strokeWidth={1.5}
          strokeOpacity={0.8}
        />
      </div>
      <div className="mx-auto w-full max-w-[1600px] px-6 md:px-10">
        <FadeInStagger>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {cards.map((c) => (
              <FadeIn key={c.t}>
                <div className="group relative h-96 md:h-[26rem] overflow-hidden rounded-xl ring-1 ring-white/20 shadow-lg transition duration-300 ease-out will-change-transform transform-gpu hover:-translate-y-1 hover:shadow-2xl hover:ring-white/30">
                  <Image src={c.img} alt={c.t} fill sizes="(min-width: 768px) 33vw, 100vw" className="object-cover" unoptimized loader={({ src }) => src} />
                  <div className="absolute inset-0 bg-gradient-to-r from-red-800/60 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-70" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                    <h3 className="text-2xl font-extrabold text-white drop-shadow-sm md:text-3xl">{c.t}</h3>
                    <Link href={c.href} className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 font-bold text-white drop-shadow hover:bg-red-700">Learn More</Link>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </FadeInStagger>
      </div>
    </section>
  );
}

function ContactCTA() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[55vh] md:min-h-[60vh] flex items-center">
      <div className="absolute inset-0">
        <Image src="/galleryImages/gal28.jpeg" alt="cta" fill className="object-cover" unoptimized loader={({ src }) => src} />
      </div>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mx-auto w-full px-0 py-24 text-center">
        <h2 className={`${lato.className} mx-auto max-w-5xl text-3xl font-extrabold md:text-5xl`}>
          Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths
        </h2>
        <div className="mt-6">
          <Link href="/contact" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-xl font-black text-white shadow-xl hover:bg-red-700">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}

export default function HomeTailwindPage() {
  return (
    <>
      <Head>
        <title>S&W Foundation | Tailwind Preview</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <InfoBlocks />
        <Services />
        <ContactCTA />
      </main>
    </>
  );
}


