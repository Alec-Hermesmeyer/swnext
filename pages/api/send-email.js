import { sendMail } from "@/lib/mailer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { to, subject, text } = req.body || {};

  if (!to || !subject || !text) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    await sendMail({ to, subject, text });
    res.status(200).json({ message: "Email sent successfully" });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({ message: "Error sending email", error: error.message });
  }
}
