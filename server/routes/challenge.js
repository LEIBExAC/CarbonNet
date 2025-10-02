const express = require("express");
const router = express.Router();
const {
  createChallenge,
  getAllChallenges,
  getActiveChallenges,
  getChallenge,
  updateChallenge,
  deleteChallenge,
  joinChallenge,
  updateProgress,
  getMyChallenges,
  getChallengeLeaderboard,
} = require("../controllers/challengeController");
const { protect, authorize, verifyEmail } = require("../middleware/auth");
const {
  challengeValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");

router.post(
  "/",
  protect,
  authorize("admin", "superadmin"),
  challengeValidation,
  validate,
  createChallenge
);
router.get("/", protect, paginationValidation, validate, getAllChallenges);
router.get("/active", protect, getActiveChallenges);
router.get("/my-challenges", protect, getMyChallenges);
router.get("/:id", protect, mongoIdValidation, validate, getChallenge);
router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  updateChallenge
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  deleteChallenge
);

router.post(
  "/:id/join",
  protect,
  verifyEmail,
  mongoIdValidation,
  validate,
  joinChallenge
);
router.put(
  "/:id/progress",
  protect,
  mongoIdValidation,
  validate,
  updateProgress
);
router.get(
  "/:id/leaderboard",
  protect,
  mongoIdValidation,
  validate,
  getChallengeLeaderboard
);

module.exports = router;
