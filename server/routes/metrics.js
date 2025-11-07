const express = require("express");
const router = express.Router();
const { getPublicMetrics } = require("../controllers/metricsController");

// Public route for landing page
router.get("/public", getPublicMetrics);

module.exports = router;
