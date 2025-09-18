const USER = require("../models/user");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("../utility/keys");
const generateTokenAndSetCookie = require("../utility/generateTokenAndSetCookie");
const {
  sendVerificationConfrmEmail,
  sendPasswordResetEmail,
  sendVerificationEmail,
} = require("../config/emailsender");
const jwt = require("jsonwebtoken");

// Signup Controller
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Please Enter All Fields" });
    }

    const existingUser = await USER.findOne({ email });
    if (existingUser) {
      if (existingUser.emailVerified) {
        return res
          .status(400)
          .json({ message: "User already exists with this email" });
      } else {
        const newVerificationToken = Math.floor(
          100000 + Math.random() * 900000
        ).toString();
        existingUser.verificationToken = newVerificationToken;
        existingUser.name = name;
        existingUser.password = await bcrypt.hash(password, 10);
        existingUser.verificationTokenExpiresAt = Date.now() + 5 * 60 * 1000;
        await existingUser.save();
        sendVerificationEmail(email, newVerificationToken);
        generateTokenAndSetCookie(res, existingUser._id);
        return res
          .status(200)
          .json({ message: "Verification email is resent" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = Math.floor(
      100000 + Math.random() * 900000
    ).toString();

    const user = new USER({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken,
      verificationTokenExpiresAt: Date.now() + 5 * 60 * 1000,
    });

    const savedUser = await user.save();
    sendVerificationEmail(email, verificationToken);
    generateTokenAndSetCookie(res, savedUser._id);

    res.status(201).json({ message: "Signup successful", savedUser });
  } catch (error) {
    console.log("signup error : " + error);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Verify OTP Controller
exports.verifyOtp = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized. No token provided." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const user = await USER.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ message: "OTP is required." });
    }

    if (
      user.verificationToken !== otp ||
      !user.verificationTokenExpiresAt ||
      user.verificationTokenExpiresAt < Date.now()
    ) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;

    await user.save();
    sendVerificationConfrmEmail(user.email, user);
    res.status(200).json({ message: "Account verified successfully." });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// Signin Controller
exports.signin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = await USER.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User does not exist" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    generateTokenAndSetCookie(res, user._id);
    res.status(200).json({ message: "Signin successful", user });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Request Reset OTP Controller
exports.requestResetOtp = async (req, res) => {
  const { email } = req.body;
  const user = await USER.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = otp;
  user.resetPasswordExpiresAt = Date.now() + 10 * 60 * 1000;
  sendPasswordResetEmail(user, otp, email);
  await user.save();

  res.status(200).json({ message: "OTP sent to email." });
};

// Verify Reset OTP Controller
exports.verifyResetOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await USER.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  if (
    user.resetPasswordToken !== otp ||
    !user.resetPasswordExpiresAt ||
    user.resetPasswordExpiresAt < Date.now()
  ) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);

  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  await user.save();

  res.status(200).json({ message: "Password reset successful" });
};

// Change Password Controller
exports.changePassword = async (req, res) => {
  try {
    const { password, newPassword } = req.body;

    if (!password || !newPassword) {
      return res
        .status(400)
        .json({ message: "Both old and new passwords are required." });
    }

    const userId = req.userId;
    const user = await USER.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Old password is incorrect" });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
