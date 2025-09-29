const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth");
const { mongoIdValidation, validate } = require("../middleware/validator");
const EmissionFactor = require("../models/emissionFactor");

const emissionController = {
  getAllFactors: async (req, res) => {
    const factors = await EmissionFactor.find({ isActive: true }).sort({
      category: 1,
      subcategory: 1,
    });

    res.status(200).json({
      success: true,
      data: { factors },
    });
  },

  getFactorsByCategory: async (req, res) => {
    const { category } = req.params;

    const factors = await EmissionFactor.find({
      category,
      isActive: true,
    });

    res.status(200).json({
      success: true,
      data: { factors },
    });
  },

  createFactor: async (req, res) => {
    const factor = await EmissionFactor.create({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Emission factor created successfully",
      data: { factor },
    });
  },

  updateFactor: async (req, res) => {
    const factor = await EmissionFactor.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedBy: req.user.id },
      { new: true, runValidators: true }
    );

    if (!factor) {
      return res.status(404).json({
        success: false,
        message: "Emission factor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Emission factor updated successfully",
      data: { factor },
    });
  },

  deleteFactor: async (req, res) => {
    const factor = await EmissionFactor.findByIdAndDelete(req.params.id);

    if (!factor) {
      return res.status(404).json({
        success: false,
        message: "Emission factor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Emission factor deleted successfully",
    });
  },
};

router.get("/factors", protect, emissionController.getAllFactors);
router.get(
  "/factors/category/:category",
  protect,
  emissionController.getFactorsByCategory
);
router.post(
  "/factors",
  protect,
  authorize("admin", "superadmin"),
  emissionController.createFactor
);
router.put(
  "/factors/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  emissionController.updateFactor
);
router.delete(
  "/factors/:id",
  protect,
  authorize("admin", "superadmin"),
  mongoIdValidation,
  validate,
  emissionController.deleteFactor
);

module.exports = router;
