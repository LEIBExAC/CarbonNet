const Notification = require("../models/notification");
const { asyncHandler } = require("../middleware/errorHandler");

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = { userId: req.user.id };
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Notification.countDocuments(query);
  res.status(200).json({
    success: true,
    data: {
      notifications,
      total,
      page: Number(page),
      totalPages: Math.ceil(total / limit),
      unreadCount: await Notification.countDocuments({ ...query, read: false }),
    },
  });
});

exports.markRead = asyncHandler(async (req, res) => {
  const notif = await Notification.findOne({ _id: req.params.id, userId: req.user.id });
  if (!notif) return res.status(404).json({ success: false, message: "Notification not found" });
  if (!notif.read) {
    notif.read = true;
    await notif.save();
  }
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.status(200).json({ success: true, data: { notification: notif, unreadCount } });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { $set: { read: true } });
  const unreadCount = await Notification.countDocuments({ userId: req.user.id, read: false });
  res.status(200).json({ success: true, message: "All notifications marked as read", data: { unreadCount } });
});

exports.createNotification = async ({ userId, title, message, type = "info", actionUrl, meta }) => {
  try {
    const doc = await Notification.create({ userId, title, message, type, actionUrl, meta });
    return doc;
  } catch (e) {
    console.error("Notification create failed", e.message);
  }
};
