let emailClient = null;
let emailService = "none";

if (process.env.RESEND_API_KEY) {
  try {
    const { Resend } = require("resend");
    emailClient = new Resend(process.env.RESEND_API_KEY);
    emailService = "resend";
    console.log("Email service: Resend (HTTP API)");
    console.log("From:", process.env.EMAIL_FROM || "onboarding@resend.dev");
  } catch (error) {
    console.error("Failed to initialize Resend:", error.message);
    console.warn("Run: npm install resend");
  }
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  const nodemailer = require("nodemailer");

  const transportConfig = {
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 60000,
    secure: false,
    requireTLS: true,
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === "development" ? false : true,
      minVersion: "TLSv1.2",
    },
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    rateDelta: 1000,
    rateLimit: 5,
  };

  emailClient = nodemailer.createTransport(transportConfig);
  emailService = "gmail";

  setTimeout(() => {
    emailClient.verify((error, success) => {
      if (error) {
        console.warn("Gmail SMTP warning:", error.message);
        console.warn(
          "Note: SMTP won't work on Render free tier (ports blocked)"
        );
        console.warn("Use Resend instead for production");
      } else {
        console.log("Email service: Gmail SMTP (local dev only)");
        console.log(`Using: ${process.env.EMAIL_USER}`);
      }
    });
  }, 2000);
} else {
  console.warn("No email service configured");
  console.warn("For production (Render): Set RESEND_API_KEY");
  console.warn("For local dev: Set EMAIL_USER and EMAIL_PASSWORD");
}

module.exports = { emailClient, emailService };
