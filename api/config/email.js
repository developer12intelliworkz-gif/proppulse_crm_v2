import nodemailer from "nodemailer";

const emailHost = process.env.EMAIL_HOST;
const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
const emailSecure = emailPort === 465;
const emailUser = process.env.EMAIL_USER?.trim();
const emailPass = process.env.EMAIL_PASS?.trim();

console.log("SMTP Config Loaded:", {
  host: emailHost || "undefined",
  port: emailPort,
  secure: emailSecure,
  user: emailUser ? `${emailUser.split("@")[0]}@...` : "undefined",
});

const transporter = nodemailer.createTransport({
  host: emailHost,
  port: emailPort,
  secure: emailSecure,
  auth: {
    user: emailUser,
    pass: emailPass,
  },
  ...(emailPort === 587 ? { requireTLS: true } : {}),
  tls: {
    rejectUnauthorized: false,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 30000,
});

if (emailHost && emailUser) {
  transporter
    .verify()
    .then(() => console.log("[EMAIL] SMTP connection verified"))
    .catch((err) =>
      console.error("[EMAIL] SMTP verify failed:", err.message),
    );
}

export const sendEmail = async (to, subject, text, html) => {
  if (!emailHost || !emailUser || !emailPass) {
    throw new Error(
      "Email is not configured. Set EMAIL_HOST, EMAIL_USER, and EMAIL_PASS in .env",
    );
  }

  try {
    const mailOptions = {
      from: `"Shyam Group" <${emailUser}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(
      `[EMAIL SUCCESS] Sent to ${to} (Message ID: ${info.messageId})`,
    );
    return info;
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send to ${to}:`, {
      message: error.message,
      code: error.code,
      responseCode: error.responseCode,
    });
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Use from lead create/update/assign — logs failure but does not throw,
 * so CRM actions succeed even when SMTP auth is wrong.
 */
export const sendEmailSafe = async (to, subject, text, html) => {
  try {
    return await sendEmail(to, subject, text, html);
  } catch (error) {
    console.error(`[EMAIL SAFE] ${to}: ${error.message}`);
    return null;
  }
};
