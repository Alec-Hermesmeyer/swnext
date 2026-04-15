import { createClient } from "@supabase/supabase-js";
import { sendMail, isMailerConfigured } from "@/lib/mailer";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const DEFAULT_RECIPIENTS = "mattm@swfoundation.com,colinw@swfoundation.com";
const CONTACT_RECIPIENTS = process.env.CONTACT_FORM_RECIPIENTS || DEFAULT_RECIPIENTS;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function extractDomain(email = "") {
  const idx = email.lastIndexOf("@");
  if (idx === -1) return "";
  return email.slice(idx + 1).toLowerCase();
}

async function isBlockedSender(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return false;

  const senderDomain = extractDomain(normalizedEmail);
  if (!senderDomain) return false;

  const { data, error } = await supabase
    .from("spam_blocklist")
    .select("rule_type, rule_value, is_active")
    .eq("is_active", true);

  // If the table does not exist or errors, fail open so contact form keeps working.
  if (error || !Array.isArray(data)) return false;

  return data.some((rule) => {
    const type = String(rule.rule_type || "").toLowerCase();
    const value = String(rule.rule_value || "").trim().toLowerCase();
    if (!value) return false;
    if (type === "email") return value === normalizedEmail;
    if (type === "domain") return value === senderDomain;
    return false;
  });
}

async function sendContactEmail({ name, email, number, company, message }) {
  if (!isMailerConfigured()) return;

  const recipients = CONTACT_RECIPIENTS.split(",").map((e) => e.trim()).filter(Boolean);

  await sendMail({
    to: recipients,
    subject: "New Form Submission",
    text: `Name: ${name}\nEmail: ${email}\nNumber: ${number}\nCompany: ${company}\nMessage: ${message}`,
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
      company = "",
      message = "",
    } = req.body || {};

    if (!name.trim() || !email.trim() || !number.trim() || !company.trim() || !message.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blocked = await isBlockedSender(email);

    // Keep writing to the submissions table so admins can still audit attempts.
    await supabase.from("contact_form").insert({
      name: String(name).trim(),
      email: normalizeEmail(email),
      number: String(number).trim(),
      company: String(company).trim(),
      message: String(message).trim(),
    });

    // Silent success for blocked senders (prevents tipping off spammers).
    if (blocked) {
      return res.status(200).json({ ok: true });
    }

    await sendContactEmail({ name, email, number, company, message });
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({ error: "Something went wrong" });
  }
}
