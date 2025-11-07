const express = require("express");
const router = express.Router();
const {
  createActivity,
  estimateActivity,
  getActivities,
  getActivity,
  updateActivity,
  deleteActivity,
  bulkCreateActivities,
  getCategorySummary,
  getMonthlyTrends,
  getRecommendations,
} = require("../controllers/activityController");
const { protect, verifyEmail } = require("../middleware/auth");
const {
  activityValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");

router.post(
  "/",
  protect,
  verifyEmail,
  activityValidation,
  validate,
  createActivity
);
// Estimate emissions without saving
router.post(
  "/estimate",
  protect,
  verifyEmail,
  activityValidation,
  validate,
  estimateActivity
);
router.get("/", protect, paginationValidation, validate, getActivities);
router.get("/summary/category", protect, getCategorySummary);
router.get("/trends/monthly", protect, getMonthlyTrends);
router.get("/recommendations", protect, getRecommendations);
router.get("/:id", protect, mongoIdValidation, validate, getActivity);
router.put(
  "/:id",
  protect,
  mongoIdValidation,
  activityValidation,
  validate,
  updateActivity
);
router.delete("/:id", protect, mongoIdValidation, validate, deleteActivity);

// Bulk
router.post("/bulk", protect, verifyEmail, bulkCreateActivities);

module.exports = router;
