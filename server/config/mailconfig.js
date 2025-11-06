let emailService = "none";
let emailClient = null;

if (
  process.env.EMAIL_MICROSERVICE_URL &&
  process.env.EMAIL_MICROSERVICE_API_KEY
) {
  emailClient = require("../utility/emailMicroserviceClient");
  emailService = "microservice";

  emailClient.checkHealth().then((health) => {
    if (health.success) {
      console.log("Email service: AWS Lightsail Microservice");
      console.log(`Endpoint: ${process.env.EMAIL_MICROSERVICE_URL}`);
    } else {
      console.warn("Email microservice is not responding");
      console.warn("   Please check if the service is running");
    }
  });
} else if (process.env.RESEND_API_KEY) {
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

  emailClient = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });
  emailService = "gmail";

  emailClient.verify((error, success) => {
    if (error) {
      console.warn("Gmail SMTP warning:", error.message);
      console.warn("Note: SMTP won't work on Render free tier (ports blocked)");
      console.warn("Use Email Microservice or Resend for production");
    } else {
      console.log("Email service: Gmail SMTP (local dev only)");
      console.log(`Using: ${process.env.EMAIL_USER}`);
    }
  });
} else {
  console.warn("No email service configured");
  console.warn(
    "For production: Set EMAIL_MICROSERVICE_URL and EMAIL_MICROSERVICE_API_KEY"
  );
  console.warn("Alternative: Set RESEND_API_KEY");
  console.warn("For local dev: Set EMAIL_USER and EMAIL_PASSWORD");
}

module.exports = { emailClient, emailService };
