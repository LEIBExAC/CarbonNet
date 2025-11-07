const { body, param, query, validationResult } = require("express-validator");

// Error handler
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path,
        message: err.msg,
      })),
    });
  }
  next();
};

exports.registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 60 })
    .withMessage("Name must be between 2-60 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),

  body("userType")
    .optional()
    .isIn(["student", "faculty", "staff", "admin", "regularUser"])
    .withMessage("Invalid user type"),
];

exports.loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").notEmpty().withMessage("Password is required"),
];

exports.updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2-50 characters"),

  body("phoneNumber")
    .optional()
    .isMobilePhone()
    .withMessage("Please provide a valid phone number"),

  body("department")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Department name too long"),
];

// Activity
exports.activityValidation = [
  body("category")
    .notEmpty()
    .withMessage("Category is required")
    .isIn([
      "transportation",
      "electricity",
      "food",
      "waste",
      "water",
      "heating",
      "cooling",
      "paper",
      "events",
      "other",
    ])
    .withMessage("Invalid category"),

  body("activityDate")
    .optional()
    .isISO8601()
    .withMessage("Invalid date format"),

  body("quantity")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Quantity must be a positive number"),

  body("transportation.distance")
    .if(body("category").equals("transportation"))
    .notEmpty()
    .withMessage("Distance is required for transportation")
    .isFloat({ min: 0 })
    .withMessage("Distance must be positive"),

  body("transportation.mode")
    .if(body("category").equals("transportation"))
    .notEmpty()
    .withMessage("Mode is required for transportation")
    .isIn([
      "car",
      "bike",
      "bus",
      "train",
      "metro",
      "rickshaw",
      "walk",
      "flight",
      "other",
    ])
    .withMessage("Invalid transportation mode"),

  body("transportation.fuelType")
    .if(body("category").equals("transportation"))
    .notEmpty()
    .withMessage("Fuel type is required for transportation")
    .isIn(["petrol", "diesel", "cng", "electric", "hybrid", "none"])
    .withMessage("Invalid fuel type"),

  body("transportation.passengers")
    .if(body("category").equals("transportation"))
    .optional()
    .isInt({ min: 1 })
    .withMessage("Passengers must be at least 1"),

  body("electricity.consumption")
    .if(body("category").equals("electricity"))
    .notEmpty()
    .withMessage("Consumption is required for electricity")
    .isFloat({ min: 0 })
    .withMessage("Consumption must be positive"),

  body("electricity.source")
    .if(body("category").equals("electricity"))
    .notEmpty()
    .withMessage("Source is required for electricity")
    .isIn(["grid", "solar", "wind", "hybrid"])
    .withMessage("Invalid electricity source"),

  body("food.dietType")
    .if(body("category").equals("food"))
    .notEmpty()
    .withMessage("Diet type is required for food")
    .isIn(["veg", "non-veg", "vegan"])
    .withMessage("Invalid diet type"),

  body("food.quantity")
    .if(body("category").equals("food"))
    .notEmpty()
    .withMessage("Quantity is required for food")
    .isFloat({ min: 0 })
    .withMessage("Food quantity must be positive"),

  body("food.foodWaste")
    .if(body("category").equals("food"))
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Food waste must be positive"),

  body("waste.type")
    .if(body("category").equals("waste"))
    .notEmpty()
    .withMessage("Waste type is required")
    .isIn(["paper", "plastic", "food", "electronic", "general"])
    .withMessage("Invalid waste type"),

  body("waste.quantity")
    .if(body("category").equals("waste"))
    .notEmpty()
    .withMessage("Waste quantity is required")
    .isFloat({ min: 0 })
    .withMessage("Waste quantity must be positive"),

  body("waste.recycled")
    .if(body("category").equals("waste"))
    .optional()
    .isBoolean()
    .withMessage("Recycled must be a boolean"),

  body("water.consumption")
    .if(body("category").equals("water"))
    .notEmpty()
    .withMessage("Water consumption is required")
    .isFloat({ min: 0 })
    .withMessage("Water consumption must be positive"),

  body("water.usage")
    .if(body("category").equals("water"))
    .optional()
    .isIn(["drinking", "washing", "cleaning", "gardening", "other"])
    .withMessage("Invalid water usage"),

  body("quantity")
    .if(body("category").equals("other"))
    .notEmpty()
    .withMessage("Quantity is required for 'other' category")
    .isFloat({ min: 0 })
    .withMessage("Quantity must be positive for 'other' category"),
];

// Institution
exports.institutionValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Institution name is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Name must be between 3-200 characters"),

  body("code")
    .trim()
    .notEmpty()
    .withMessage("Institution code is required")
    .isLength({ min: 2, max: 20 })
    .withMessage("Code must be between 2-20 characters")
    .isAlphanumeric()
    .withMessage("Code must be alphanumeric"),

  body("adminEmail")
    .trim()
    .notEmpty()
    .withMessage("Admin email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("contactInfo.email")
    .trim()
    .notEmpty()
    .withMessage("Contact email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),
];

// Report
exports.reportValidation = [
  body("type")
    .notEmpty()
    .withMessage("Report type is required")
    .isIn([
      "individual",
      "departmental",
      "institutional",
      "comparative",
      "trend",
      "compliance",
      "custom",
    ])
    .withMessage("Invalid report type"),

  body("format")
    .optional()
    .isIn(["pdf", "excel", "csv", "json", "xlsx"]) // allow shorthand excel/xlsx
    .withMessage("Invalid format"),

  body("period.startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date"),

  body("period.endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid end date")
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.period.startDate)) {
        throw new Error("End date must be after start date");
      }
      return true;
    }),
];

// Challenge
exports.challengeValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5-100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10-500 characters"),

  body("type")
    .notEmpty()
    .withMessage("Challenge type is required")
    .isIn(["reduction", "streak", "milestone", "competition", "awareness"])
    .withMessage("Invalid challenge type"),

  body("points")
    .notEmpty()
    .withMessage("Points are required")
    .isInt({ min: 1 })
    .withMessage("Points must be a positive integer"),

  body("duration.startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Invalid start date"),

  body("duration.endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("Invalid end date"),
];

// ID parameter validation
exports.mongoIdValidation = [
  param("id").isMongoId().withMessage("Invalid ID format"),
];

exports.paginationValidation = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),

  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
];
