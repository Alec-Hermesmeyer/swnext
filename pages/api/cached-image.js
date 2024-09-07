import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { path: imagePath } = req.query;
  const fullPath = path.join(process.cwd(), imagePath);

  if (fs.existsSync(fullPath)) {
    const imageBuffer = fs.readFileSync(fullPath);
    res.setHeader('Content-Type', 'image/jpeg'); // Adjust content type as needed
    res.send(imageBuffer);
  } else {
    res.status(404).send('Image not found');
  }
}