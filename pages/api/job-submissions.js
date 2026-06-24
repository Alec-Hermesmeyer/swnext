import { createClient } from "@supabase/supabase-js";
import { sendMail, isMailerConfigured } from "@/lib/mailer";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const DEFAULT_RECIPIENTS = "cliffw@swfoundation.com,colinw@swfoundation.com";
const JOB_RECIPIENTS = process.env.JOB_FORM_RECIPIENTS || DEFAULT_RECIPIENTS;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

async function sendJobApplicationEmail({ name, email, number, position, message }) {
  if (!isMailerConfigured()) return;

  const recipients = parseRecipients(JOB_RECIPIENTS);
  if (!recipients.length) return;

  await sendMail({
    to: recipients,
    subject: "New Job Application",
    text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nPosition: ${position}\nMessage: ${message}`,
    replyTo: email,
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return res.status(500).json({ error: "Supabase is not configured" });
    }

    const {
      name = "",
      email = "",
      number = "",
      position = "",
      message = "",
      website = "",
    } = req.body || {};

    if (String(website || "").trim()) {
      return res.status(200).json({ ok: true });
    }

    if (!name.trim() || !email.trim() || !number.trim() || !position.trim() || !message.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    await supabase.from("job_form").insert({
      name: String(name).trim(),
      email: normalizeEmail(email),
      number: String(number).trim(),
      position: String(position).trim(),
      message: String(message).trim(),
    });

    await sendJobApplicationEmail({ name, email, number, position, message });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Job submission error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
