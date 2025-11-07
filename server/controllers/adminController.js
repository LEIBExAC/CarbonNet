const User = require("../models/user");
const Activity = require("../models/activity");
const Institution = require("../models/institution");
const Challenge = require("../models/challenge");
const EmissionFactor = require("../models/emissionFactor");

/**
 * @desc    Get admin dashboard statistics
 * @route   GET /admin/dashboard
 * @access  Private/Admin
 */
exports.getDashboardStats = async (req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalUsers = await User.countDocuments({ isDeleted: false });
  const activeUsers = await User.countDocuments({
    status: "active",
    isDeleted: false,
  });
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: startOfMonth },
    isDeleted: false,
  });

  const totalActivities = await Activity.countDocuments();
  const activitiesThisMonth = await Activity.countDocuments({
    activityDate: { $gte: startOfMonth },
  });

  const totalInstitutions = await Institution.countDocuments({
    isActive: true,
  });

  const activeChallenges = await Challenge.countDocuments({
    isActive: true,
    "duration.startDate": { $lte: now },
    "duration.endDate": { $gte: now },
  });

  const emissionStats = await Activity.aggregate([
    {
      $group: {
        _id: null,
        totalEmissions: { $sum: "$carbonEmission" },
        avgEmissions: { $avg: "$carbonEmission" },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
      },
      activities: {
        total: totalActivities,
        thisMonth: activitiesThisMonth,
      },
      institutions: {
        total: totalInstitutions,
      },
      challenges: {
        active: activeChallenges,
      },
      emissions: {
        total: emissionStats[0]?.totalEmissions || 0,
        average: emissionStats[0]?.avgEmissions || 0,
      },
    },
  });
};

/**
 * @desc    Get system analytics
 * @route   GET /admin/analytics
 * @access  Private/Admin
 */
exports.getAnalytics = async (req, res) => {
  const { startDate, endDate } = req.query;

  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().setMonth(new Date().getMonth() - 6));
  const end = endDate ? new Date(endDate) : new Date();

  const monthlyTrend = await Activity.aggregate([
    {
      $match: {
        activityDate: { $gte: start, $lte: end },
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

  const categoryBreakdown = await Activity.aggregate([
    {
      $match: {
        activityDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$category",
        totalEmissions: { $sum: "$carbonEmission" },
        activityCount: { $sum: 1 },
      },
    },
    { $sort: { totalEmissions: -1 } },
  ]);

  res.status(200).json({
    success: true,
    data: {
      monthlyTrend,
      categoryBreakdown,
      period: { start, end },
    },
  });
};

/**
 * @desc    Get system logs
 * @route   GET /admin/logs
 * @access  Private/SuperAdmin
 * @note    This is yet to be implimented
 */
exports.getSystemLogs = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "System logs endpoint - to be implemented with logging service",
    data: { logs: [] },
  });
};

/**
 * @desc    Verify user account
 * @route   PUT /admin/users/:id/verify
 * @access  Private/Admin
 */
exports.verifyUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.emailVerified = true;
  user.status = "active";
  await user.save();

  res.status(200).json({
    success: true,
    message: "User verified successfully",
    data: { user },
  });
};

/**
 * @desc    Suspend user account
 * @route   PUT /admin/users/:id/suspend
 * @access  Private/Admin
 */
exports.suspendUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  user.status = "suspended";
  await user.save();

  res.status(200).json({
    success: true,
    message: "User suspended successfully",
    data: { user },
  });
};

/**
 * @desc    Bulk import emission factors
 * @route   POST /admin/emission-factors/bulk
 * @access  Private/SuperAdmin
 */
exports.bulkImportEmissionFactors = async (req, res) => {
  const { factors } = req.body;

  if (!Array.isArray(factors) || factors.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of emission factors",
    });
  }

  const created = await EmissionFactor.insertMany(
    factors.map((factor) => ({
      ...factor,
      createdBy: req.user.id,
    }))
  );

  res.status(201).json({
    success: true,
    message: `${created.length} emission factors imported successfully`,
    data: { count: created.length },
  });
};

/**
 * @desc    List emission factors with filters
 * @route   GET /admin/emission-factors
 * @access  Private/Admin (superadmin or admin)
 */
exports.listEmissionFactors = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    subcategory,
    source,
    isActive,
    institutionId,
    search = "",
  } = req.query;

  const query = {};
  if (category) query.category = category;
  if (subcategory) query.subcategory = { $regex: subcategory, $options: "i" };
  if (source) query.source = source;
  if (typeof isActive !== "undefined") query.isActive = isActive === "true";
  if (institutionId) query.institutionId = institutionId;
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { subcategory: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await EmissionFactor.countDocuments(query);
  const factors = await EmissionFactor.find(query)
    .populate("institutionId", "name code")
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      factors,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    },
  });
};

/**
 * @desc    Create emission factor
 * @route   POST /admin/emission-factors
 * @access  Private/Admin
 */
exports.createEmissionFactor = async (req, res) => {
  const data = req.body;
  if (!data.validFrom) data.validFrom = new Date();
  const factor = await EmissionFactor.create({
    ...data,
    createdBy: req.user.id,
    updatedBy: req.user.id,
  });
  res.status(201).json({ success: true, data: { factor } });
};

/**
 * @desc    Update emission factor
 * @route   PUT /admin/emission-factors/:id
 * @access  Private/Admin
 */
exports.updateEmissionFactor = async (req, res) => {
  const { id } = req.params;
  const existing = await EmissionFactor.findById(id);
  if (!existing) {
    return res
      .status(404)
      .json({ success: false, message: "Emission factor not found" });
  }
  const updated = await EmissionFactor.findByIdAndUpdate(
    id,
    { ...req.body, updatedBy: req.user.id },
    { new: true }
  );
  res.status(200).json({ success: true, data: { factor: updated } });
};

/**
 * @desc    Delete emission factor
 * @route   DELETE /admin/emission-factors/:id
 * @access  Private/SuperAdmin
 */
exports.deleteEmissionFactor = async (req, res) => {
  const { id } = req.params;
  const existing = await EmissionFactor.findById(id);
  if (!existing) {
    return res
      .status(404)
      .json({ success: false, message: "Emission factor not found" });
  }
  await existing.deleteOne();
  res.status(200).json({ success: true, message: "Emission factor deleted" });
};

/**
 * @desc    Get all users (superadmin only)
 * @route   GET /admin/users
 * @access  Private/SuperAdmin
 */
exports.getAllUsers = async (req, res) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    status = "all",
    role = "all",
    institutionId = "all",
  } = req.query;

  const query = { isDeleted: false };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (status !== "all") {
    query.status = status;
  }

  if (role !== "all") {
    query.role = role;
  }

  if (institutionId !== "all") {
    query.institutionId = institutionId;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await User.countDocuments(query);

  const users = await User.find(query)
    .select("-password")
    .populate("institutionId", "name code")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    },
  });
};

/**
 * @desc    Approve AI suggestion and persist as EmissionFactor
 * @route   POST /admin/suggestions/approve
 * @access  Private/Admin
 */
exports.approveAISuggestion = async (req, res) => {
  const {
    category,
    subcategory,
    description,
    factor,
    unit,
    emissionUnit,
    scope,
    institutionId,
    validFrom,
    validUntil,
    metadata,
  } = req.body;

  if (!category || !subcategory || !factor || !unit || !scope) {
    return res.status(400).json({
      success: false,
      message:
        "category, subcategory, factor, unit, and scope are required fields",
    });
  }

  const emissionFactor = await EmissionFactor.create({
    category,
    subcategory,
    description:
      description || `AI-approved factor for ${category}/${subcategory}`,
    factor: parseFloat(factor),
    unit,
    emissionUnit: emissionUnit || "kg CO2e",
    scope: parseInt(scope),
    source: "AI_APPROVED",
    sourceYear: new Date().getFullYear(),
    region: "IN",
    validFrom: validFrom ? new Date(validFrom) : new Date(),
    validUntil: validUntil ? new Date(validUntil) : null,
    isActive: true,
    institutionId: institutionId || req.user.institutionId || null,
    customFactor: true,
    metadata: metadata || {},
    createdBy: req.user.id,
  });

  res.status(201).json({
    success: true,
    message: "AI suggestion approved and saved as emission factor",
    data: { emissionFactor },
  });
};
