const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "individual",
        "departmental",
        "institutional",
        "comparative",
        "trend",
        "compliance",
        "custom",
      ],
    },
    format: {
      type: String,
      enum: ["pdf", "excel", "csv", "json"],
      default: "pdf",
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    department: String,
    scope: {
      type: String,
      enum: ["individual", "department", "institution", "multi-institution"],
      default: "individual",
    },
    data: {
      totalEmissions: {
        type: Number,
        default: 0,
      },
      emissionsByCategory: mongoose.Schema.Types.Mixed,
      emissionsByScope: {
        scope1: Number,
        scope2: Number,
        scope3: Number,
      },
      trends: mongoose.Schema.Types.Mixed,
      comparisons: mongoose.Schema.Types.Mixed,
      recommendations: [String],
      metadata: mongoose.Schema.Types.Mixed,
    },
    statistics: {
      totalActivities: Number,
      averageDailyEmissions: Number,
      peakEmissionDate: Date,
      peakEmissionValue: Number,
      reductionFromBaseline: Number,
      reductionPercentage: Number,
    },
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloaded: Date,
    expiresAt: Date,
    isPublic: {
      type: Boolean,
      default: false,
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ institutionId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ "period.startDate": 1, "period.endDate": 1 });

reportSchema.methods.incrementDownload = function () {
  this.downloadCount += 1;
  this.lastDownloaded = new Date();
  return this.save();
};

reportSchema.statics.cleanupExpiredReports = async function () {
  const now = new Date();
  const expiredReports = await this.find({
    expiresAt: { $lt: now },
  });

  for (const report of expiredReports) {
    if (report.fileUrl) {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(__dirname, "..", report.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  return this.deleteMany({ expiresAt: { $lt: now } });
};

module.exports = mongoose.model("Report", reportSchema);
