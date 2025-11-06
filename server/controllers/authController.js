const User = require("../models/user");
const crypto = require("crypto");
const {
  generateToken,
  generateRefreshToken,
} = require("../utility/generateToken");
const {
  sendEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
} = require("../utility/sendEmail");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Register a new user
 * @route   POST /auth/register
 * @access  Public
 * @note    I have for now allowed the role of user to be set from frontend, but we can later change it to be set in profile section, upgrading from current regular one to other roles based on verification. So do not take input from user for the role, later to be upgraded.
 */
exports.register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    userType,
    institutionId,
    department,
    enrollmentId,
  } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: "User already exists with this email",
    });
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");
  const verificationTokenExpiresAt = Date.now() + 10 * 60 * 1000;

  const user = await User.create({
    name,
    email,
    password,
    userType: userType || "regularUser",
    institutionId,
    department,
    enrollmentId,
    verificationToken,
    verificationTokenExpiresAt,
    status: "pending",
  });

  try {
    await sendVerificationEmail(user.email, user.name, verificationToken);

    res.status(201).json({
      success: true,
      message:
        "Registration successful. Please check your email to verify your account.",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    // Deleting user if email send fails, to avoid unverified accounts and let user retry
    await User.findByIdAndDelete(user._id);

    return res.status(500).json({
      success: false,
      message: "Email could not be sent. Please try again.",
    });
  }
});

/**
 *  @desc    Verify email
 *  @route   GET /auth/verify-email/:token
 *  @access  Public
 */
exports.verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({
    verificationToken: token,
    verificationTokenExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired verification token",
    });
  }

  user.emailVerified = true;
  user.status = "active";
  user.verificationToken = undefined;
  user.verificationTokenExpiresAt = undefined;
  await user.save();

  await sendWelcomeEmail(user.email, user.name);

  res.status(200).json({
    success: true,
    message: "Email verified successfully. You can now login.",
  });
});

/**
 * @desc    Login user
 * @route   POST /auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  if (user.isLocked) {
    const lockTimeRemaining = Math.ceil(
      (user.lockUntil - Date.now()) / (1000 * 60)
    );
    return res.status(423).json({
      success: false,
      message: `Account locked. Try again in ${lockTimeRemaining} minutes.`,
    });
  }

  const isPasswordMatch = await user.comparePassword(password);

  if (!isPasswordMatch) {
    await user.incLoginAttempts();
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }

  if (!user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your account is not active. Please contact admin.",
    });
  }

  if (user.loginAttempts > 0) {
    await user.resetLoginAttempts();
  }

  await user.updateLastLogin();

  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        userType: user.userType,
        institutionId: user.institutionId,
      },
      token,
      refreshToken,
    },
  });
});

/**
 * @desc    Logout user
 * @route   POST /auth/logout
 * @access  Private
 */
exports.logout = asyncHandler(async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate(
    "institutionId",
    "name code"
  );

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Forgot password
 * @route   POST /auth/forgot-password
 * @access  Public
 */
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "No user found with that email",
    });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpiresAt = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await sendPasswordResetEmail(user.email, user.name, resetToken);

    res.status(200).json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiresAt = undefined;
    await user.save();

    return res.status(500).json({
      success: false,
      message: "Email could not be sent",
    });
  }

  res.status(200).json({
    success: true,
    message: "Password reset email sent successfully. Please check your inbox.",
  });
});

/**
 * @desc    Reset password
 * @route   PUT /auth/reset-password/:token
 * @access  Public
 */
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiresAt: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired reset token",
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiresAt = undefined;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    success: true,
    message:
      "Password reset successful. You can now login with your new password.",
  });
});

/**
 * @desc    Change password
 * @route   PUT /auth/change-password
 * @access  Private
 */
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select("+password");

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

/**
 * @desc    Refresh token
 * @route   POST /auth/refresh-token
 * @access  Public
 */
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Refresh token required",
    });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);

    res.status(200).json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
});
