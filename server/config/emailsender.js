const { transporter, sender } = require("./mailconfig");

const sendVerificationEmail = async (email, verificationToken) => {
  try {
    console.log("Sending verification token to:", email);

    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Your GeoPulse Verification Token",
    //   html: `
    //     <h2>Email Verification</h2>
    //     <p>Your verification token is:</p>
    //     <h3 style="color: #2b6cb0;">${verificationToken}</h3>
    //     <p>This token will expire in 10 minutes. Please do not share it with anyone.</p>
    //     <br/>
    //     <p>— GeoPulse Team</p>
    //   `,
    //   // Optional plain text fallback
      text: `Your verification token is: ${verificationToken}\nIt will expire in 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification token email sent to", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
const sendVerificationConfrmEmail = async (email,user) => {
  try {
    console.log("Sending verification token to:", email);

    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Your GeoPulse Verification Token",
    //   html: `
    //     <h2>Email Verification</h2>
    //     <p>Your verification token is:</p>
    //     <h3 style="color: #2b6cb0;">${verificationToken}</h3>
    //     <p>This token will expire in 10 minutes. Please do not share it with anyone.</p>
    //     <br/>
    //     <p>— GeoPulse Team</p>
    //   `,
    //   // Optional plain text fallback
      text: `Thanks ${user.name} for using geopulse services. your mail id for future communication is ${user.email}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification token email sent to", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendPasswordResetEmail = async (user,otp,email) => {
  try {
    console.log("Sending Password Reset token to:", email);

    const mailOptions = {
      from: `"${sender.name}" <${sender.email}>`,
      to: email,
      subject: "Your GeoPulse Reset Password OTP ",
    //   html: `
    //     <h2>Email Verification</h2>
    //     <p>Your verification token is:</p>
    //     <h3 style="color: #2b6cb0;">${verificationToken}</h3>
    //     <p>This token will expire in 10 minutes. Please do not share it with anyone.</p>
    //     <br/>
    //     <p>— GeoPulse Team</p>
    //   `,
    //   // Optional plain text fallback
      text: `Hello ${user.name} your reset password request otp is ${otp} . Donot share it With anyone.`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Verification token email sent to", email);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = {sendVerificationEmail , sendVerificationConfrmEmail,sendPasswordResetEmail};