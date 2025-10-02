const express = require("express");
const router = express.Router();
const {
  uploadActivities,
  uploadEmissionFactors,
  downloadTemplate,
  getUploadHistory,
} = require("../controllers/fileUploadController");
const { protect, authorize, verifyEmail } = require("../middleware/auth");
const { uploadSingle } = require("../middleware/upload");

router.post(
  "/activities",
  protect,
  verifyEmail,
  uploadSingle,
  uploadActivities
);
router.post(
  "/emission-factors",
  protect,
  authorize("admin", "superadmin"),
  uploadSingle,
  uploadEmissionFactors
);

router.get("/template/:type", protect, downloadTemplate);

router.get("/history", protect, getUploadHistory);

module.exports = router;
