"use client"
import React, { useState } from 'react'
import styles from '../styles/Form.module.css'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edycymyofrowahspzzpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg'

const supabase = createClient(supabaseUrl, supabaseKey)


const JobForm = () => {
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
        'Shop Manager',
    ]

    return (
        <>
            <form onSubmit={handleSubmit} className={styles.form} id='jobForm'>
                <h1 className={styles.h1}>Join Our Team</h1>
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
                            <button id='jobFormBtn' className={styles.formSubmit} type='submit'><b>Submit</b></button>
                        </div>
                    </div>
                </div>
            </form>
        </>

    )
}
export default JobForm;
