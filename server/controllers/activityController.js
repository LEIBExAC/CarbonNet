const Activity = require("../models/activity");
const EmissionFactor = require("../models/emissionFactor");
const { asyncHandler } = require("../middleware/errorHandler");
const { calculateEmissions } = require("../utility/emissionCalculator");

/**
 * @desc    Preview emission calculation without saving
 * @route   POST /activities/estimate
 * @access  Private
 */
exports.estimateActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const institutionId = req.user.institutionId;

  const activityData = {
    ...req.body,
    userId,
    institutionId,
  };

  const emissionResult = await calculateEmissions(activityData);

  res.status(200).json({
    success: true,
    message: "Emission estimated successfully",
    data: {
      carbonEmission: emissionResult.total,
      emissionFactorUsed: emissionResult.factorUsed,
      activity: activityData,
    },
  });
});

/**
 * @desc    Create new activity
 * @route   POST /activities
 * @access  Private
 */
exports.createActivity = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const institutionId = req.user.institutionId;

  const activityData = {
    ...req.body,
    userId,
    institutionId,
    dataSource: "manual",
  };

  if (!activityData.carbonEmission || activityData.carbonEmission === 0) {
    const emissionResult = await calculateEmissions(activityData);
    activityData.carbonEmission = emissionResult.total;
    activityData.emissionFactorUsed = emissionResult.factorUsed;
  }

  const activity = await Activity.create(activityData);

  const User = require("../models/user");
  await User.findByIdAndUpdate(userId, {
    $inc: { totalPoints: 10 },
  });

  res.status(201).json({
    success: true,
    message: "Activity added successfully",
    data: { activity },
  });
});

/**
 * @desc    Get all activities with pagination and filtering
 * @route   GET /activities
 * @access  Private
 */
exports.getActivities = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    page = 1,
    limit = 20,
    category,
    startDate,
    endDate,
    sort = "-activityDate",
  } = req.query;

  const parsedLimit = parseInt(limit, 10);
  const parsedPage = parseInt(page, 10);

  const query = { userId };

  if (category) query.category = category;
  if (startDate || endDate) {
    query.activityDate = {};
    if (startDate) query.activityDate.$gte = new Date(startDate);
    if (endDate) query.activityDate.$lte = new Date(endDate);
  }

  const activities = await Activity.find(query)
    .sort(sort)
    .limit(parsedLimit)
    .skip((parsedPage - 1) * parsedLimit);

  const count = await Activity.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      activities,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      totalActivities: count,
    },
  });
});

/**
 * @desc    Get single activity by ID
 * @route   GET /activities/:id
 * @access  Private
 */
exports.getActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    return res.status(404).json({
      success: false,
      message: "Activity not found",
    });
  }

  if (activity.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to access this activity",
    });
  }

  res.status(200).json({
    success: true,
    data: { activity },
  });
});

/**
 * @desc    Update activity
 * @route   PUT /activities/:id
 * @access  Private
 */
exports.updateActivity = asyncHandler(async (req, res) => {
  let activity = await Activity.findById(req.params.id);

  if (!activity) {
    return res.status(404).json({
      success: false,
      message: "Activity not found",
    });
  }

  if (activity.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this activity",
    });
  }

  Object.assign(activity, req.body);

  // Recalculate emissions if quantity changed
  if (req.body.quantity || req.body.transportation || req.body.electricity) {
    const emissionResult = await calculateEmissions(activity);
    activity.carbonEmission = emissionResult.total;
    activity.emissionFactorUsed = emissionResult.factorUsed;
  }

  await activity.save();

  res.status(200).json({
    success: true,
    message: "Activity updated successfully",
    data: { activity },
  });
});

/**
 * @desc    Delete activity
 * @route   DELETE /activities/:id
 * @access  Private
 */
exports.deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity) {
    return res.status(404).json({
      success: false,
      message: "Activity not found",
    });
  }

  if (activity.userId.toString() !== req.user.id && req.user.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Not authorized to delete this activity",
    });
  }

  await activity.deleteOne();

  res.status(200).json({
    success: true,
    message: "Activity deleted successfully",
  });
});

/**
 * @desc    Bulk create activities
 * @route   POST /activities/bulk
 * @access  Private
 */
exports.bulkCreateActivities = asyncHandler(async (req, res) => {
  const { activities } = req.body;
  const userId = req.user.id;
  const institutionId = req.user.institutionId;

  if (!Array.isArray(activities) || activities.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of activities",
    });
  }

  const createdActivities = [];
  const errors = [];

  for (let i = 0; i < activities.length; i++) {
    try {
      const activityData = {
        ...activities[i],
        userId,
        institutionId,
        dataSource: "file_upload",
      };

      const emissionResult = await calculateEmissions(activityData);
      activityData.carbonEmission = emissionResult.total;
      activityData.emissionFactorUsed = emissionResult.factorUsed;

      const activity = await Activity.create(activityData);
      createdActivities.push(activity);
    } catch (error) {
      errors.push({
        index: i,
        data: activities[i],
        error: error.message,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `${createdActivities.length} activities created successfully`,
    data: {
      created: createdActivities.length,
      failed: errors.length,
      activities: createdActivities,
      errors,
    },
  });
});

/**
 * @desc    Get category-wise summary of activities
 * @route   GET /activities/summary/category
 * @access  Private
 */
exports.getCategorySummary = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { startDate, endDate } = req.query;

  const matchQuery = { userId };
  if (startDate || endDate) {
    matchQuery.activityDate = {};
    if (startDate) matchQuery.activityDate.$gte = new Date(startDate);
    if (endDate) matchQuery.activityDate.$lte = new Date(endDate);
  }

  const summary = await Activity.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: "$category",
        totalEmissions: { $sum: "$carbonEmission" },
        activityCount: { $sum: 1 },
        avgEmissions: { $avg: "$carbonEmission" },
      },
    },
    { $sort: { totalEmissions: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: { summary },
  });
});

/**
 * @desc    Get monthly trends of activities
 * @route   GET /activities/trends/monthly
 * @access  Private
 */
exports.getMonthlyTrends = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { months = 12 } = req.query;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - parseInt(months));

  const trends = await Activity.aggregate([
    {
      $match: {
        userId: require("mongoose").Types.ObjectId(userId),
        activityDate: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          year: { $year: "$activityDate" },
          month: { $month: "$activityDate" },
        },
        totalEmissions: { $sum: "$carbonEmission" },
        activityCount: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  res.status(200).json({
    success: true,
    data: { trends },
  });
});

/**
 * @desc    Get activity recommendations
 * @route   GET /activities/recommendations
 * @access  Private
 */
exports.getRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const activities = await Activity.find({
    userId,
    activityDate: { $gte: thirtyDaysAgo },
  });

  const categoryEmissions = {};
  activities.forEach((activity) => {
    if (!categoryEmissions[activity.category]) {
      categoryEmissions[activity.category] = 0;
    }
    categoryEmissions[activity.category] += activity.carbonEmission;
  });

  const recommendations = [];

  if (categoryEmissions.transportation > 100) {
    recommendations.push({
      category: "transportation",
      priority: "high",
      message:
        "Consider carpooling or using public transport to reduce your carbon footprint",
      potentialReduction: "30-50%",
    });
  }

  if (categoryEmissions.electricity > 50) {
    recommendations.push({
      category: "electricity",
      priority: "medium",
      message:
        "Switch to energy-efficient appliances and turn off unused devices",
      potentialReduction: "20-30%",
    });
  }

  if (categoryEmissions.food > 30) {
    recommendations.push({
      category: "food",
      priority: "medium",
      message: "Reduce food waste and consider plant-based meal options",
      potentialReduction: "15-25%",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      recommendations,
      totalEmissions: Object.values(categoryEmissions).reduce(
        (sum, val) => sum + val,
        0
      ),
      period: "30 days",
    },
  });
});
