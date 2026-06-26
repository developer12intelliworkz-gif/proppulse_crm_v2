// ──────────────────────────────────────────────────────────────
//  Email templates – pure strings, reusable across the app
//  Exported as functions so you can inject dynamic values.
// ──────────────────────────────────────────────────────────────

/**
 * Welcome email sent to the **lead**
 */
export const leadWelcomeHtml = (name, projectName, phone, email) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Shyam Group</title>
  <style>
    body { margin:0; padding:0; background:#f4f7fa; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,.1); border:1px solid #e0e6ed; }
    .header { background:linear-gradient(135deg,#1e3a8a,#3b82f6); padding:35px 20px; text-align:center; color:#fff; }
    .header h1 { margin:0; font-size:28px; font-weight:600; letter-spacing:.5px; }
    .header p { margin:10px 0 0; font-size:16px; opacity:.95; }
    .body { padding:35px 40px; color:#333; line-height:1.7; }
    .highlight { color:#1e40af; font-weight:600; }
    .details-box { background:#f0f7ff; border-left:4px solid #3b82f6; padding:18px; margin:20px 0; border-radius:0 8px 8px 0; }
    .details-box p { margin:8px 0; }
    .cta-button { display:inline-block; background:#3b82f6; color:#fff; padding:14px 28px; border-radius:8px; text-decoration:none; font-weight:600; margin:20px 0; box-shadow:0 4px 12px rgba(59,130,246,.3); }
    .footer { background:#f8fafc; padding:25px 40px; text-align:center; font-size:13px; color:#64748b; border-top:1px solid #e2e8f0; }
    .footer a { color:#3b82f6; text-decoration:none; font-weight:500; }
    .signature { margin-top:30px; padding-top:20px; border-top:1px dashed #cbd5e1; font-size:14px; }
    @media (max-width:600px){ .container{margin:15px;} .body,.footer{padding:25px 20px;} .header h1{font-size:24px;} }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Shyam Group</h1><p>Premium Residential Plots in Dholera</p></div>
    <div class="body">
      <p>Dear <strong>${name || "Valued Customer"}</strong>,</p>
      <p>Thank you for choosing <span class="highlight">Shyam Group</span> — your trusted partner in real estate investment.</p>
      <p>We’ve successfully registered your inquiry for <strong>residential plots in ${projectName}</strong>.</p>

      <div class="details-box">
        <p><strong>Name:</strong> ${name || "N/A"}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Email:</strong> ${email || "N/A"}</p>
        <p><strong>Project Interest:</strong> ${projectName}</p>
      </div>

      <p>Our property expert will contact you <strong>within 24 hours</strong> to discuss:</p>
      <ul>
        <li>Best plot locations & pricing</li>
        <li>Investment potential & ROI</li>
        <li>Site visit scheduling</li>
        <li>Easy EMI & documentation</li>
      </ul>

      <p style="text-align:center;">
        <a href="https://www.shyamgroups.co.in/" class="cta-button">Explore Dholera Projects</a>
      </p>

      <p>We look forward to helping you get a piece of India’s smartest city.</p>

      <div class="signature">
        <p style="margin:0;font-weight:600;color:#1e40af;">Warm regards,</p>
        <p style="margin:5px 0 2px;font-weight:700;color:#1e3a8a;font-size:15px;">Admin</p>
        <p style="margin:0;color:#3b82f6;font-weight:600;">Shyam Group</p>
        <p style="margin:8px 0 0;font-size:13px;color:#475569;">
          <strong>Real Estate</strong><br>
          <a href="https://www.shyamgroups.co.in/" style="color:#3b82f6;text-decoration:none;">www.shyamgroups.co.in</a> |
          <a href="mailto:info@shyamgroups.co.in" style="color:#3b82f6;">info@shyamgroups.co.in</a><br>
          <span style="color:#64748b;">(+91) 85113 32200</span>
        </p>
      </div>
    </div>
    <div class="footer">
      <p>© 2025 <strong>Shyam Group</strong>. All rights reserved.<br>
      <a href="https://www.shyamgroups.co.in/">shyamgroups.co.in</a> | Dholera, Gujarat, India</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Plain-text fallback for the welcome email
 */
export const leadWelcomeText = (name, projectName, phone, email) => `
Dear ${name || "Valued Customer"},

Thank you for choosing Shyam Group. Your inquiry for residential plots in ${projectName} has been successfully registered.

Name   : ${name || "N/A"}
Phone  : ${phone || "N/A"}
Email  : ${email || "N/A"}
Project: ${projectName}

Our property expert will contact you within 24 hours.

Best regards,
Admin – Shyam Group
https://www.shyamgroups.co.in
(+91) 85113 32200
`;

/**
 * Alert email sent to the **assigned user / team**
 */
export const leadAlertHtml = (
  name,
  projectName,
  phone,
  email,
  budget,
  message
) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>New Lead Alert</title>
  <style>
    body { margin:0; padding:0; background:#f4f7fa; font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif; }
    .container { max-width:600px; margin:30px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 8px 25px rgba(0,0,0,.1); border:1px solid #e0e6ed; }
    .header { background:linear-gradient(135deg,#dc2626,#f97316); padding:30px 20px; text-align:center; color:#fff; }
    .header h1 { margin:0; font-size:26px; font-weight:600; }
    .header .badge { background:rgba(255,255,255,.2); padding:6px 14px; border-radius:20px; font-size:13px; display:inline-block; margin-top:8px; }
    .body { padding:35px 40px; color:#333; line-height:1.7; }
    .lead-card { background:#fef3c7; border:1px solid #f59e0b; border-radius:10px; padding:20px; margin:20px 0; }
    .lead-card h3 { margin:0 0 15px; color:#d97706; font-size:18px; }
    .lead-card p { margin:8px 0; font-size:15px; }
    .label { font-weight:600; color:#92400e; }
    .value { color:#1f2937; }
    .action-btn { background:#f97316; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; display:inline-block; margin-top:15px; }
    .action-btn.call { background:#10b981; margin-left:10px; }
    .footer { background:#f8fafc; padding:25px 40px; text-align:center; font-size:13px; color:#64748b; border-top:1px solid #e2e8f0; }
    .signature { margin-top:30px; padding-top:20px; border-top:1px dashed #cbd5e1; font-size:14px; }
    @media (max-width:600px){ .body,.footer{padding:25px 20px;} }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>New Lead Alert!</h1><div class="badge">High Priority – Follow Up Now</div></div>
    <div class="body">
      <p>Hello <strong>Team</strong>,</p>
      <p>A <strong>new potential investor</strong> has shown interest in <strong>${projectName}</strong>.</p>

      <div class="lead-card">
        <h3>Lead Details</h3>
        <p><span class="label">Name:</span> <span class="value">${
          name || "N/A"
        }</span></p>
        <p><span class="label">Email:</span> <span class="value">${
          email || "N/A"
        }</span></p>
        <p><span class="label">Phone:</span> <span class="value">${
          phone || "N/A"
        }</span></p>
        <p><span class="label">Project:</span> <span class="value">${projectName}</span></p>
        <p><span class="label">Budget:</span> <span class="value">${
          budget ? "₹" + budget : "Not specified"
        }</span></p>
        <p><span class="label">Message:</span> <span class="value">${
          message || "No message provided"
        }</span></p>
      </div>

      <p><strong>Action Required:</strong> Contact the lead <strong>within 2 hours</strong> to secure the deal.</p>

      <p style="text-align:center;">
        <a href="mailto:${email}" class="action-btn">Send Email Now</a>
        <a href="tel:${phone}" class="action-btn call">Call Now</a>
      </p>

      <div class="signature">
        <p style="margin:0;font-weight:600;color:#dc2626;">Best regards,</p>
        <p style="margin:5px 0 2px;font-weight:700;color:#1e3a8a;font-size:15px;">Admin</p>
        <p style="margin:0;color:#3b82f6;font-weight:600;">Shyam Group</p>
        <p style="margin:8px 0 0;font-size:13px;color:#475569;">
          <a href="https://www.shyamgroups.co.in/" style="color:#3b82f6;text-decoration:none;">www.shyamgroups.co.in</a> |
          <a href="mailto:info@shyamgroups.co.in" style="color:#3b82f6;">info@shyamgroups.co.in</a><br>
          <span style="color:#64748b;">(+91) 85113 32200</span>
        </p>
      </div>
    </div>
    <div class="footer"><p>© 2025 <strong>Shyam Group</strong>. All rights reserved.</p></div>
  </div>
</body>
</html>
`;

/**
 * Plain-text fallback for the alert email
 */
export const leadAlertText = (
  name,
  projectName,
  phone,
  email,
  budget,
  message
) => `
Hello Team,

A new lead has been registered:

Name    : ${name || "N/A"}
Email   : ${email || "N/A"}
Phone   : ${phone || "N/A"}
Project : ${projectName}
Budget  : ${budget ? "₹" + budget : "Not specified"}
Message : ${message || "None"}

Please follow up immediately.

Regards,
Admin – Shyam Group
https://www.shyamgroups.co.in
(+91) 85113 32200
`;
