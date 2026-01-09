"use client"
import React, { useEffect, useState } from 'react'
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
    // Anti-bot fields
    const [hpWebsite, setHpWebsite] = useState('')
    const [renderedAt, setRenderedAt] = useState(0)

    useEffect(() => {
        setRenderedAt(Date.now())
    }, [])

    const disposableDomains = new Set([
        'mailinator.com','guerrillamail.com','sharklasers.com','10minutemail.com','yopmail.com','tempmail.com','temp-mail.org','trashmail.com','burnermail.io','fakeinbox.com','getnada.com'
    ])
    const isDisposableEmail = (addr) => {
        const at = addr.lastIndexOf('@')
        if (at === -1) return false
        const domain = addr.slice(at + 1).toLowerCase()
        return disposableDomains.has(domain)
    }
    const looksGibberish = (text) => {
        if (!text) return true
        const stripped = String(text).trim()
        if (stripped.length < 2) return true
        if (/\b[b-df-hj-np-tv-z]{8,}\b/i.test(stripped)) return true
        if (/\b[a-z0-9]{25,}\b/i.test(stripped)) return true
        return false
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Honeypot
        if (hpWebsite && hpWebsite.trim().length > 0) {
            return
        }
        // Time on page >= 2s
        if (renderedAt && Date.now() - renderedAt < 2000) {
            return
        }
        // Per-session cooldown (60s)
        try {
            const last = localStorage.getItem('job_last_submit_ts')
            if (last && Date.now() - parseInt(last, 10) < 60000) {
                return
            }
        } catch {}

        // Validations
        const nameOk = typeof name === 'string' && name.trim().length >= 2 && !looksGibberish(name)
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        const msgOk = typeof message === 'string' && message.trim().length >= 15 && !looksGibberish(message)
        const positionOk = typeof position === 'string' && position.trim().length > 0
        if (!nameOk || !emailOk || !msgOk || !positionOk) {
            return
        }
        if (isDisposableEmail(email)) {
            return
        }

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
        try {
            localStorage.setItem('job_last_submit_ts', String(Date.now()))
        } catch {}
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
        'Assistant Project Manager',
        'Entry Level Office Position',
    ]

    return (
        <>
            {/* Job Application Form */}
            <form onSubmit={handleSubmit} className="min-h-[40vh] w-full max-w-4xl bg-white flex flex-col justify-between items-center overflow-hidden rounded-lg shadow-xl mx-auto" id='jobForm'>
                {/* Form Header */}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center py-4">
                    Join Our Team
                </h1>
                
                {/* Form Container */}
                <div className="h-full w-full p-6">
                    <div className="h-full w-full flex flex-col items-center justify-between space-y-6">
                        
                        {/* Form Top Row */}
                        <div className="w-full flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                            <input
                                className="w-full md:w-[48%] h-12 px-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md"
                                type='text'
                                placeholder='Your Name'
                                id='name'
                                name='name'
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                            <input
                                className="w-full md:w-[48%] h-12 px-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md"
                                type='email'
                                placeholder='Your Email'
                                id='email'
                                name='email'
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        
                        {/* Form Center Row */}
                        <div className="w-full flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
                            <input
                                className="w-full md:w-[48%] h-12 px-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md"
                                type='tel'
                                placeholder='Contact Number'
                                id='number'
                                name='number'
                                required
                                value={number}
                                onChange={(e) => setNumber(e.target.value)}
                            />
                            <select
                                className="w-full md:w-[48%] h-12 px-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md appearance-none"
                                id='position'
                                name='Position'
                                required
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                            >
                                <option value='' disabled className="text-gray-500">Select a Position</option>
                                {jobPositions.map((job, index) => (
                                    <option key={index} value={job} className="text-gray-800">{job}</option>
                                ))}
                            </select>
                        </div>
                        
                        {/* Form Bottom */}
                        <div className="w-full flex flex-col items-center justify-between space-y-6 flex-grow">
                    {/* Honeypot + render timestamp */}
                    <div className="sr-only" aria-hidden="true">
                        <label htmlFor="website">Website</label>
                        <input
                          id="website"
                          name="website"
                          type="text"
                          autoComplete="off"
                          tabIndex={-1}
                          value={hpWebsite}
                          onChange={(e) => setHpWebsite(e.target.value)}
                        />
                        <input
                          id="renderedAt"
                          name="renderedAt"
                          type="hidden"
                          value={renderedAt}
                          readOnly
                        />
                    </div>
                            <textarea 
                                onChange={(e) => setMessage(e.target.value)} 
                                value={message} 
                                required 
                                id='message' 
                                name='message' 
                                className="w-full min-h-[150px] flex-grow p-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer resize-none focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md" 
                                placeholder='Tell Us About Your Experience'
                            ></textarea>
                            
                            <button 
                                id='jobFormBtn' 
                                className="w-full max-w-xs h-15 px-8 py-3 cursor-pointer text-black rounded-2xl border border-black bg-yellow-200 hover:bg-yellow-300 hover:shadow-lg transition-all duration-300 font-bold text-lg" 
                                type='submit'
                            >
                                Submit Application
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </>

    )
}
export default JobForm;
