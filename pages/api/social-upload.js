// Special handler for file uploads to Flask backend
import { IncomingForm } from 'formidable';
import { readFile, unlink } from 'fs/promises';

export const config = {
  api: {
    bodyParser: false, // Disable Next.js body parsing for file uploads
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const FLASK_BACKEND = process.env.FLASK_BACKEND || 'http://localhost:5000';
  const SOCIAL_WORKSPACE_TOKEN = process.env.SOCIAL_WORKSPACE_TOKEN || '';
  let file;

  try {
    // Parse the incoming form
    const form = new IncomingForm({
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve([fields, files]);
      });
    });

    // Create a new FormData to send to Flask
    const formData = new FormData();

    // Add file
    file = files.file?.[0] || files.file;
    if (!file?.filepath) {
      return res.status(400).json({ error: 'No file provided to upload proxy' });
    }

    const fileBuffer = await readFile(file.filepath);
    const fileBlob = new Blob([fileBuffer], {
      type: file.mimetype || 'application/octet-stream',
    });
    formData.append('file', fileBlob, file.originalFilename || 'upload');

    // Add other fields
    if (fields.category) {
      formData.append('category', Array.isArray(fields.category) ? fields.category[0] : fields.category);
    }
    if (fields.tags) {
      formData.append('tags', Array.isArray(fields.tags) ? fields.tags[0] : fields.tags);
    }

    // Send to Flask backend
    const headers = {};
    if (SOCIAL_WORKSPACE_TOKEN) {
      headers.Authorization = `Bearer ${SOCIAL_WORKSPACE_TOKEN}`;
    }
    if (req.headers.authorization) {
      headers.Authorization = req.headers.authorization;
    }

    const response = await fetch(`${FLASK_BACKEND}/images/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });

    const data = await response.json();

    res.status(response.status).json(data);
  } catch (error) {
    console.error('Upload proxy error:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message,
    });
  } finally {
    if (file?.filepath) {
      unlink(file.filepath).catch(() => {});
    }
  }
}
