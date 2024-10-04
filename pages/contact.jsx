
import React, { useState, useEffect } from 'react';
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import Link from 'next/link';
import Head from 'next/head';
import styles from '../styles/Contact.module.css';
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import supabase from "@/components/Supabase";


const inter = Inter({ subsets: ["latin"] });
const oswald = Oswald({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: ["900"], subsets: ["latin"] });

function Hero() {
  return (
    <div className={styles.heroSection}>
      <div className={styles.heroContainer}>
        <div className={styles.heroWrapper}>
          <h1 className={lato.className}>Contact</h1>
          <span>
            <Link className={styles.heroLink} href="tel:2147030484">
              Give Us A Call
            </Link>
            <Link className={styles.heroLink} href='#officeContacts'>
              Company Contacts
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

function Spacer() {
  return (
    <GridPattern />
  );
}

function OfficeContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        let { data, error } = await supabase
          .from('company_contacts')
          .select('*');

        if (error) {
          console.error('Error fetching contacts:', error);
        } else {
          setContacts(data);
        }
      } catch (error) {
        console.error('Unexpected error fetching contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.officeContactsContainer}>
      <div className={styles.grid}>
        {contacts.map((contact, index) => (
          <div className={styles.card} key={index}>
            <h2 className={lato.className}>{contact.name}</h2>
            <p className={lato.className}>{contact.job_title}<br />
              <br /><Link className={styles.email} href={`mailto:${contact.email}`}>{contact.email}</Link> <br />
              <br /><Link className={styles.contactNumber} href={`tel:${contact.phone}`}>{contact.phone}</Link></p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [company, setCompany] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('contact_form')
        .upsert({ name, email, number, message, company });

      if (error) {
        console.error('Error submitting form:', error);
        return;
      }
       // Send form contents via email
       const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'alech@swfoundation.com',
          subject: 'New Form Submission',
          text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nCompany: ${company}\nMessage: ${message}`,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Error sending email:', emailResponse.statusText);
        return;
      }

      // Clear form inputs
      setName('');
      setEmail('');
      setNumber('');
      setMessage('');
      setCompany('');
    } catch (error) {
      console.error('Unexpected error submitting form:', error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={lato.className}>Contact Us Today</h2>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <div className={styles.formTop}>
              <input
                className={styles.formInput}
                type='text'
                placeholder='Your Name'
                id='name'
                name='name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={styles.formInput}
                type='email'
                placeholder='Your Email'
                id='email'
                name='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.formCenter}>
              <input
                className={styles.formInput}
                type='tel'
                placeholder='Contact Number'
                id='number'
                name='number'
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
              <input
                className={styles.formInput}
                type='text'
                placeholder='Company Name'
                id='company'
                name='company'
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>
            <div className={styles.formBottom}>
              <textarea onChange={(e) => setMessage(e.target.value)} value={message} required id='message' name='message' className={styles.contactMessage} placeholder='Tell Us About Your Project'></textarea>
              <button className={styles.formSubmit} type='submit'><b>Submit</b></button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

function JobForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [number, setNumber] = useState('');
  const [message, setMessage] = useState('');
  const [position, setPosition] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase
        .from('job_form')
        .upsert({ name, email, number, message, position });

      if (error) {
        console.error('Error submitting job form:', error);
        return;
      }

      // Send form contents via email
      const emailResponse = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'alech@swfoundation.com',
          subject: 'New Job Application',
          text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nPosition: ${position}\nMessage: ${message}`,
        }),
      });

      if (!emailResponse.ok) {
        console.error('Error sending email:', emailResponse.statusText);
        return;
      }

      // Clear form inputs
      setName('');
      setEmail('');
      setNumber('');
      setMessage('');
      setPosition('');
    } catch (error) {
      console.error('Unexpected error submitting job form:', error);
    }
  };

  const jobPositions = [
    'Groundhand/General Laborer',
    'Drill Rig Operator',
    'Crane Operator',
    'CDL Driver',
    'Crane Operator',
    'Mechanic',
    'Welder',
    'Project Manager Assistant',
    'Production Assistant',
  ];

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h2 className={lato.className}>Join Our Team</h2>
        <div className={styles.formContainer}>
          <div className={styles.formWrapper}>
            <div className={styles.formTop}>
              <input
                className={styles.formInput}
                type='text'
                placeholder='Your Name'
                id='name'
                name='name'
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className={styles.formInput}
                type='email'
                placeholder='Your Email'
                id='email'
                name='email'
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className={styles.formCenter}>
              <input
                className={styles.formInput}
                type='tel'
                placeholder='Contact Number'
                id='number'
                name='number'
                required
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
              <select
                className={styles.formInput}
                type='text'
                placeholder='Desired Job Title'
                id='position'
                name='Position'
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              >
                <option value='' disabled>Select a Position</option>
                {jobPositions.map((job, index) => (
                  <option key={index} value={job}>{job}</option>
                ))}
              </select>
            </div>
            <div className={styles.formBottom}>
              <textarea onChange={(e) => setMessage(e.target.value)} value={message} required id='message' name='message' className={styles.contactMessage} placeholder='Tell Us About Your Experience'></textarea>
              <button className={styles.formSubmit} type='submit'><b>Submit</b></button>
            </div>
          </div>
        </div>
      </form>
    </>
  );
}

function FormSection() {
  return (
    <div className={styles.formSectionContainer}>
      <div className={styles.formSectionWrapper}>
        <div className={styles.formLeft}>
          <Form />
        </div>
        <div className={styles.formRight}>
          <JobForm />
        </div>
      </div>
    </div>
  );
}

export default function Contact() {
  return (
    <>
      <Head>
        <title>Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX</title>
        <meta name="description" content="Reach out to S&W Foundation, the leading specialists in commercial pier drilling across Dallas, TX and the wider US. Let's discuss how our expertise, advanced equipment, and commitment to safety can serve your project." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="contact, commercial pier drilling, Dallas, TX, S&W Foundation, quote, project consultation, advanced equipment, safety, leading specialists, US" />
        <meta property="og:title" content="Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX" />
        <meta property="og:description" content="Looking for top-tier commercial pier drilling services in the US? Get in touch with S&W Foundation today for a comprehensive quote and experience our commitment to excellence." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.swfoundation.com/contact" />
        <meta property="og:image" content="https://edycymyofrowahspzzpg.supabase.co/storage/v1/object/public/Images/public/newimages/AFDB03DE-805D-45B2-9A37-1EAFA841A828.webp" />
        <meta property='og:site_name' content='S&W Commercial Pier Drilling' />
        <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon' />
        <link rel="canonical" href="https://www.swfoundation.com/contact" />
      </Head>
      <div className={styles.contact}>
        <section className={styles.hero}>
          <Hero />
        </section>
        <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={10} interactive />
        </div>
        <FadeIn>
          <section className={styles.formSection} id='jobForm'>
            <FormSection />
          </section>
        </FadeIn>
        <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={0} interactive />
        </div>
        <FadeIn>
          <section id='officeContacts' className={styles.officeContacts}>
            <OfficeContacts />
          </section>
        </FadeIn>
        <div className={styles.spacer} id='spacer2'>
          <GridPattern className={styles.gridPattern} yOffset={0} interactive />
        </div>
      </div>
    </>
  );
}


