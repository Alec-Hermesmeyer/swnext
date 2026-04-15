/**
 * Shared Resend-based mailer.
 *
 * Env vars:
 *   RESEND_API_KEY       — required
 *   RESEND_FROM          — sender address (e.g. "S&W Admin <admin@swfoundation.com>")
 *   RESEND_REPLY_TO      — optional, reply-to address
 *
 * Usage:
 *   import { sendMail } from "@/lib/mailer";
 *   await sendMail({ to, subject, html, text, attachments });
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM =
  process.env.RESEND_FROM ||
  process.env.MAIL_USER ||
  "S&W Admin <no-reply@swfoundationcontractors.com>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "";

let _client = null;
function client() {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is not configured");
  }
  if (!_client) _client = new Resend(RESEND_API_KEY);
  return _client;
}

/**
 * Send an email via Resend.
 *
 * @param {object} options
 * @param {string | string[]} options.to          — recipient(s)
 * @param {string} options.subject                 — subject line
 * @param {string} [options.html]                  — HTML body
 * @param {string} [options.text]                  — plain-text body
 * @param {string} [options.from]                  — override default sender
 * @param {string | string[]} [options.cc]         — cc recipients
 * @param {string | string[]} [options.bcc]        — bcc recipients
 * @param {string} [options.replyTo]               — reply-to address
 * @param {Array<{filename: string, content: Buffer | string, contentType?: string}>} [options.attachments]
 * @returns {Promise<{ id: string }>}              — Resend message id
 */
export async function sendMail({
  to,
  subject,
  html,
  text,
  from,
  cc,
  bcc,
  replyTo,
  attachments,
}) {
  if (!to) throw new Error("sendMail: 'to' is required");
  if (!subject) throw new Error("sendMail: 'subject' is required");
  if (!html && !text) throw new Error("sendMail: 'html' or 'text' is required");

  const payload = {
    from: from || RESEND_FROM,
    to: Array.isArray(to) ? to : [to],
    subject,
  };

  if (html) payload.html = html;
  if (text) payload.text = text;
  if (cc) payload.cc = Array.isArray(cc) ? cc : [cc];
  if (bcc) payload.bcc = Array.isArray(bcc) ? bcc : [bcc];

  const finalReplyTo = replyTo || RESEND_REPLY_TO;
  if (finalReplyTo) payload.replyTo = finalReplyTo;

  if (attachments && attachments.length) {
    payload.attachments = attachments.map((att) => ({
      filename: att.filename,
      content: Buffer.isBuffer(att.content)
        ? att.content.toString("base64")
        : typeof att.content === "string"
        ? Buffer.from(att.content).toString("base64")
        : att.content,
      ...(att.contentType ? { contentType: att.contentType } : {}),
    }));
  }

  const { data, error } = await client().emails.send(payload);
  if (error) {
    const message = error?.message || error?.name || "Resend returned an error";
    throw new Error(`Resend send failed: ${message}`);
  }
  return { id: data?.id || "" };
}

export function isMailerConfigured() {
  return Boolean(RESEND_API_KEY);
}
