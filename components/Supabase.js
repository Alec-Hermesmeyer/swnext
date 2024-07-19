
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = NEXT_PUBLIC_SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;