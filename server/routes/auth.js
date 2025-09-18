const express = require("express");
const verifyToken = require("../middleware/verifyToken");
const {
  signup,
  verifyOtp,
  signin,
  requestResetOtp,
  verifyResetOtp,
  changePassword,
} = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/signin", signin);
router.post("/request-reset-otp", requestResetOtp);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/change-password", verifyToken, changePassword);

module.exports = router;
