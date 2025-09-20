const User = require("../models/user");
const Activity = require("../models/activity");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Get user profile
 * @route   GET /users/profile
 * @access  Private
 */
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate(
    "institutionId",
    "name code"
  );

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /users/profile
 * @access  Private
 */
exports.updateProfile = asyncHandler(async (req, res) => {
  const {
    name,
    phoneNumber,
    department,
    enrollmentId,
    profileImage,
    preferences,
    carbonFootprintGoal,
  } = req.body;

  const user = await User.findById(req.user.id);

  if (name) user.name = name;
  if (phoneNumber) user.phoneNumber = phoneNumber;
  if (department) user.department = department;
  if (enrollmentId) user.enrollmentId = enrollmentId;
  if (profileImage) user.profileImage = profileImage;
  if (preferences) user.preferences = { ...user.preferences, ...preferences };
  if (carbonFootprintGoal) user.carbonFootprintGoal = carbonFootprintGoal;

  await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
  });
});

/**
 * @desc    Get user dashboard data
 * @route   GET /users/dashboard
 * @access  Private
 */
exports.getDashboard = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfYear = new Date(now.getFullYear(), 0, 1);

  const monthlyActivities = await Activity.find({
    userId,
    activityDate: { $gte: startOfMonth },
  });

  const yearlyActivities = await Activity.find({
    userId,
    activityDate: { $gte: startOfYear },
  });

  // Total emissions
  const monthlyEmissions = monthlyActivities.reduce(
    (sum, activity) => sum + activity.carbonEmission,
    0
  );
  const yearlyEmissions = yearlyActivities.reduce(
    (sum, activity) => sum + activity.carbonEmission,
    0
  );

  // Grouping by category
  const emissionsByCategory = {};
  monthlyActivities.forEach((activity) => {
    if (!emissionsByCategory[activity.category]) {
      emissionsByCategory[activity.category] = 0;
    }
    emissionsByCategory[activity.category] += activity.carbonEmission;
  });

  // Daily emissions for current month
  const dailyEmissions = {};
  monthlyActivities.forEach((activity) => {
    const date = activity.activityDate.toISOString().split("T")[0];
    if (!dailyEmissions[date]) {
      dailyEmissions[date] = 0;
    }
    dailyEmissions[date] += activity.carbonEmission;
  });

  // Averages
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const avgDailyEmissions = monthlyEmissions / daysInMonth;

  res.status(200).json({
    success: true,
    data: {
      summary: {
        monthlyEmissions: parseFloat(monthlyEmissions.toFixed(2)),
        yearlyEmissions: parseFloat(yearlyEmissions.toFixed(2)),
        avgDailyEmissions: parseFloat(avgDailyEmissions.toFixed(2)),
        totalActivities: monthlyActivities.length,
      },
      emissionsByCategory,
      dailyEmissions,
      recentActivities: monthlyActivities.slice(-10).reverse(),
    },
  });
});

/**
 * @desc    Get user carbon footprint statistics
 * @route   GET /users/statistics
 * @access  Private
 */
exports.getStatistics = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const query = { userId };
  if (startDate && endDate) {
    query.activityDate = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }

  const activities = await Activity.find(query).sort({ activityDate: 1 });

  const totalEmissions = activities.reduce(
    (sum, activity) => sum + activity.carbonEmission,
    0
  );

  // Grouping by category
  const byCategory = {};
  activities.forEach((activity) => {
    if (!byCategory[activity.category]) {
      byCategory[activity.category] = { count: 0, emissions: 0 };
    }
    byCategory[activity.category].count += 1;
    byCategory[activity.category].emissions += activity.carbonEmission;
  });

  // Monthly trend
  const monthlyTrend = {};
  activities.forEach((activity) => {
    const month = activity.activityDate.toISOString().slice(0, 7);
    if (!monthlyTrend[month]) {
      monthlyTrend[month] = 0;
    }
    monthlyTrend[month] += activity.carbonEmission;
  });

  res.status(200).json({
    success: true,
    data: {
      totalEmissions: parseFloat(totalEmissions.toFixed(2)),
      totalActivities: activities.length,
      byCategory,
      monthlyTrend,
      period: { startDate, endDate },
    },
  });
});

/**
 * @desc    Get user leaderboard ranking
 * @route   GET /users/leaderboard
 * @access  Private
 */
exports.getLeaderboard = asyncHandler(async (req, res) => {
  const { institutionId } = req.user;
  const { period = "month", limit = 10 } = req.query;

  const now = new Date();
  let startDate;

  if (period === "week") {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (period === "month") {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === "year") {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  // Aggregate emissions by user
  const leaderboard = await Activity.aggregate([
    {
      $match: {
        activityDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalEmissions: { $sum: "$carbonEmission" },
        activityCount: { $sum: 1 },
      },
    },
    {
      $sort: { totalEmissions: 1 },
    },
    {
      $limit: parseInt(limit),
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 1,
        name: "$user.name",
        userType: "$user.userType",
        totalEmissions: 1,
        activityCount: 1,
        totalPoints: "$user.totalPoints",
      },
    },
  ]);

  // Current user's rank
  const userRank =
    leaderboard.findIndex(
      (item) => item._id.toString() === req.user.id.toString()
    ) + 1;

  res.status(200).json({
    success: true,
    data: {
      leaderboard,
      currentUserRank: userRank || "Not ranked",
      period,
    },
  });
});

/**
 * @desc    Delete user account
 * @route   DELETE /users/account
 * @access  Private
 */
exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  user.isDeleted = true;
  user.status = "deleted";
  await user.save();

  res.status(200).json({
    success: true,
    message: "Account deleted successfully",
  });
});

/**
 * @desc    Get all users (Admin only)
 * @route   GET /users
 * @access  Private/Admin
 */
exports.getAllUsers = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search,
    role,
    status,
    institutionId,
  } = req.query;

  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (role) query.role = role;
  if (status) query.status = status;
  if (institutionId) query.institutionId = institutionId;

  const users = await User.find(query)
    .select("-password")
    .populate("institutionId", "name code")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await User.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      users,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalUsers: count,
    },
  });
});

/**
 * @desc    Update user (Admin only)
 * @route   PUT /users/:id
 * @access  Private/Admin
 * @note    This is what I talked about in the userController.js file, implimented here the role update functionality, but also kept there during regestration for now.
 */
exports.updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role, status, institutionId } = req.body;

  const user = await User.findById(id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (role) user.role = role;
  if (status) user.status = status;
  if (institutionId) user.institutionId = institutionId;

  await user.save();

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: { user },
  });
});
