const express = require("express");
const router = express.Router();
const { protect, authorize, verifyEmail } = require("../middleware/auth");
const {
  reportValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");
const {
  generateReport,
  getReports,
  getReport,
  downloadReport,
  deleteReport,
} = require("../controllers/reportController");

router.post(
  "/generate",
  protect,
  verifyEmail,
  reportValidation,
  validate,
  generateReport
);
router.get("/", protect, paginationValidation, validate, getReports);
router.get("/:id", protect, mongoIdValidation, validate, getReport);
router.get(
  "/:id/download",
  protect,
  mongoIdValidation,
  validate,
  downloadReport
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  deleteReport
);

module.exports = router;
