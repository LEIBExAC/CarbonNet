const mongoose = require("mongoose");

const emissionFactorSchema = new mongoose.Schema(
  {
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
        "fuel",
        "other",
      ],
    },
    subcategory: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    factor: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    emissionUnit: {
      type: String,
      default: "kg CO2e",
    },
    scope: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },
    source: {
      type: String,
      required: true,
      enum: ["DEFRA", "IPCC", "GHG_PROTOCOL", "EPA", "CUSTOM", "OTHER"],
    },
    sourceYear: {
      type: Number,
    },
    region: {
      type: String,
      default: "IN",
    },
    version: {
      type: String,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
    },
    customFactor: {
      type: Boolean,
      default: false,
    },
    metadata: {
      methodology: String,
      assumptions: String,
      uncertaintyRange: {
        min: Number,
        max: Number,
      },
      references: [
        {
          title: String,
          url: String,
        },
      ],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

emissionFactorSchema.index({ category: 1, subcategory: 1, isActive: 1 });
emissionFactorSchema.index({ source: 1, validFrom: -1 });
emissionFactorSchema.index({ institutionId: 1 });

emissionFactorSchema.statics.getActiveFactor = async function (
  category,
  subcategory,
  date = new Date()
) {
  return this.findOne({
    category,
    subcategory,
    isActive: true,
    validFrom: { $lte: date },
    $or: [{ validUntil: { $exists: false } }, { validUntil: { $gte: date } }],
  }).sort({ validFrom: -1 });
};

emissionFactorSchema.statics.getFactorForInstitution = async function (
  category,
  subcategory,
  institutionId,
  date = new Date()
) {
  if (institutionId) {
    const institutionFactor = await this.findOne({
      category,
      subcategory,
      institutionId,
      isActive: true,
      validFrom: { $lte: date },
      $or: [{ validUntil: { $exists: false } }, { validUntil: { $gte: date } }],
    }).sort({ validFrom: -1 });

    if (institutionFactor) return institutionFactor;
  }

  return this.getActiveFactor(category, subcategory, date);
};

module.exports = mongoose.model("EmissionFactor", emissionFactorSchema);
