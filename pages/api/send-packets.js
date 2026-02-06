import { createTransport } from "nodemailer";

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

  // Build one cover sheet per job with page breaks for printing
  const coverSheets = packets
    .map(
      (packet, i) => `
      <div style="${i > 0 ? "page-break-before:always;" : ""}padding:20px;font-family:Arial,sans-serif;font-size:12px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding-bottom:16px;">
              <h2 style="margin:0;color:#0b2a5a;font-size:18px;">S&W Foundation - Cover Sheet</h2>
              <p style="margin:4px 0 0;color:#6b7280;font-size:14px;">${dateStr}</p>
            </td>
            <td style="text-align:right;vertical-align:top;">
              <div style="border:1px solid #000;padding:8px;width:80px;height:50px;text-align:center;font-size:10px;">PM Stamp</div>
            </td>
          </tr>
        </table>

        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-top:12px;border:1px solid #d1d5db;">
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;font-weight:bold;width:140px;">Job Name</td>
            <td style="border:1px solid #d1d5db;">${packet.job_name || ""}</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;width:80px;">Job #</td>
            <td style="border:1px solid #d1d5db;">${packet.job_number || ""}</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Customer</td>
            <td style="border:1px solid #d1d5db;">${packet.customer_name || ""}</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Dig Tess #</td>
            <td style="border:1px solid #d1d5db;">${packet.dig_tess_number || ""}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;font-weight:bold;">Rig</td>
            <td style="border:1px solid #d1d5db;">${packet.rig_name || ""}</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Superintendent</td>
            <td style="border:1px solid #d1d5db;">${packet.superintendent_name || ""}</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Truck #</td>
            <td style="border:1px solid #d1d5db;">${packet.truck_number || ""}</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Crane</td>
            <td style="border:1px solid #d1d5db;">${packet.crane_info || (packet.crane_required ? "Yes" : "")}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;font-weight:bold;">S&W PM</td>
            <td colspan="3" style="border:1px solid #d1d5db;">${packet.pm_name || ""}${packet.pm_phone ? " - " + packet.pm_phone : ""}</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Crew Onsite</td>
            <td colspan="3" style="border:1px solid #d1d5db;">${packet.crew_names || ""}</td>
          </tr>
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;font-weight:bold;">Address</td>
            <td colspan="3" style="border:1px solid #d1d5db;">${[packet.address, packet.city, packet.zip].filter(Boolean).join(", ")}</td>
          </tr>
        </table>

        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;margin-top:16px;border:1px solid #d1d5db;">
          <tr style="background:#f9fafb;">
            <td style="border:1px solid #d1d5db;font-weight:bold;width:140px;">Work Start</td>
            <td style="border:1px solid #d1d5db;">&nbsp;</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;width:140px;">Lunch Start</td>
            <td style="border:1px solid #d1d5db;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Lunch End</td>
            <td style="border:1px solid #d1d5db;">&nbsp;</td>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Work End</td>
            <td style="border:1px solid #d1d5db;">&nbsp;</td>
          </tr>
        </table>

        <h3 style="margin:16px 0 8px;font-size:13px;border-bottom:1px solid #000;padding-bottom:4px;">Safety</h3>
        <table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #d1d5db;">
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;width:140px;">Injuries</td>
            <td style="border:1px solid #d1d5db;">&nbsp;</td>
          </tr>
          <tr>
            <td style="border:1px solid #d1d5db;font-weight:bold;">Description</td>
            <td style="border:1px solid #d1d5db;height:60px;">&nbsp;</td>
          </tr>
        </table>

        <h3 style="margin:16px 0 8px;font-size:13px;border-bottom:1px solid #000;padding-bottom:4px;">Equipment Onsite</h3>
        <div style="border:1px solid #d1d5db;min-height:60px;padding:8px;">&nbsp;</div>

        <h3 style="margin:16px 0 8px;font-size:13px;border-bottom:1px solid #000;padding-bottom:4px;">Daily Summary</h3>
        <div style="border:1px solid #d1d5db;min-height:120px;padding:8px;">&nbsp;</div>
      </div>
    `
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="margin:0;padding:0;font-family:Arial,sans-serif;">
      ${coverSheets}
    </body>
    </html>
  `;

  try {
    if (!PHIL_EMAIL) {
      return res.status(400).json({ message: "PHIL_EMAIL not configured" });
    }

    await transporter.sendMail({
      from: EMAIL_USER,
      to: PHIL_EMAIL,
      subject: `Daily Packets (${packets.length} jobs) - ${dateStr}`,
      html,
    });

    res.status(200).json({ message: "Packets email sent successfully" });
  } catch (error) {
    console.error("Error sending packets email:", error);
    res.status(500).json({ message: "Error sending packets email", error: error.message });
  }
}
