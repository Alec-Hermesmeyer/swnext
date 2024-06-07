import React from 'react'
import styles from '../styles/Admin.module.css';
import { createClient } from "@supabase/supabase-js";
import withAuth from '@/components/withAuth';


const supabaseUrl = "https://edycymyofrowahspzzpg.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkeWN5bXlvZnJvd2Foc3B6enBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzcyNTExMzAsImV4cCI6MTk5MjgyNzEzMH0.vJ8DvHPikZp2wQRXEbQ2h7JNgyJyDs0smEcJYjrjcVg";

const supabase = createClient(supabaseUrl, supabaseKey);

const Admin = () => {
  return (
    <div>admin</div>
  )
}

export default withAuth(Admin)