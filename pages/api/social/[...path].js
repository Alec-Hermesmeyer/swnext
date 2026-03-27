// Proxy API requests to Flask backend to avoid CORS issues
export default async function handler(req, res) {
  const FLASK_BACKEND = process.env.FLASK_BACKEND || 'http://localhost:5000';
  const SOCIAL_WORKSPACE_TOKEN = process.env.SOCIAL_WORKSPACE_TOKEN || '';

  // Get the path from the catch-all route
  const { path } = req.query;
  const targetPath = Array.isArray(path) ? path.join('/') : path;
  const targetUrl = `${FLASK_BACKEND}/${targetPath}`;

  // Build query string if present (exclude the 'path' param we added)
  const url = new URL(req.url, 'http://localhost');
  url.searchParams.delete('path');
  const queryString = url.searchParams.toString() ? `?${url.searchParams.toString()}` : '';

  const fullUrl = `${targetUrl}${queryString}`;

  console.log(`[Proxy] ${req.method} ${fullUrl}`);

  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    // Forward workspace auth token to Flask backend
    if (SOCIAL_WORKSPACE_TOKEN) {
      headers['Authorization'] = `Bearer ${SOCIAL_WORKSPACE_TOKEN}`;
    }

    // Also forward any Authorization header from the client
    if (req.headers.authorization) {
      headers['Authorization'] = req.headers.authorization;
    }

    const fetchOptions = {
      method: req.method,
      headers,
    };

    // Forward body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      if (req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
        console.log(`[Proxy] Body:`, req.body);
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    fetchOptions.signal = controller.signal;

    const response = await fetch(fullUrl, fetchOptions);
    clearTimeout(timeout);

    // Get response data
    const contentType = response.headers.get('content-type');
    let data;

    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Log non-200 responses for debugging
    if (!response.ok) {
      console.log(`[Proxy] Flask returned ${response.status}:`, data);
    }

    // Forward status and response
    res.status(response.status);

    if (typeof data === 'object') {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('[Proxy] Connection error:', error.message);
    res.status(502).json({
      error: 'Failed to connect to backend',
      message: error.message,
      target: fullUrl
    });
  }
}

// Disable body parsing for file uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
