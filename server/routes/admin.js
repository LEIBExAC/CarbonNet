const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { asyncHandler } = require("../middleware/errorHandler");

const {
  getDashboardStats,
  getAnalytics,
  getSystemLogs,
  getAllUsers,
  verifyUser,
  suspendUser,
  bulkImportEmissionFactors,
} = require("../controllers/adminController");
const {
  getAllInstitutions,
  listJoinRequests,
  approveJoinRequest,
  rejectJoinRequest,
} = require("../controllers/institutionController");
const {
  listEmissionFactors,
  createEmissionFactor,
  updateEmissionFactor,
  deleteEmissionFactor,
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

router.get(
  "/users",
  protect,
  authorize("superadmin"),
  asyncHandler(getAllUsers)
);

router.get(
  "/institutions",
  protect,
  authorize("superadmin"),
  asyncHandler(getAllInstitutions)
);

// Institution Join Requests
router.get(
  "/institution-requests",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(listJoinRequests)
);
router.put(
  "/institution-requests/:id/approve",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(approveJoinRequest)
);
router.put(
  "/institution-requests/:id/reject",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(rejectJoinRequest)
);

// Emission Factors management
router.get(
  "/emission-factors",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(listEmissionFactors)
);
router.post(
  "/emission-factors",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(createEmissionFactor)
);
router.put(
  "/emission-factors/:id",
  protect,
  authorize("admin", "superadmin"),
  asyncHandler(updateEmissionFactor)
);
router.delete(
  "/emission-factors/:id",
  protect,
  authorize("superadmin"),
  asyncHandler(deleteEmissionFactor)
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
