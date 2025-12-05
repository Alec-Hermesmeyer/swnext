"use client"
import React, { useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edycymyofrowahspzzpg.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg'

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
        {/* Contact Form */}
        <form onSubmit={handleSubmit} className="min-h-[40vh] w-full max-w-4xl bg-white flex flex-col justify-between items-center overflow-hidden rounded-lg shadow-xl mx-auto" id='contactForm'>
            {/* Form Header */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center py-4">
                Contact Us Today!
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
                        <input
                            className="w-full md:w-[48%] h-12 px-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md"
                            type='text'
                            placeholder='Company Name'
                            id='company'
                            name='company'
                            required
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                        />
                    </div>
                    
                    {/* Form Bottom */}
                    <div className="w-full flex flex-col items-center justify-between space-y-6 flex-grow">
                        <textarea 
                            onChange={(e) => setMessage(e.target.value)} 
                            value={message} 
                            required 
                            id='message' 
                            name='message' 
                            className="w-full min-h-[150px] flex-grow p-4 text-center border-none border-b border-gray-300 bg-white cursor-pointer resize-none focus:outline-none focus:border-blue-600 transition-colors duration-300 shadow-lg shadow-gray-400/50 rounded-md" 
                            placeholder='Tell Us About Your Project'
                        ></textarea>
                        
                        <button 
                            id='contactFormBtn' 
                            className="w-full max-w-xs h-15 px-8 py-3 cursor-pointer text-black rounded-2xl border border-black bg-yellow-200 hover:bg-yellow-300 hover:shadow-lg transition-all duration-300 font-bold text-lg" 
                            type='submit'
                        >
                            Submit
                        </button>
                    </div>
                </div>
            </div>
        </form>
    </>
      
  )
}
export default Form;
