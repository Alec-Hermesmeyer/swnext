
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://edycymyofrowahspzzpg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export default supabase;