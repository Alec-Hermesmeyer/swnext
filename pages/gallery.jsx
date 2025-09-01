import Head from "next/head";
import Image from "next/image";
import TWLayout from "@/components/TWLayout";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

const galleryImages = [
  "gal1.jpeg","gal2.jpeg","gal3.jpeg","gal4.jpeg","gal5.jpeg","gal6.jpeg","gal7.jpeg","gal8.jpeg","gal9.jpeg","gal10.jpeg","gal11.jpeg","gal12.jpeg","gal13.jpeg","gal14.jpeg","gal15.jpeg","gal16.jpeg","gal17.jpeg","gal18.jpeg","gal19.jpeg","gal20.jpeg","gal21.jpeg","gal22.jpeg","gal23.jpeg","gal24.jpeg","gal25.jpeg","gal26.jpeg","gal27.jpeg","gal28.jpeg","gal29.jpeg","gal30.jpeg","gal31.jpeg","gal32.jpeg","gal33.jpeg","gal34.jpeg","gal35.jpeg","gal36.jpeg","gal37.jpeg","gal38.jpeg","gal39.jpeg","gal40.jpeg","gal41.jpeg","gal42.jpeg"
];

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[35vh] md:min-h-[45vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/homeHero.webp')" }} />
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative mx-auto w-full px-0 py-14 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Project Gallery</h1>
      </div>
    </section>
  );
}

export default function GalleryTW() {
  return (
    <>
      <Head>
        <title>Gallery | Tailwind</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <section className="mx-auto w-full max-w-[1300px] px-6 py-10">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {galleryImages.map((file) => (
              <div key={file} className="group relative overflow-hidden rounded-lg bg-neutral-100 shadow">
                <Image
                  src={`/galleryImages/${file}`}
                  alt={file}
                  width={600}
                  height={600}
                  className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105 md:h-44"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                  priority={file === "gal1.jpeg"}
                  unoptimized
                  loader={({ src }) => src}
                />
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

GalleryTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};
