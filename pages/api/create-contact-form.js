import { sql } from '@vercel/postgres';
import pg from 'pg';
// import { NextResponse } from 'next/server';


export default async function handler(request, response) {
    // Connect to the database
    const client = new pg.Client({
      connectionString: process.env.POSTGRES_3_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    try {
      // Attempt to create the table
      const result =
      await sql`
        CREATE TABLE IF NOT EXISTS Contact_Forms (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      // If successful, send a success response
      response.status(200).json({ message: 'Contact form table created successfully.', result });
    } catch (error) {
        // If there's an error, send an error response
        response.status(500).json({ error: error.message });
    }
  
}
