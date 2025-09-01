import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import TWLayout from "@/components/TWLayout";
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import { Lato } from "next/font/google";
import { useEffect, useState } from "react";
import supabase from "@/components/Supabase";

const lato = Lato({ weight: ["900", "700", "400"], subsets: ["latin"] });

function Hero() {
  return (
    <section className="relative w-screen -ml-[50vw] -mr-[50vw] left-1/2 right-1/2 text-white min-h-[45vh] md:min-h-[55vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/rig112211.webp?version=1')", backgroundPosition: "bottom" }}
      />
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative mx-auto w-full px-0 py-16 text-center">
        <h1 className={`${lato.className} text-4xl md:text-5xl font-extrabold`}>Contact</h1>
        <div className="mt-6 flex items-center justify-center gap-3">
          <Link href="tel:2147030484" className="inline-flex items-center rounded-md bg-red-600 px-5 py-3 font-bold text-white shadow-md hover:bg-red-700">Give Us A Call</Link>
          <a href="#office-contacts" className="inline-flex items-center rounded-md bg-white/10 px-5 py-3 font-bold text-white ring-1 ring-white/30 hover:bg-white/20">Company Contacts</a>
        </div>
      </div>
    </section>
  );
}

function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from("contact_form").upsert({ name, email, number, message, company });
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "mattm@swfoundation.com, colinw@swfoundation.com",
        subject: "New Form Submission",
        text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nCompany: ${company}\nMessage: ${message}`,
      }),
    });
    setName(""); setEmail(""); setNumber(""); setMessage(""); setCompany("");
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 p-0 shadow-none ring-0">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Your Name</label>
          <input aria-label="Your Name" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Your Email</label>
          <input aria-label="Your Email" type="email" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Contact Number</label>
          <input aria-label="Contact Number" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={number} onChange={(e)=>setNumber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Company Name</label>
          <input aria-label="Company Name" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={company} onChange={(e)=>setCompany(e.target.value)} />
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <label className="text-sm font-semibold text-neutral-700">Project Details</label>
        <textarea aria-label="Project Details" className="w-full rounded-lg border border-neutral-300 bg-white p-3 h-32 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={message} onChange={(e)=>setMessage(e.target.value)} />
      </div>
      <div className="mt-5 flex justify-end">
        <button className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 font-bold text-white shadow hover:bg-red-700">Submit</button>
      </div>
    </form>
  );
}

function CareersForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [number, setNumber] = useState("");
  const [message, setMessage] = useState("");
  const [position, setPosition] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    await supabase.from("job_form").upsert({ name, email, number, message, position });
    await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: "cliffw@swfoundation.com, colinw@swfoundation.com",
        subject: "New Job Application",
        text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nPosition: ${position}\nMessage: ${message}`,
      }),
    });
    setName(""); setEmail(""); setNumber(""); setMessage(""); setPosition("");
  }

  const jobPositions = [
    'Groundhand/General Laborer',
    'Drill Rig Operator',
    'Crane Operator',
    'CDL Driver',
    'Mechanic',
    'Welder',
    'Project Manager Assistant',
    'Production Assistant',
  ];

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white/90 p-0 shadow-none ring-0">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Your Name</label>
          <input aria-label="Your Name" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={name} onChange={(e)=>setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Your Email</label>
          <input aria-label="Your Email" type="email" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={email} onChange={(e)=>setEmail(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Contact Number</label>
          <input aria-label="Contact Number" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={number} onChange={(e)=>setNumber(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-neutral-700">Desired Position</label>
          <select aria-label="Desired Position" className="w-full rounded-lg border border-neutral-300 bg-white px-3 h-11 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={position} onChange={(e)=>setPosition(e.target.value)}>
            <option value='' disabled>Select a Position</option>
            {jobPositions.map((j)=> (<option key={j} value={j}>{j}</option>))}
          </select>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <label className="text-sm font-semibold text-neutral-700">Experience & Notes</label>
        <textarea aria-label="Experience" className="w-full rounded-lg border border-neutral-300 bg-white p-3 h-32 shadow-sm focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-600/40" required value={message} onChange={(e)=>setMessage(e.target.value)} />
      </div>
      <div className="mt-5 flex justify-end">
        <button className="inline-flex h-11 items-center justify-center rounded-lg bg-red-600 px-6 font-bold text-white shadow hover:bg-red-700">Submit</button>
      </div>
    </form>
  );
}

function FeaturedProfiles() {
  const featured = {
    "Luke Wardell": {
      image: "/Luke W Final Headshot.png",
      bio: "As Vice President of Pre-Construction at S&W Foundation Contractors, Inc., Luke Wardell leads the front end of the project lifecycle, overseeing estimating, budgeting, and bid strategy. A graduate of the University of Arkansas, he brings a sharp analytical perspective to cost planning and scope development. Luke’s ability to align client goals with constructible, value-driven solutions has made him a key contributor to the company’s continued growth in both public and private sectors. His proactive approach ensures clarity and confidence before construction ever begins.",
    },
    "Sean Macalik": {
      image: "/Sean M Final Headshot.png",
      bio: "In his role as Vice President of Construction, Sean Macalik directs all on-site operations for S&W Foundation Contractors, managing field teams and coordinating large-scale drilling and foundation efforts. With deep experience in heavy civil construction, Sean is known for driving jobsite efficiency while upholding the highest standards of safety and execution. He takes pride in delivering technically demanding projects under tight timelines and works closely with clients, engineers, and foremen to maintain momentum from start to finish.",
    },
    "Cesar Urrutia": {
      image: "/Cesar U Final Headshot.png",
      bio: "Cesar Urrutia serves as Vice President of Operations at S&W Foundation Contractors, where he oversees staffing, resource allocation, and field readiness across all active projects. With a background rooted in hands-on fieldwork, Cesar ensures every crew is equipped, trained, and prepared to meet the unique demands of each site. He’s instrumental in shaping the company’s operational culture—emphasizing accountability, craftsmanship, and continuous improvement. Cesar’s leadership keeps projects moving seamlessly, from mobilization to closeout.",
    },
  };

  const [contacts, setContacts] = useState([]);
  useEffect(()=>{
    supabase.from('company_contacts').select('*').then(({ data })=> setContacts(data || []));
  },[]);
  const order = ["Luke Wardell","Sean Macalik","Cesar Urrutia"];

  return (
    <section className="mx-auto w-full max-w-[1200px] px-6">
      <div className="space-y-10">
        {order.map((name, idx)=>{
          const c = contacts.find((x)=> x.name === name);
          const f = featured[name];
          if(!f) return null;
          return (
            <div key={name} className="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
              {/* Left: headshot + contact in a light card */}
              <div className="rounded-2xl bg-white/90 p-5 shadow ring-1 ring-neutral-200 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <img src={f.image} alt={`${name} headshot`} className="h-28 w-28 rounded-full border-4 border-[#0b2a5a] object-cover" />
                  <div>
                    <h3 className={`${lato.className} text-2xl font-extrabold text-[#0b2a5a]`}>{name}</h3>
                    {c && (<p className="text-sm font-semibold text-neutral-800">{c.job_title}</p>)}
                    {c && (
                      <p className="mt-1 text-sm text-neutral-700">
                        <Link href={`mailto:${c.email}`} className="font-semibold text-[#0b2a5a] hover:underline">{c.email}</Link>
                        <span className="px-1">•</span>
                        <Link href={`tel:${c.phone}`} className="font-semibold text-[#0b2a5a] hover:underline">{c.phone}</Link>
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Right: bio with accent */}
              <div className="rounded-2xl bg-white/90 text-neutral-900 shadow-2xl ring-1 ring-neutral-200 backdrop-blur-sm">
                <div className="h-1.5 w-full rounded-t-2xl bg-red-600" />
                <div className="p-5">
                  <p className="leading-relaxed">{f.bio}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function OfficeContacts() {
  const [contacts, setContacts] = useState([]);
  useEffect(()=>{
    supabase.from('company_contacts').select('*').then(({ data })=> setContacts(data || []));
  },[]);
  return (
    <section id="office-contacts" className="mx-auto w-full max-w-[1200px] px-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {contacts.map((c)=> (
          <div key={c.id} className="rounded-xl border border-white/10 bg-[#0b2a5a] p-5 text-white shadow ring-1 ring-white/10">
            <h3 className={`${lato.className} text-xl font-extrabold drop-shadow`}>{c.name}</h3>
            <p className={`${lato.className} mt-1 font-semibold drop-shadow`}>{c.job_title}</p>
            <p className="mt-3 text-sm drop-shadow"><Link href={`mailto:${c.email}`} className="underline">{c.email}</Link><br/><Link href={`tel:${c.phone}`} className="underline">{c.phone}</Link></p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ContactTW() {
  return (
    <>
      <Head>
        <title>Contact | Tailwind Version</title>
        <meta name="robots" content="noindex" />
      </Head>
      <main className="relative flex w-full flex-col">
        {/* Global background pattern behind all content */}
        <div className="pointer-events-none fixed inset-0 -z-10">
          <GridPattern className="h-full w-full" yOffset={0} interactive strokeColor="#0b2a5a" strokeOpacity={0.12} />
        </div>
        <Hero />
        <div className="h-8" />
        <FadeIn>
          <section className="mx-auto w-full max-w-[1200px] px-6 py-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-black/10 backdrop-blur-sm">
                <div className="h-1.5 w-full rounded-t-2xl bg-red-600 -mt-6 mb-4" />
                <h2 className={`${lato.className} mb-2 text-2xl font-extrabold text-neutral-900`}>Contact S&W</h2>
                <p className="mb-6 text-sm text-neutral-600">Tell us about your project and we’ll get back to you shortly.</p>
                <ContactForm />
              </div>
              <div className="rounded-2xl bg-white/90 p-6 shadow-2xl ring-1 ring-black/10 backdrop-blur-sm">
                <div className="h-1.5 w-full rounded-t-2xl bg-red-600 -mt-6 mb-4" />
                <h2 className={`${lato.className} mb-2 text-2xl font-extrabold text-neutral-900`}>Careers Application</h2>
                <p className="mb-6 text-sm text-neutral-600">Apply to join our team. We’re always looking for great people.</p>
                <CareersForm />
              </div>
            </div>
          </section>
        </FadeIn>
        <div className="h-8" />
        <FadeIn>
          <FeaturedProfiles />
        </FadeIn>
        <div className="h-8" />
        <FadeIn>
          <OfficeContacts />
        </FadeIn>
        <div className="h-8" />
      </main>
    </>
  );
}

ContactTW.getLayout = function getLayout(page) {
  return <TWLayout>{page}</TWLayout>;
};


