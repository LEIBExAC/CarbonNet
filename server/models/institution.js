const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Institution name is required"],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, "Institution code is required"],
      unique: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: [
        "university",
        "college",
        "school",
        "corporate",
        "government",
        "other",
      ],
      default: "university",
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    contactInfo: {
      email: {
        type: String,
        required: [true, "Contact email is required"],
      },
      phone: String,
      website: String,
    },
    adminEmail: {
      type: String,
      required: [true, "Admin email is required"],
    },
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    departments: [
      {
        name: String,
        code: String,
        head: String,
        contactEmail: String,
      },
    ],
    population: {
      students: { type: Number, default: 0 },
      faculty: { type: Number, default: 0 },
      staff: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    sustainabilityGoals: {
      targetReduction: { type: Number, default: 0 },
      baselineYear: {
        type: Number,
        min: [1900, "Baseline year must be after 1900"],
        max: [3000, "Baseline year must be before 3000"],
      },
      baselineEmissions: {
        type: Number,
        min: [0, "Baseline emissions must be a positive number"],
      },
      targetYear: {
        type: Number,
        min: [1900, "Target year must be after 1900"],
        max: [3000, "Target year must be before 3000"],
      },
    },
    settings: {
      allowSelfRegistration: { type: Boolean, default: false },
      requireEmailVerification: { type: Boolean, default: true },
      enableGamification: { type: Boolean, default: true },
      publicDashboard: { type: Boolean, default: false },
    },
    customEmissionFactors: [
      {
        category: String,
        subcategory: String,
        factor: Number,
        unit: String,
        source: String,
        validFrom: Date,
        validUntil: Date,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    setupCompleted: {
      type: Boolean,
      default: false,
    },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
);

// institutionSchema.index({ code: 1 });
// institutionSchema.index({ name: 1 });
institutionSchema.index({ isActive: 1 });

institutionSchema.pre("save", function (next) {
  if (!this.isNew && this.isModified("population")) {
    this.population.total =
      (this.population.students || 0) +
      (this.population.faculty || 0) +
      (this.population.staff || 0);
  }
  next();
});

module.exports = mongoose.model("Institution", institutionSchema);
