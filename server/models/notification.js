const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "success", "warning", "alert"],
      default: "info",
    },
    read: { type: Boolean, default: false },
    actionUrl: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);
