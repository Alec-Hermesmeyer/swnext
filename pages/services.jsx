import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { FadeIn, FadeInStagger } from "@/components/FadeIn";
import { Lato } from "next/font/google";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[40vh] md:min-h-[50vh] flex items-center">
      <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/newimages/IMG_7517.webp')`, backgroundPosition: "bottom" }} />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Commercial Pier Drilling Services</h1>
      </div>
    </section>
  );
}

function ServiceCard({ title, text, img, imageRight = true, href }) {
  return (
    <FadeIn>
      <div className="py-8 md:py-12">
        <div className="mx-auto w-full md:w-[min(100%,1600px)]">
          <div className="relative overflow-hidden rounded-2xl bg-[#0b2a5a] text-white shadow-2xl ring-1 ring-black/10">
            <div className="absolute left-0 top-0 h-2 md:h-3 w-full bg-red-600" />
            <div className={`grid grid-cols-1 items-center gap-6 p-6 md:p-12 md:grid-cols-2 ${imageRight ? '' : 'md:[&>div:first-child]:order-2'}`}>
              <div>
                <h2 className={`${lato.className} mb-4 text-center text-3xl font-extrabold md:text-left`}>{title}</h2>
                <p className={`${lato.className} mx-auto max-w-3xl text-center text-white/90 md:text-left leading-relaxed md:text-[1.02rem]`}>{text}</p>
                {href && (
                  <div className="mt-6">
                    <Link href={href} className="inline-flex items-center rounded-md bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Learn More</Link>
                  </div>
                )}
              </div>
              <div className={`flex items-center ${imageRight ? 'justify-end' : 'justify-start'}`}>
                <div className={`relative aspect-[4/3] w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 ${imageRight ? 'md:-mr-8' : 'md:-ml-8'}`}>
                  <Image src={img} alt={title} fill sizes="(min-width: 768px) 600px, 90vw" className="object-cover" unoptimized loader={({src})=>src} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

function ContactCTA() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[50vh] md:min-h-[55vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.63), rgba(0,0,0,0.13)),url(https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/IMG_7753.webp)`,
          backgroundPosition: "bottom"
        }}
      />
      <div className="relative mx-auto w-full px-0 py-20 text-center">
        <h2 className={`${lato.className} mx-auto max-w-5xl text-3xl font-extrabold md:text-5xl`}>
          Get Your Free Quote Today and Let S&W Take Your Next Project To New Depths
        </h2>
        <div className="mt-6">
          <Link href="/tw/contact" className="inline-flex items-center rounded-md bg-red-600 px-8 py-4 text-xl font-black text-white shadow-xl hover:bg-red-700">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}

export default function ServicesTW() {
  return (
    <>
      <Head>
        <title>Services | Tailwind Version</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="flex w-full flex-col">
        <Hero />
        <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 bg-white">
          <div className="relative mx-auto w-full max-w-[1600px] px-6 md:px-10">
            <FadeInStagger>
              <ServiceCard
                title="Pier Drilling"
                text="Commercial and industrial deep foundation drilling, delivered safely and on schedule."
                img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/preperation.webp`}
                imageRight
                href="/tw/pier-drilling"
              />
              <ServiceCard
                title="Limited-Access Pier Drilling"
                text="Tight sites. Low overhead. We bring the gear and expertise to get it done."
                img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/prat1e.webp`}
                imageRight={false}
                href="/tw/limited-access"
              />
              <ServiceCard
                title="Turn-Key Drilling Solutions"
                text="From estimating to closeout—we own the scope and deliver results."
                img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/indacut.webp`}
                imageRight
                href="/tw/turn-key"
              />
              <ServiceCard
                title="Crane Services"
                text="Modern fleet with experienced operators to keep your job moving."
                img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/home.webp`}
                imageRight={false}
                href="/tw/crane"
              />
              <ServiceCard
                title="Helical Piles"
                text="Efficient, reliable helical pile systems engineered for longevity."
                img={`https://${process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID}.supabase.co/storage/v1/object/public/Images/public/Pratt3.webp`}
                imageRight
                href="/tw/helical-piles"
              />
            </FadeInStagger>
          </div>
        </section>
        <ContactCTA />
      </main>
    </>
  );
}

ServicesTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


