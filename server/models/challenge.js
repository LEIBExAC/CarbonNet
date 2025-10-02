const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "transportation",
        "electricity",
        "food",
        "waste",
        "water",
        "general",
        "all",
      ],
      default: "general",
    },
    type: {
      type: String,
      enum: ["reduction", "streak", "milestone", "competition", "awareness"],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    points: {
      type: Number,
      required: true,
      default: 100,
    },
    badge: {
      name: String,
      icon: String,
      color: String,
    },
    target: {
      metric: String,
      value: Number,
      unit: String,
    },
    duration: {
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
    scope: {
      type: String,
      enum: ["individual", "department", "institution", "global"],
      default: "individual",
    },
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        progress: {
          type: Number,
          default: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      },
    ],
    rules: {
      maxParticipants: Number,
      minParticipants: Number,
      eligibleUserTypes: [
        {
          type: String,
          enum: ["regularUser", "student", "faculty", "staff", "all"],
        },
      ],
      repeatParticipation: {
        type: Boolean,
        default: false,
      },
    },
    rewards: [
      {
        rank: Number,
        points: Number,
        badge: String,
        description: String,
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

challengeSchema.virtual("participantCount").get(function () {
  return this.participants ? this.participants.length : 0;
});

challengeSchema.virtual("completionRate").get(function () {
  if (!this.participants || this.participants.length === 0) return 0;
  const completed = this.participants.filter((p) => p.completed).length;
  return (completed / this.participants.length) * 100;
});

challengeSchema.index({ institutionId: 1, isActive: 1 });
challengeSchema.index({ "duration.startDate": 1, "duration.endDate": 1 });
challengeSchema.index({ category: 1, type: 1 });

challengeSchema.methods.addParticipant = function (userId) {
  const exists = this.participants.some((p) => p.userId.equals(userId));
  if (exists) {
    throw new Error("User already participating in this challenge");
  }

  this.participants.push({ userId });
  return this.save();
};

challengeSchema.methods.updateProgress = function (userId, progress) {
  const participant = this.participants.find((p) => p.userId.equals(userId));
  if (!participant) {
    throw new Error("User not participating in this challenge");
  }

  participant.progress = progress;

  if (this.target && progress >= this.target.value) {
    participant.completed = true;
    participant.completedAt = new Date();
  }

  return this.save();
};

challengeSchema.statics.getActiveChallenges = function (filters = {}) {
  const now = new Date();
  return this.find({
    ...filters,
    isActive: true,
    "duration.startDate": { $lte: now },
    "duration.endDate": { $gte: now },
  }).sort({ featured: -1, createdAt: -1 });
};

module.exports = mongoose.model("Challenge", challengeSchema);
