import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { GridPattern } from "@/components/GridPattern";
import { FadeIn } from "@/components/FadeIn";
import Link from 'next/link';
import Head from 'next/head'
import styles from '../styles/Contact.module.css'
import { Inter } from "next/font/google";
import { Oswald } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Lato } from "next/font/google";
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edycymyofrowahspzzpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg'

const supabase = createClient(supabaseUrl, supabaseKey)


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
  )
}
function OfficeContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
      const fetchContacts = async () => {
          let { data, error } = await supabase
              .from('company_contacts')
              .select('*');

          if (error) {
              console.error('Error fetching contacts:', error);
          } else {
              setContacts(data);
          }
          setLoading(false);
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
                <p className={lato.className}>{contact.job_title}<br></br>
                <br></br>{contact.email}<br></br>
                <br></br>{contact.phone}</p>
            </div>
        ))}
    </div>
   </div>
);
}


function Form() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')
  const [company, setCompany] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Submit form data to Supabase table
    const { data, error } = await supabase
      .from('contact_form')
      .upsert({ name, email, number, message, company })

    if (error) {
      console.error(error)
      return
    }

    // Clear form inputs
    setName('')
    setEmail('')
    setNumber('')
    setMessage('')
    setCompany('')
  }

  return (
    <>
    <form onSubmit={handleSubmit} className={styles.form}>
    <h1 className={lato.className}>Contact Us Today!</h1>
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
function JobForm()  {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')
  const [position, setPosition] = useState('')

  const handleSubmit = async (e) => {
      e.preventDefault()

      // Submit form data to Supabase table
      const { data, error } = await supabase
          .from('job_form')
          .upsert({ name, email, number, message, position })

      if (error) {
          console.error(error)
          return
      }

      // Clear form inputs
      setName('')
      setEmail('')
      setNumber('')
      setMessage('')
      setPosition('')
  }
  const jobPositions = [
      'Groundhand/General Laborer',
      'Drill Rig Operator',
      'Crane Operator',
      'CDL Driver',
      'Crane Operator',
      'Mechanic',
      'Welder',
  ]

  return (
      <>
          <form onSubmit={handleSubmit} className={styles.form}>
              <h1 className={lato.className}>Join Our Team</h1>
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

  )
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

export default function Contact({ contacts}) {

  return (
    <>
      <Head>
    <title>Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX</title>
    <meta name="description" content="Reach out to S&W Foundation, the leading specialists in commercial pier drilling across Dallas, TX and the wider US. Let's discuss how our expertise, advanced equipment, and commitment to safety can serve your project." />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="keywords" content="contact, commercial pier drilling, Dallas, TX, S&W Foundation, quote, project consultation, advanced equipment, safety, leading specialists, US"/>
    <meta property="og:title" content="Contact S&W Foundation | Commercial Pier Drilling Specialists in Dallas, TX" />
    <meta property="og:description" content="Looking for top-tier commercial pier drilling services in the US? Get in touch with S&W Foundation today for a comprehensive quote and experience our commitment to excellence." />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://www.swfoundation.com/contact/" />
    <meta property="og:image" content="https://www.swfoundation.com/images/form.png" />
    <meta property='og:site_name' content='S&W Commercial Pier Drilling' />
    <link rel="canonical" href="https://www.swfoundation.com/contact" />
    <link rel="icon" href="/android-chrome-512x512.png" type='image/x-icon'/>
</Head>
      <div className={styles.contact}>
        <section className={styles.hero}>
          <Hero />
        </section>
        <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={10} interactive />
          </div>
        <FadeIn>
        <section className={styles.formSection}>
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
        <div className={styles.spacer}>
          <GridPattern className={styles.gridPattern} yOffset={0} interactive />
          </div>
      </div>  
    </>
  )
}

