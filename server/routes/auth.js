const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmail,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  changePassword,
  refreshToken,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const {
  registerValidation,
  loginValidation,
  validate,
} = require("../middleware/validator");
const rateLimit = require("express-rate-limit");

// Rate limiters
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many login attempts, please try again after 15 minutes",
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: "Too many accounts created, please try again after an hour",
});

router.post(
  "/register",
  registerLimiter,
  registerValidation,
  validate,
  register
);
router.get("/verify-email/:token", verifyEmail);
router.post("/login", loginLimiter, loginValidation, validate, login);
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPassword);
router.post("/refresh-token", refreshToken);

// Protected routes
router.post("/logout", protect, logout);
router.get("/me", protect, getMe);
router.put("/change-password", protect, changePassword);

module.exports = router;
