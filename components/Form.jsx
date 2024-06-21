"use client"
import React, { useState } from 'react'
import styles from '../styles/Form.module.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY


const supabase = createClient(supabaseUrl, supabaseKey)


const Form = () => {
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
    <form onSubmit={handleSubmit} className={styles.form} id='contactForm'>
    <h1 className={styles.h1}>Contact Us Today!</h1>
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
            <button id='contactFormBtn' className={styles.formSubmit} type='submit'><b>Submit</b></button>
            </div>
          </div>
        </div>
      </form>
      </>
      
  )
}
export default Form;
