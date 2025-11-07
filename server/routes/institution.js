const express = require("express");
const router = express.Router();
const {
  createInstitution,
  getAllInstitutions,
  getInstitution,
  updateInstitution,
  deleteInstitution,
  getInstitutionDashboard,
  getDepartments,
  addDepartment,
  updateEmissionFactors,
  addInstitutionAdmin,
  getMyInstitutions,
  requestJoinByCode,
} = require("../controllers/institutionController");
const { protect, authorize } = require("../middleware/auth");
const {
  institutionValidation,
  validate,
  mongoIdValidation,
  paginationValidation,
} = require("../middleware/validator");

router.post(
  "/",
  protect,
  authorize("superadmin"),
  institutionValidation,
  validate,
  createInstitution
);

// Join requests (user)
router.post("/join-requests/by-code", protect, requestJoinByCode);

router.get(
  "/",
  protect,
  authorize("admin", "superadmin"),
  paginationValidation,
  validate,
  getAllInstitutions
);

router.get(
  "/my-institutions",
  protect,
  authorize("admin", "superadmin"),
  getMyInstitutions
);

router.get("/:id", protect, mongoIdValidation, validate, getInstitution);

router.put(
  "/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  updateInstitution
);

router.delete(
  "/:id",
  protect,
  authorize("superadmin"),
  mongoIdValidation,
  validate,
  deleteInstitution
);

router.put(
  "/:id/admins",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  addInstitutionAdmin
);

// Dashboard
router.get(
  "/:id/dashboard",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  getInstitutionDashboard
);

router.get(
  "/:id/departments",
  protect,
  mongoIdValidation,
  validate,
  getDepartments
);
router.post(
  "/:id/departments",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  addDepartment
);

// Emission factors
router.put(
  "/:id/emission-factors",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  updateEmissionFactors
);

module.exports = router;
