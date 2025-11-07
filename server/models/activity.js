const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
    },
    category: {
      type: String,
      required: true,
      enum: [
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
      ],
    },
    subcategory: {
      type: String,
    },
    description: {
      type: String,
    },
    activityDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    transportation: {
      mode: {
        type: String,
        enum: [
          "car",
          "bike",
          "motorcycle",
          "bicycle",
          "bus",
          "train",
          "metro",
          "rickshaw",
          "walk",
          "flight",
          "other",
        ],
      },
      distance: Number, // in km
      fuelType: {
        type: String,
        enum: ["petrol", "diesel", "cng", "electric", "hybrid", "none"],
      },
      passengers: Number,
    },
    electricity: {
      consumption: Number, // in kWh
      source: {
        type: String,
        enum: ["grid", "solar", "wind", "hybrid"],
      },
      appliance: String,
    },
    food: {
      mealType: {
        type: String,
        enum: ["breakfast", "lunch", "dinner", "snack"],
      },
      dietType: {
        type: String,
        enum: ["veg", "non-veg", "vegan"],
      },
      quantity: Number,
      foodWaste: Number, // in kg
    },
    waste: {
      type: {
        type: String,
        enum: ["paper", "plastic", "food", "electronic", "general"],
      },
      quantity: Number, // in kg
      recycled: {
        type: Boolean,
        default: false,
      },
    },
    water: {
      consumption: Number, // in liters
      usage: {
        type: String,
        enum: ["drinking", "washing", "cleaning", "gardening", "other"],
      },
    },
    // Generic
    quantity: {
      type: Number,
    },
    unit: {
      type: String,
    },
    carbonEmission: {
      type: Number,
      required: true,
      default: 0,
    },
    emissionUnit: {
      type: String,
      default: "kg CO2e",
    },
    emissionFactorUsed: {
      factor: Number,
      source: String,
      version: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: Date,
    dataSource: {
      type: String,
      enum: ["manual", "file_upload", "api", "estimation"],
      default: "manual",
    },
    fileReference: String,
    notes: String,
    attachments: [
      {
        filename: String,
        url: String,
        uploadedAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

activitySchema.index({ userId: 1, activityDate: -1 });
activitySchema.index({ institutionId: 1, activityDate: -1 });
activitySchema.index({ category: 1 });
activitySchema.index({ activityDate: -1 });

activitySchema.pre("save", async function (next) {
  if (this.carbonEmission === 0 && this.quantity) {
    const { calculateEmissions } = require("../utility/emissionCalculator");

    try {
      const emission = await calculateEmissions(this);
      this.carbonEmission = emission.total;
      this.emissionFactorUsed = emission.factorUsed;
    } catch (error) {
      console.error("Error calculating emissions:", error);
    }
  }
  next();
});

module.exports = mongoose.model("Activity", activitySchema);
