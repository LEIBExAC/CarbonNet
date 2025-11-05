const Institution = require("../models/institution");
const Activity = require("../models/activity");
const User = require("../models/user");
const { asyncHandler } = require("../middleware/errorHandler");
const {
  calculateInstitutionalEmissions,
} = require("../utility/emissionCalculator");
const mongoose = require("mongoose");

/**
 * @desc    Create a new institution
 * @route   POST institutions
 * @access  Private/SuperAdmin
 */
exports.createInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.create(req.body);

  res.status(201).json({
    success: true,
    message: "Institution created successfully",
    data: { institution },
  });
});

/**
 * @desc    Get all institutions
 * @route   GET institutions
 * @access  Private/Admin
 */
exports.getAllInstitutions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, type, isActive } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { code: { $regex: search, $options: "i" } },
    ];
  }

  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const institutions = await Institution.find(query)
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ createdAt: -1 });

  const count = await Institution.countDocuments(query);

  res.status(200).json({
    success: true,
    data: {
      institutions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalInstitutions: count,
    },
  });
});

/**
 * @desc    Get single institution
 * @route   GET institutions/:id
 * @access  Private
 */
exports.getInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  // User count
  const userCount = await User.countDocuments({
    institutionId: institution._id,
    isDeleted: false,
  });

  res.status(200).json({
    success: true,
    data: {
      institution,
      userCount,
    },
  });
});

/**
 * @desc    Update institution
 * @route   PUT institutions/:id
 * @access  Private/Admin
 */
exports.updateInstitution = asyncHandler(async (req, res) => {
  let institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  institution = await Institution.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Institution updated successfully",
    data: { institution },
  });
});

/**
 * @desc    Soft delete institution
 * @route   DELETE institutions/:id
 * @access  Private/SuperAdmin
 */
exports.deleteInstitution = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  const userCount = await User.countDocuments({
    institutionId: institution._id,
    isDeleted: false,
  });

  // Prevent delete if the institution has active users, will update later to reassign users.
  if (userCount > 0) {
    return res.status(400).json({
      success: false,
      message: "Cannot delete institution with active users",
    });
  }

  institution.isDeleted = true;
  institution.isActive = false;
  institution.deletedAt = new Date();

  await institution.save();

  res.status(200).json({
    success: true,
    message: "Institution soft deleted successfully",
  });
});

/**
 * @desc    Get institution dashboard data
 * @route   GET institutions/:id/dashboard
 * @access  Private/Admin
 */
exports.getInstitutionDashboard = asyncHandler(async (req, res) => {
  const institutionId = req.params.id;
  const { startDate, endDate } = req.query;

  const start = startDate
    ? new Date(startDate)
    : new Date(new Date().getFullYear(), 0, 1);
  const end = endDate ? new Date(endDate) : new Date();

  const emissionSummary = await calculateInstitutionalEmissions(
    institutionId,
    start,
    end
  );

  const totalUsers = await User.countDocuments({
    institutionId,
    isDeleted: false,
  });
  const activeUsers = await User.countDocuments({
    institutionId,
    status: "active",
    isDeleted: false,
  });

  const userBreakdown = await User.aggregate([
    {
      $match: {
        institutionId: mongoose.Types.ObjectId.createFromTime(institutionId),
        isDeleted: false,
      },
    },
    { $group: { _id: "$userType", count: { $sum: 1 } } },
  ]);

  const topContributors = await Activity.aggregate([
    {
      $match: {
        institutionId: mongoose.Types.ObjectId.createFromTime(institutionId),
        activityDate: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalEmissions: { $sum: "$carbonEmission" },
        activityCount: { $sum: 1 },
      },
    },
    { $sort: { totalEmissions: -1 } },
    { $limit: 10 },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        name: "$user.name",
        userType: "$user.userType",
        totalEmissions: 1,
        activityCount: 1,
      },
    },
  ]);

  const monthlyTrends = await Activity.aggregate([
    {
      $match: {
        institutionId: require("mongoose").Types.ObjectId(institutionId),
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

  res.status(200).json({
    success: true,
    data: {
      emissionSummary,
      users: {
        total: totalUsers,
        active: activeUsers,
        breakdown: userBreakdown,
      },
      topContributors,
      monthlyTrends,
      period: { start, end },
    },
  });
});

/**
 * @desc    Get departments of an institution
 * @route   GET institutions/:id/departments
 * @access  Private
 */
exports.getDepartments = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  res.status(200).json({
    success: true,
    data: {
      departments: institution.departments || [],
    },
  });
});

/**
 * @desc    Add a department to an institution
 * @route   POST institutions/:id/departments
 * @access  Private/Admin
 */
exports.addDepartment = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  const { name, code, head, contactEmail } = req.body;

  institution.departments.push({ name, code, head, contactEmail });
  await institution.save();

  res.status(201).json({
    success: true,
    message: "Department added successfully",
    data: { institution },
  });
});

/**
 * @desc    Update institution emission factors
 * @route   PUT institutions/:id/emission-factors
 * @access  Private/Admin
 */
exports.updateEmissionFactors = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  const { customEmissionFactors } = req.body;

  institution.customEmissionFactors = customEmissionFactors;
  await institution.save();

  res.status(200).json({
    success: true,
    message: "Emission factors updated successfully",
    data: { institution },
  });
});

/**
 * @desc  Add admin to the Institution
 * @route PUT institutions/:id/add-admin
 * @access Private/SuperAdmin
 */
exports.addInstitutionAdmin = asyncHandler(async (req, res) => {
  const institution = await Institution.findById(req.params.id);

  if (!institution) {
    return res.status(404).json({
      success: false,
      message: "Institution not found",
    });
  }

  const { adminId } = req.body;

  if (!adminId) {
    return res.status(400).json({
      success: false,
      message: "Admin ID is required",
    });
  }

  const admin = await User.findOne(
    { _id: adminId, isDeleted: false },
    { userType: 1, institutionId: 1 }
  );
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: "Admin user not found",
    });
  }

  if (
    !admin.institutionId ||
    admin.institutionId.toString() !== institution._id.toString()
  ) {
    return res.status(400).json({
      success: false,
      message: "User does not belong to this institution",
    });
  }

  if (institution.admins.includes(adminId)) {
    return res.status(400).json({
      success: false,
      message: "User is already an admin of this institution",
    });
  }
  
  institution.admins.addToSet(adminId);
  await institution.save();

  res.status(200).json({
    success: true,
    message: "Admin added successfully",
    data: { institution },
  });
});

/**
 * @desc    Get institutions where current user is an admin
 * @route   GET institutions/my-institutions
 * @access  Private/Admin
 */
exports.getMyInstitutions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const institutions = await Institution.find({
    admins: userId,
    isDeleted: false,
  })
    .populate("admins", "name email")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: {
      institutions,
      count: institutions.length,
    },
  });
});