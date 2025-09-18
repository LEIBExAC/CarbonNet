const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["user", "admin", "superadmin"],
      default: "user",
    },
    institutionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "verified"],
      default: "pending",
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    lastLogin: {
      type: Date,
      default: null,
    },
    passwordChangedAt: Date,

    isDeleted: {
      type: Boolean,
      default: false,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};

userSchema.methods.updatePasswordChangedAt = function () {
  this.passwordChangedAt = new Date();
  return this.save();
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

module.exports = mongoose.model("User", userSchema);
