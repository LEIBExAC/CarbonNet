const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getDashboard,
  getStatistics,
  getLeaderboard,
  deleteAccount,
  getAllUsers,
  updateUser,
} = require("../controllers/userController");
const { protect, authorize, verifyEmail } = require("../middleware/auth");
const {
  updateProfileValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");

router.get("/profile", protect, getProfile);
router.put(
  "/profile",
  protect,
  updateProfileValidation,
  validate,
  updateProfile
);
router.delete("/account", protect, deleteAccount);

router.get("/dashboard", protect, verifyEmail, getDashboard);
router.get("/statistics", protect, getStatistics);
router.get(
  "/leaderboard",
  protect,
  paginationValidation,
  validate,
  getLeaderboard
);

router.get(
  "/",
  protect,
  authorize("admin", "superadmin"),
  paginationValidation,
  validate,
  getAllUsers
);
router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  updateUser
);

module.exports = router;
