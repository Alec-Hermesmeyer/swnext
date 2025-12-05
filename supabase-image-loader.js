// Extract project ID from NEXT_PUBLIC_SUPABASE_URL or use hardcoded value
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edycymyofrowahspzzpg.supabase.co';
const projectId = supabaseUrl ? supabaseUrl.split('.')[0].replace('https://', '') : 'edycymyofrowahspzzpg';

export default function supabaseLoader({ src, width, quality }) {
  // Handle both relative and absolute paths
  if (src.startsWith('http')) {
    return src; // Return absolute URLs as-is
  }
  return `https://${projectId}.supabase.co/storage/v1/object/public/${src}?w=${width}&q=${quality || 75}`;
}