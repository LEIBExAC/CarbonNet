const transporter = require("../config/mailconfig");

exports.sendEmail = async (options) => {
  const mailOptions = {
    from: `${process.env.EMAIL_FROM || "Carbon Net"} <${
      process.env.EMAIL_USER
    }>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Email sending error:", error);
    throw new Error("Email could not be sent");
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
