/**
 * This file needs to be Reviewed.
 * It contains the controller functions for handling file uploads related to activities and emission factors.
 * NOT pushing it to GitHub until reviewed.
 */
const Activity = require("../models/activity");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  parseFile,
  mapToActivityFormat,
  validateActivityData,
} = require("../utility/fileParser");
const { cleanupFile } = require("../middleware/upload");
const { calculateEmissions } = require("../utility/emissionCalculator");
const { createNotification } = require("../controllers/notificationController");

/**
 * @desc    Upload activities file
 * @route   POST /upload/activities
 * @access  Private
 */
exports.uploadActivities = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a file",
    });
  }

  const { category } = req.body;
  const filePath = req.file.path;
  const fileType = req.file.originalname.split(".").pop().toLowerCase();

  try {
    console.log("[Upload] Parsing file:", filePath, "Type:", fileType);
    const parsedData = await parseFile(filePath, fileType);
    console.log("[Upload] Parsed data length:", parsedData.length);

    console.log("[Upload] Mapping to activity format with category:", category);
    const mappedActivities = mapToActivityFormat(parsedData, category);
    console.log("[Upload] Mapped activities length:", mappedActivities.length);

    console.log("[Upload] Validating activities...");
    const validation = validateActivityData(mappedActivities);
    console.log(
      "[Upload] Validation result - Valid:",
      validation.validCount,
      "Errors:",
      validation.errorCount
    );

    const createdActivities = [];
    const errors = [...validation.errors];

    for (const activityData of validation.valid) {
      try {
        const emissionResult = await calculateEmissions({
          ...activityData,
          userId: req.user.id,
          institutionId: req.user.institutionId,
        });

        console.log(
          "[Upload] Calculated emissions:",
          emissionResult.total,
          "kg CO2e"
        );

        const activity = await Activity.create({
          ...activityData,
          userId: req.user.id,
          institutionId: req.user.institutionId,
          carbonEmission: emissionResult.total,
          emissionFactorUsed: emissionResult.factorUsed,
          dataSource: "file_upload",
          fileReference: req.file.filename,
        });

        console.log("[Upload] Activity created:", activity._id);
        createdActivities.push(activity);
      } catch (error) {
        console.error("[Upload] Error creating activity:", error.message);
        if (error.name === "ValidationError") {
          console.error("[Upload] Validation details:", error.errors);
        }
        errors.push({
          data: activityData,
          error: error.message,
        });
      }
    }

    if (createdActivities.length > 0) {
      const User = require("../models/user");
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalPoints: Math.min(createdActivities.length * 2, 100) },
      });
    }

    // Clean up file
    cleanupFile(filePath);

    try {
      await createNotification({
        userId: req.user.id,
        title: "Bulk upload completed",
        message: `${createdActivities.length} activities imported, ${errors.length} failed`,
        type: errors.length > 0 ? "warning" : "success",
        meta: {
          imported: createdActivities.length,
          failed: errors.length,
          file: req.file.filename,
        },
      });
    } catch (_) {}

    res.status(201).json({
      success: true,
      message: `${createdActivities.length} activities imported successfully`,
      data: {
        imported: createdActivities.length,
        failed: errors.length,
        activities: createdActivities,
        errors: errors,
      },
    });
  } catch (error) {
    // Clean up file on error
    cleanupFile(filePath);
    throw error;
  }
});

/**
 * @desc    Upload emission factors file
 * @route   POST /upload/emission-factors
 * @access  Private/Admin
 */
exports.uploadEmissionFactors = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please upload a file",
    });
  }

  const filePath = req.file.path;
  const fileType = req.file.originalname.split(".").pop().toLowerCase();

  try {
    // Parse file
    const parsedData = await parseFile(filePath, fileType);

    const EmissionFactor = require("../models/emissionFactor");
    const created = [];
    const errors = [];

    for (let i = 0; i < parsedData.length; i++) {
      const row = parsedData[i];

      try {
        const factor = await EmissionFactor.create({
          category: row.category,
          subcategory: row.subcategory,
          description: row.description,
          factor: parseFloat(row.factor),
          unit: row.unit,
          emissionUnit: row.emission_unit || "kg CO2e",
          scope: parseInt(row.scope),
          source: row.source || "CUSTOM",
          sourceYear: parseInt(row.source_year),
          region: row.region || "IN",
          validFrom: new Date(row.valid_from || Date.now()),
          validUntil: row.valid_until ? new Date(row.valid_until) : null,
          institutionId: req.user.institutionId,
          customFactor: true,
          createdBy: req.user.id,
        });

        created.push(factor);
      } catch (error) {
        errors.push({
          row: i + 1,
          data: row,
          error: error.message,
        });
      }
    }

    // Clean up file
    cleanupFile(filePath);

    res.status(201).json({
      success: true,
      message: `${created.length} emission factors imported successfully`,
      data: {
        imported: created.length,
        failed: errors.length,
        factors: created,
        errors: errors,
      },
    });
  } catch (error) {
    cleanupFile(filePath);
    throw error;
  }
});

/**
 * @desc    Download template file
 * @route   GET /upload/template/:type
 * @access  Private
 */
exports.downloadTemplate = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const templates = {
    transportation: [
      {
        date: "2024-01-01",
        category: "transportation",
        mode: "car",
        distance: 10,
        fuel_type: "petrol",
        passengers: 1,
        description: "Commute to office",
      },
      {
        date: "2024-01-02",
        category: "transportation",
        mode: "bus",
        distance: 5,
        fuel_type: "diesel",
        passengers: 1,
        description: "Shopping trip",
      },
    ],
    electricity: [
      {
        date: "2024-01-01",
        category: "electricity",
        consumption: 150,
        source: "grid",
        appliance: "AC",
        description: "Monthly AC usage",
      },
      {
        date: "2024-01-02",
        category: "electricity",
        consumption: 50,
        source: "solar",
        appliance: "Lights",
        description: "Solar powered lights",
      },
    ],
    food: [
      {
        date: "2024-01-01",
        category: "food",
        meal_type: "lunch",
        diet_type: "veg",
        quantity: 1,
        food_waste: 0.1,
        description: "Canteen lunch",
      },
      {
        date: "2024-01-02",
        category: "food",
        meal_type: "dinner",
        diet_type: "non-veg",
        quantity: 1,
        food_waste: 0,
        description: "Home dinner",
      },
    ],
    waste: [
      {
        date: "2024-01-01",
        category: "waste",
        waste_type: "plastic",
        quantity: 0.5,
        recycled: "yes",
        description: "Plastic bottles",
      },
      {
        date: "2024-01-02",
        category: "waste",
        waste_type: "paper",
        quantity: 2,
        recycled: "no",
        description: "Office paper waste",
      },
    ],
    water: [
      {
        date: "2024-01-01",
        category: "water",
        consumption: 100,
        usage: "drinking",
        description: "Daily water consumption",
      },
      {
        date: "2024-01-02",
        category: "water",
        consumption: 200,
        usage: "washing",
        description: "Laundry water",
      },
    ],
  };

  const template = templates[type];

  if (!template) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid template type. Available types: transportation, electricity, food, waste, water",
    });
  }

  // Convert to CSV
  const Papa = require("papaparse");
  const csv = Papa.unparse(template);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${type}_template.csv`
  );
  res.send(csv);
});

/**
 * @desc    Get upload history
 * @route   GET /upload/history
 * @access  Private
 */
exports.getUploadHistory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const activities = await Activity.find({
    userId: req.user.id,
    dataSource: "file_upload",
  })
    .select("category activityDate carbonEmission fileReference createdAt")
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  // Group by file reference
  const uploads = {};
  activities.forEach((activity) => {
    if (!uploads[activity.fileReference]) {
      uploads[activity.fileReference] = {
        fileReference: activity.fileReference,
        uploadDate: activity.createdAt,
        activities: [],
        totalEmissions: 0,
      };
    }
    uploads[activity.fileReference].activities.push(activity);
    uploads[activity.fileReference].totalEmissions += activity.carbonEmission;
  });

  const uploadHistory = Object.values(uploads);

  res.status(200).json({
    success: true,
    data: {
      uploads: uploadHistory,
      totalPages: Math.ceil(uploadHistory.length / limit),
      currentPage: page,
    },
  });
});
