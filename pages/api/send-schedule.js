import { createTransport } from "nodemailer";

const EMAIL_PASS = process.env.EMAIL_PASS;
const EMAIL_USER = process.env.MAIL_USER;
const CESAR_EMAIL = process.env.CESAR_EMAIL;
const PHIL_EMAIL = process.env.PHIL_EMAIL;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { scheduleDate, categories, assignments, rigDetails } = req.body;

  if (!scheduleDate || !categories) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const transporter = createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // Build the schedule HTML
  const dateStr = new Date(scheduleDate + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categoryRows = (categories || [])
    .map((cat) => {
      const catAssignments = (assignments || []).filter(
        (a) => a.category_id === cat.id
      );
      const detail = (rigDetails || []).find((r) => r.category_id === cat.id);

      const detailLine = [
        detail?.superintendent_name ? `Supt: ${detail.superintendent_name}` : "",
        detail?.truck_number ? `Truck: ${detail.truck_number}` : "",
        detail?.crane_info ? `Crane: ${detail.crane_info}` : "",
      ]
        .filter(Boolean)
        .join(" | ");

      const crewRows =
        catAssignments.length > 0
          ? catAssignments
              .map(
                (a) =>
                  `<tr>
                    <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;font-weight:600;">${a.worker_name || "Unassigned"}</td>
                    <td style="padding:6px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;">${a.job_name || ""}</td>
                  </tr>`
              )
              .join("")
          : `<tr><td colspan="2" style="padding:8px 12px;color:#9ca3af;font-style:italic;">No crew assigned</td></tr>`;

      return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border-collapse:collapse;">
          <tr>
            <td colspan="2" style="background-color:${cat.color};color:white;padding:8px 12px;font-weight:700;font-size:15px;border-radius:6px 6px 0 0;">
              ${cat.name}
            </td>
          </tr>
          ${detailLine ? `<tr><td colspan="2" style="padding:6px 12px;background:#f9fafb;font-size:13px;color:#4b5563;border-bottom:1px solid #e5e7eb;">${detailLine}</td></tr>` : ""}
          ${crewRows}
        </table>
      `;
    })
    .join("");

  const scheduleHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f3f4f6;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden;">
        <tr>
          <td style="background:#0b2a5a;padding:20px;text-align:center;">
            <h1 style="margin:0;color:white;font-size:22px;">S&W Foundation</h1>
            <p style="margin:4px 0 0;color:#93c5fd;font-size:16px;">Daily Crew Schedule</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px;">
            <p style="font-size:18px;font-weight:700;color:#0b2a5a;margin:0 0 16px;">${dateStr}</p>
            ${categoryRows}
          </td>
        </tr>
        <tr>
          <td style="padding:12px 20px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af;">
            Generated ${new Date().toLocaleString()}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    // Send schedule to Cesar
    if (CESAR_EMAIL) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: CESAR_EMAIL,
        subject: `Crew Schedule - ${dateStr}`,
        html: scheduleHtml,
      });
    }

    // Send notification to Phil
    if (PHIL_EMAIL) {
      await transporter.sendMail({
        from: EMAIL_USER,
        to: PHIL_EMAIL,
        subject: `Crew Schedule Ready - ${dateStr}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"></head>
          <body style="font-family:Arial,sans-serif;padding:20px;">
            <h2 style="color:#0b2a5a;">Schedule Finalized for ${dateStr}</h2>
            <p>The daily crew schedule has been finalized by Cesar. Cover sheets and daily logs are ready for review.</p>
            <p>Log in to the <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://swfoundation.com"}/admin/crew-scheduler" style="color:#dc2626;font-weight:600;">Crew Scheduler</a> to view and print daily packets.</p>
            ${scheduleHtml}
          </body>
          </html>
        `,
      });
    }

    res.status(200).json({ message: "Schedule emails sent successfully" });
  } catch (error) {
    console.error("Error sending schedule email:", error);
    res.status(500).json({ message: "Error sending schedule email", error: error.message });
  }
}
