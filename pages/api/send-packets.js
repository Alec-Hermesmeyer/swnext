import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { sendMail } from "@/lib/mailer";

const PHIL_EMAIL = process.env.PHIL_EMAIL;
const EMAIL_ATTACHMENT_LIMIT_BYTES = 17 * 1024 * 1024;
const EMAIL_MESSAGE_OVERHEAD_BYTES = 512 * 1024;
const EMAIL_ENCODING_OVERHEAD_MULTIPLIER = 1.37;

const estimateEmailAttachmentBytes = (byteLength) =>
  Math.ceil(byteLength * EMAIL_ENCODING_OVERHEAD_MULTIPLIER) + 2048;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { scheduleDate, packets } = req.body;

  if (!scheduleDate || !packets || packets.length === 0) {
    return res.status(400).json({ message: "Missing required fields" });
  }

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

  const buildPacketList = (items) =>
    items
      .map((packet) => {
        const workerLabel = packet.worker_name || "Crew Member";
        const jobLabel = packet.job_name || "Job";
        const jobNumber = packet.job_number ? ` (#${packet.job_number})` : "";
        return `<li><strong>${workerLabel}</strong> — ${jobLabel}${jobNumber}</li>`;
      })
      .join("");

  const buildPacketHtml = ({
    items,
    batchIndex,
    batchCount,
    includeLogAttachment,
    logPdfUrl,
  }) => {
    const packetList = buildPacketList(items);
    const batchLabel =
      batchCount > 1
        ? `<p style="margin:0 0 8px 0;font-weight:700;">Email ${batchIndex + 1} of ${batchCount}</p>`
        : "";
    const logMessage = includeLogAttachment
      ? "The NEW LOG & INSPECTION PDF is attached to this email."
      : `The NEW LOG & INSPECTION PDF is attached to email 1. You can also download it here: <a href="${logPdfUrl}">${logPdfUrl}</a>`;

    return `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:Arial,sans-serif;">
        <div style="padding:14px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
          <strong>Packet includes:</strong> DOCX cover sheets (attached) and the NEW LOG &amp; INSPECTION PDF.
          ${logMessage}
        </div>
        <div style="padding:16px 20px;">
          ${batchLabel}
          <p style="margin:0 0 8px 0;">Crew packets for ${dateStr}:</p>
          <ul style="margin:0;padding-left:18px;">${packetList}</ul>
        </div>
      </body>
      </html>
    `;
  };

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

    const logAttachmentEstimatedBytes = estimateEmailAttachmentBytes(
      fs.statSync(logAttachmentPath).size
    );
    const logPdfUrl = `${
      process.env.NEXT_PUBLIC_SITE_URL || "https://swfoundation.com"
    }/NEW%20LOG%20%26%20INSPECTION.pdf`;

    const packetEntries = packets.map((packet) => {
      const workerLabel = sanitizeFilename(packet.worker_name || "Crew");
      const jobLabel = sanitizeFilename(packet.job_number || packet.job_name || "Job");
      const content = buildCoverSheetDocx(packet);
      return {
        packet,
        attachment: {
          filename: `Cover Sheet - ${workerLabel} - ${jobLabel}.docx`,
          content,
          contentType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
        estimatedBytes: estimateEmailAttachmentBytes(content.length),
      };
    });

    const batches = [];
    let currentBatch = [];
    let currentEstimatedBytes =
      EMAIL_MESSAGE_OVERHEAD_BYTES + logAttachmentEstimatedBytes;

    packetEntries.forEach((entry) => {
      const wouldOverflow =
        currentBatch.length > 0 &&
        currentEstimatedBytes + entry.estimatedBytes > EMAIL_ATTACHMENT_LIMIT_BYTES;

      if (wouldOverflow) {
        batches.push(currentBatch);
        currentBatch = [];
        currentEstimatedBytes = EMAIL_MESSAGE_OVERHEAD_BYTES;
      }

      currentBatch.push(entry);
      currentEstimatedBytes += entry.estimatedBytes;
    });

    if (currentBatch.length > 0) {
      batches.push(currentBatch);
    }

    // Read the PDF once (rather than per-batch) — Resend needs buffer content, not a path
    const logPdfBuffer = fs.readFileSync(logAttachmentPath);

    for (let index = 0; index < batches.length; index += 1) {
      const batch = batches[index];
      const includeLogAttachment = index === 0;
      const html = buildPacketHtml({
        items: batch.map((entry) => entry.packet),
        batchIndex: index,
        batchCount: batches.length,
        includeLogAttachment,
        logPdfUrl,
      });

      await sendMail({
        to: PHIL_EMAIL,
        subject:
          batches.length > 1
            ? `Daily Crew Packets (${index + 1}/${batches.length}) - ${dateStr}`
            : `Daily Crew Packets (${packets.length}) - ${dateStr}`,
        html,
        attachments: [
          ...(includeLogAttachment
            ? [
                {
                  filename: "NEW LOG & INSPECTION.pdf",
                  content: logPdfBuffer,
                  contentType: "application/pdf",
                },
              ]
            : []),
          ...batch.map((entry) => entry.attachment),
        ],
      });
    }

    res.status(200).json({
      message:
        batches.length > 1
          ? `Packets email sent successfully in ${batches.length} emails`
          : "Packets email sent successfully",
    });
  } catch (error) {
    console.error("Error sending packets email:", error);
    res.status(500).json({ message: "Error sending packets email", error: error.message });
  }
}
