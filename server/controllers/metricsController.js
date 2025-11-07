const User = require("../models/user");
const Activity = require("../models/activity");
const { asyncHandler } = require("../middleware/errorHandler");

exports.getPublicMetrics = asyncHandler(async (req, res) => {
  const [userCount, activityAgg] = await Promise.all([
    User.countDocuments({ isDeleted: false }),
    Activity.aggregate([
      { $group: { _id: null, totalEmissions: { $sum: "$carbonEmission" }, totalActivities: { $sum: 1 } } },
    ]),
  ]);
  const totals = activityAgg[0] || { totalEmissions: 0, totalActivities: 0 };
  res.status(200).json({
    success: true,
    data: {
      users: userCount,
      activities: totals.totalActivities,
      emissions: Number((totals.totalEmissions).toFixed(2)),
    },
  });
});
