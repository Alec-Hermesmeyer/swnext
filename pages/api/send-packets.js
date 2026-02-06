import { createTransport } from "nodemailer";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_USER = process.env.MAIL_USER;
const PHIL_EMAIL = process.env.PHIL_EMAIL;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { scheduleDate, packets } = req.body;

  if (!scheduleDate || !packets || packets.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  const dateStr = new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const templatePath = path.join(
    process.cwd(),
    "templates",
    "cover-sheet-template.docx"
  );

  const formatAddress = (packet) =>
    [packet.address, packet.city, packet.zip].filter(Boolean).join(", ");

  const formatContactInfo = (packet) =>
    [packet.hiring_contact_phone, packet.hiring_contact_email]
      .filter(Boolean)
      .join(" • ");

  const buildCoverSheetDocx = (packet) => {
    const template = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(template);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      delimiters: { start: "{{", end: "}}" },
    });

    const data = {
      job_number: packet.job_number || "",
      job_name: packet.job_name || "",
      job_address: formatAddress(packet),
      dig_tess_number: packet.dig_tess_number || "",
      contact_name: packet.hiring_contact_name || packet.customer_name || "",
      contact_info: formatContactInfo(packet),
      worker_name: packet.worker_name || "",
      worker_phone: packet.worker_phone || "",
      equipment_primary: packet.rig_name || "",
      equipment_secondary: packet.crane_info || packet.truck_number || "",
      superintendent_name: packet.superintendent_name || "",
      superintendent_phone: packet.superintendent_phone || "",
      pm_name: packet.pm_name || "",
    };

    doc.setData(data);
    doc.render();
    return doc.getZip().generate({ type: "nodebuffer" });
  };

  const sanitizeFilename = (value) =>
    String(value || "")
      .replace(/\\s+/g, " ")
      .trim()
      .replace(/[^a-zA-Z0-9 _.-]/g, "");

  const packetList = packets
    .map((packet) => {
      const workerLabel = packet.worker_name || "Crew Member";
      const jobLabel = packet.job_name || "Job";
      const jobNumber = packet.job_number ? ` (#${packet.job_number})` : "";
      return `<li><strong>${workerLabel}</strong> — ${jobLabel}${jobNumber}</li>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;">
      <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <strong>Packet includes:</strong> DOCX cover sheets (attached) and the attached NEW LOG &amp; INSPECTION PDF.
        Print one log/inspection per crew member.
      </div>
      <div style="padding:16px 20px;">
        <p style="margin:0 0 8px 0;">Crew packets for ${dateStr}:</p>
        <ul style="margin:0;padding-left:18px;">${packetList}</ul>
      </div>
    </body>
    </html>
  `;

  try {
    if (!PHIL_EMAIL) {
      return res.status(400).json({ message: "PHIL_EMAIL not configured" });
    }

    const logAttachmentPath = path.join(
      process.cwd(),
      "public",
      "NEW LOG & INSPECTION.pdf"
    );
    if (!fs.existsSync(templatePath)) {
      return res.status(500).json({ message: "Cover sheet template not found" });
    }

    const docxAttachments = packets.map((packet) => {
      const workerLabel = sanitizeFilename(packet.worker_name || "Crew");
      const jobLabel = sanitizeFilename(packet.job_number || packet.job_name || "Job");
      return {
        filename: `Cover Sheet - ${workerLabel} - ${jobLabel}.docx`,
        content: buildCoverSheetDocx(packet),
        contentType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      };
    });

    await transporter.sendMail({
      from: EMAIL_USER,
      to: PHIL_EMAIL,
      subject: `Daily Crew Packets (${packets.length}) - ${dateStr}`,
      html,
      attachments: [
        {
          filename: "NEW LOG & INSPECTION.pdf",
          path: logAttachmentPath,
          contentType: "application/pdf",
        },
        ...docxAttachments,
      ],
    });

    res.status(200).json({ message: "Packets email sent successfully" });
  } catch (error) {
    console.error("Error sending packets email:", error);
    res.status(500).json({ message: "Error sending packets email", error: error.message });
  }
}
