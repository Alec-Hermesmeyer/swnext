// import { sql } from '@vercel/postgres';
// import pg from 'pg';

// // This is an API route that creates a table in the database


// export default async function handler(request, response) {
//     // Connect to the database
//     const client = new pg.Client({
//       connectionString: process.env.POSTGRES_3_URL,
//       ssl: {
//         rejectUnauthorized: false
//       }
//     });
//     try {
//       // Attempt to create the table
//       const result =
//       await sql`
//         CREATE TABLE IF NOT EXISTS Contact_Forms (
//           id SERIAL PRIMARY KEY,
//           name VARCHAR(255) NOT NULL,
//           email VARCHAR(255) NOT NULL,
//           message TEXT NOT NULL,
//           submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         );
//       `;
//       // If successful, send a success response
//       response.status(200).json({ message: 'Contact form table created successfully.', result });
//     } catch (error) {
//         // If there's an error, send an error response
//         response.status(500).json({ error: error.message });
//     }
  
// }
// import { sql } from '@vercel/postgres';
// import pg from 'pg';

/**
 * API route that creates a table in a PostgreSQL database.
 * @param {object} request - The request object containing information about the incoming request.
 * @param {object} response - The response object used to send a response to the client.
 */
export default async function handler(request, response) {
  try {
    // Connect to the database
    const client = new pg.Client({
      connectionString: process.env.POSTGRES_3_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    await client.connect();

    // Attempt to create the table
    const result = await client.query(`
      CREATE TABLE IF NOT EXISTS Contact_Forms (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Send a success response
    response.status(200).json({ message: 'Contact form table created successfully.', result });
  } catch (error) {
    // Send an error response
    response.status(500).json({ error: error.message });
  }
}
