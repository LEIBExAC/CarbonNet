const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const {
  getDashboardStats,
  getAnalytics,
  getSystemLogs,
  verifyUser,
  suspendUser,
  bulkImportEmissionFactors,
} = require("../controllers/adminController");

router.get(
  "/dashboard",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(getDashboardStats)
);

router.get(
  "/analytics",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(getAnalytics)
);

router.get(
  "/logs",
  protect,
  authorize("superadmin"),
  asyncHandler(getSystemLogs)
);

router.put(
  "/users/:id/verify",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(verifyUser)
);

router.put(
  "/users/:id/suspend",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(suspendUser)
);

router.post(
  "/emission-factors/bulk",
  protect,
  authorize("superadmin"),
  asyncHandler(bulkImportEmissionFactors)
);

module.exports = router;
