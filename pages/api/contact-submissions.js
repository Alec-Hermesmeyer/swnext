import { createClient } from "@supabase/supabase-js";
import { sendMail, isMailerConfigured } from "@/lib/mailer";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_KEY = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

const INBOUND_SUPABASE_URL =
  process.env.INBOUND_SUPABASE_URL || process.env.TRADESMEN_SUPABASE_URL;
const INBOUND_SUPABASE_SERVICE_ROLE_KEY =
  process.env.INBOUND_SUPABASE_SERVICE_ROLE_KEY ||
  process.env.TRADESMEN_SUPABASE_SERVICE_ROLE_KEY;

const CONTACT_INBOUND_ORG_ID =
  process.env.CONTACT_INBOUND_ORG_ID || "5afc4a5f-164a-4f6e-92b3-f0a7aa490b24";

const DEFAULT_CONTACT_RECIPIENTS = "mattm@swfoundation.com,colinw@swfoundation.com";
const CONTACT_FORM_RECIPIENTS = process.env.CONTACT_FORM_RECIPIENTS || DEFAULT_CONTACT_RECIPIENTS;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function getInboundClient() {
  if (!INBOUND_SUPABASE_URL || !INBOUND_SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(INBOUND_SUPABASE_URL, INBOUND_SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function normalizeEmail(value = "") {
  return String(value || "").trim().toLowerCase();
}

function extractDomain(email = "") {
  const idx = email.lastIndexOf("@");
  if (idx === -1) return "";
  return email.slice(idx + 1).toLowerCase();
}

function parseRecipients(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
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

async function saveInboundMessage({ name, email, number, company, message }) {
  const inbound = getInboundClient();
  if (!inbound) {
    throw new Error(
      "Inbound inbox is not configured (set INBOUND_SUPABASE_URL and INBOUND_SUPABASE_SERVICE_ROLE_KEY)"
    );
  }

  const subject = company.trim()
    ? `Inquiry from ${company.trim()}`
    : "Website contact inquiry";

  const body = [
    company.trim() ? `Company: ${company.trim()}` : null,
    number.trim() ? `Phone: ${number.trim()}` : null,
    "",
    message.trim(),
  ]
    .filter((line) => line !== null)
    .join("\n");

  const { error } = await inbound.from("inbound_messages").insert({
    org_id: CONTACT_INBOUND_ORG_ID,
    from_name: name.trim(),
    from_email: normalizeEmail(email),
    from_phone: number.trim(),
    subject,
    body,
    source: "swfoundation-website",
  });

  if (error) {
    throw new Error(error.message || "Could not save inbound message");
  }
}

async function sendContactNotificationEmail({ name, email, number, company, message }) {
  if (!isMailerConfigured()) {
    console.warn("Contact notification email skipped: RESEND_API_KEY is not configured");
    return;
  }

  const recipients = parseRecipients(CONTACT_FORM_RECIPIENTS);
  if (!recipients.length) return;

  await sendMail({
    to: recipients,
    subject: "New Contact Form Submission",
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
      website = "",
    } = req.body || {};

    if (String(website || "").trim()) {
      return res.status(200).json({ ok: true });
    }

    if (!name.trim() || !email.trim() || !number.trim() || !company.trim() || !message.trim()) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const blocked = await isBlockedSender(email);

    await supabase.from("contact_form").insert({
      name: String(name).trim(),
      email: normalizeEmail(email),
      number: String(number).trim(),
      company: String(company).trim(),
      message: String(message).trim(),
    });

    if (blocked) {
      return res.status(200).json({ ok: true });
    }

    await saveInboundMessage({
      name: String(name).trim(),
      email: normalizeEmail(email),
      number: String(number).trim(),
      company: String(company).trim(),
      message: String(message).trim(),
    });

    await sendContactNotificationEmail({
      name: String(name).trim(),
      email: normalizeEmail(email),
      number: String(number).trim(),
      company: String(company).trim(),
      message: String(message).trim(),
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Contact submission error:", error);
    return res.status(500).json({ error: error.message || "Something went wrong" });
  }
}
