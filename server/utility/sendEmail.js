const { emailClient, emailService } = require("../config/mailconfig");

exports.sendEmail = async (options) => {
  if (!emailClient) {
    console.warn("Email not sent - Email service not configured");
    console.log(`Would have sent email to: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    return {
      success: false,
      message: "Email service not configured",
      warning: true,
    };
  }

  try {
    if (emailService === "resend") {
      const { data, error } = await emailClient.emails.send({
        from: process.env.EMAIL_FROM || "CarbonNet <onboarding@resend.dev>",
        to: [options.to],
        subject: options.subject,
        html: options.html,
      });

      if (error) {
        console.error("Resend error:", error);
        return {
          success: false,
          message: "Email could not be sent",
          error: error.message,
        };
      }

      console.log("Email sent via Resend");
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   ID: ${data.id}`);

      return { success: true, messageId: data.id };
    } else if (emailService === "gmail") {
      const mailOptions = {
        from: `${process.env.EMAIL_FROM || "Carbon Net"} <${
          process.env.EMAIL_USER
        }>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: {
          "X-Mailer": "CarbonNet",
          "X-Priority": "3",
        },
      };

      const info = await emailClient.sendMail(mailOptions);
      console.log("Email sent via Gmail SMTP");
      console.log(`   To: ${options.to}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Message ID: ${info.messageId}`);

      return { success: true, messageId: info.messageId };
    }
  } catch (error) {
    console.error("Email sending error:", error.message);

    // Provide helpful error messages
    if (error.message.includes("Invalid login")) {
      console.error("Gmail authentication failed. Check your App Password.");
    } else if (error.message.includes("ETIMEDOUT")) {
      console.error("Connection timeout. SMTP ports may be blocked.");
      console.error("Use Resend for production (HTTP API)");
    }

    return {
      success: false,
      message: "Email could not be sent",
      error: error.message,
    };
  }
};

exports.sendVerificationEmail = async (email, name, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Carbon Net!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Thank you for registering with Carbon Net. To complete your registration, please verify your email address.</p>
          <p style="text-align: center;">
            <a href="${verificationUrl}" class="button">Verify Email</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create this account, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Carbon Net. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return exports.sendEmail({
    to: email,
    subject: "Verify Your Email - Carbon Net",
    html,
  });
};

exports.sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <p style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #f5576c;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p><strong>If you didn't request this, please ignore this email and your password will remain unchanged.</strong></p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Carbon Net. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return exports.sendEmail({
    to: email,
    subject: "Password Reset - Carbon Net",
    html,
  });
};

exports.sendWelcomeEmail = async (email, name) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .feature { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome Aboard!</h1>
        </div>
        <div class="content">
          <h2>Hi ${name},</h2>
          <p>Welcome to Carbon Net! We're excited to have you join our community of environmentally conscious individuals.</p>
          
          <h3>Here's what you can do:</h3>
          <div class="feature">
            <h4>Track Your Impact</h4>
            <p>Log your daily activities and see your carbon footprint in real-time.</p>
          </div>
          <div class="feature">
            <h4>Join Challenges</h4>
            <p>Participate in eco-challenges and compete with others.</p>
          </div>
          <div class="feature">
            <h4>Get Recommendations</h4>
            <p>Receive personalized tips to reduce your emissions.</p>
          </div>
          <div class="feature">
            <h4>Monitor Progress</h4>
            <p>View detailed reports and track your improvement over time.</p>
          </div>
          
          <p>Start your journey towards a sustainable future today!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} Carbon Net. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return exports.sendEmail({
    to: email,
    subject: "Welcome to Carbon Net!",
    html,
  });
};
