/**
 * This module is in development. I have written the route structure but their implementation is pending.
 * Do NOT use this module. Focus on the basic features I have written so far.
 */

const express = require("express");
const router = express.Router();
const { protect, authorize, verifyEmail } = require("../middleware/auth");
const {
  reportValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");

const reportController = {
  generateReport: async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Report generation endpoint - implementation pending",
    });
  },
  getReports: async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Get reports endpoint - implementation pending",
    });
  },
  getReport: async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Get single report endpoint - implementation pending",
    });
  },
  downloadReport: async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Download report endpoint - implementation pending",
    });
  },
  deleteReport: async (req, res) => {
    res.status(200).json({
      success: true,
      message: "Delete report endpoint - implementation pending",
    });
  },
};

router.post(
  "/generate",
  protect,
  verifyEmail,
  reportValidation,
  validate,
  reportController.generateReport
);
router.get(
  "/",
  protect,
  paginationValidation,
  validate,
  reportController.getReports
);
router.get(
  "/:id",
  protect,
  mongoIdValidation,
  validate,
  reportController.getReport
);
router.get(
  "/:id/download",
  protect,
  mongoIdValidation,
  validate,
  reportController.downloadReport
);
router.delete(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  reportController.deleteReport
);

module.exports = router;
