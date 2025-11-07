const Challenge = require("../models/challenge");
const User = require("../models/user");
const { asyncHandler } = require("../middleware/errorHandler");

/**
 * @desc    Create new challenge
 * @route   POST /challenges
 * @access  Private/Admin
 */
exports.createChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.create({
    ...req.body,
    createdBy: req.user.id,
    institutionId: req.user.institutionId,
  });

  res.status(201).json({
    success: true,
    message: "Challenge created successfully",
    data: { challenge },
  });
});

/**
 * @desc    Get all challenges with pagination and filtering
 * @route   GET /challenges
 * @access  Private
 */
exports.getAllChallenges = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    type,
    isActive,
    featured,
  } = req.query;

  const query = {};

  if (category) query.category = category;
  if (type) query.type = type;
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (featured !== undefined) query.featured = featured === "true";

  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    query.$or = [
      { institutionId: req.user.institutionId },
      { scope: "global" },
    ];
  }

  const challenges = await Challenge.find(query)
    .populate("createdBy", "name email")
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .sort({ featured: -1, createdAt: -1 });

  const count = await Challenge.countDocuments(query);

  const enrichedChallenges = challenges.map((challenge) => {
    const challengeObj = challenge.toObject();
    challengeObj.participantCount = challenge.participants.length;
    challengeObj.isJoined = challenge.participants.some(
      (p) => p.userId.toString() === req.user.id
    );
    return challengeObj;
  });

  res.status(200).json({
    success: true,
    data: {
      challenges: enrichedChallenges,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      totalChallenges: count,
    },
  });
});

/**
 * @desc    Get active challenges
 * @route   GET /challenges/active
 * @access  Private
 */
exports.getActiveChallenges = asyncHandler(async (req, res) => {
  const filters = {};

  if (req.user.institutionId) {
    filters.$or = [
      { institutionId: req.user.institutionId },
      { scope: "global" },
    ];
  }

  const challenges = await Challenge.getActiveChallenges(filters);

  const enrichedChallenges = challenges.map((challenge) => {
    const challengeObj = challenge.toObject();
    challengeObj.participantCount = challenge.participants.length;
    challengeObj.isJoined = challenge.participants.some(
      (p) => p.userId.toString() === req.user.id
    );
    return challengeObj;
  });

  res.status(200).json({
    success: true,
    data: { challenges: enrichedChallenges },
  });
});

/**
 * @desc    Get single challenge
 * @route   GET /challenges/:id
 * @access  Private
 */
exports.getChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id)
    .populate("createdBy", "name email")
    .populate("participants.userId", "name userType");

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  res.status(200).json({
    success: true,
    data: { challenge },
  });
});

/**
 * @desc    Update challenge
 * @route   PUT /challenges/:id
 * @access  Private/Admin
 */
exports.updateChallenge = asyncHandler(async (req, res) => {
  let challenge = await Challenge.findById(req.params.id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    message: "Challenge updated successfully",
    data: { challenge },
  });
});

/**
 * @desc    Delete challenge
 * @route   DELETE /challenges/:id
 * @access  Private/Admin
 */
exports.deleteChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  await challenge.deleteOne();

  res.status(200).json({
    success: true,
    message: "Challenge deleted successfully",
  });
});

/**
 * @desc    Join a challenge
 * @route   POST /challenges/:id/join
 * @access  Private
 */
exports.joinChallenge = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  if (!challenge.isActive) {
    return res.status(400).json({
      success: false,
      message: "Challenge is not active",
    });
  }

  if (new Date() < challenge.duration.startDate) {
    return res.status(400).json({
      success: false,
      message: "Challenge has not started yet",
    });
  }

  if (new Date() > challenge.duration.endDate) {
    return res.status(400).json({
      success: false,
      message: "Challenge has already ended",
    });
  }

  if (
    challenge.rules.maxParticipants &&
    challenge.participants.length >= challenge.rules.maxParticipants
  ) {
    return res.status(400).json({
      success: false,
      message: "Challenge is full",
    });
  }

  try {
    await challenge.addParticipant(req.user.id);

    await User.findByIdAndUpdate(req.user.id, {
      $inc: { totalPoints: 5 },
    });

    res.status(200).json({
      success: true,
      message: "Successfully joined the challenge",
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Update challenge progress
 * @route   PUT /challenges/:id/progress
 * @access  Private
 */
exports.updateProgress = asyncHandler(async (req, res) => {
  const { progress } = req.body;
  const challenge = await Challenge.findById(req.params.id);

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  try {
    await challenge.updateProgress(req.user.id, progress);

    const participant = challenge.participants.find((p) =>
      p.userId.equals(req.user.id)
    );
    if (participant && participant.completed) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalPoints: challenge.points },
      });

      res.status(200).json({
        success: true,
        message: "Challenge completed! Points awarded.",
        data: { challenge, completed: true },
      });
    } else {
      res.status(200).json({
        success: true,
        message: "Progress updated successfully",
        data: { challenge, completed: false },
      });
    }
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @desc    Get user's challenges with stats
 * @route   GET /challenges/my-challenges
 * @access  Private
 */
exports.getMyChallenges = asyncHandler(async (req, res) => {
  const challenges = await Challenge.find({
    "participants.userId": req.user.id,
  }).populate("createdBy", "name email");

  const stats = {
    total: challenges.length,
    active: 0,
    completed: 0,
    totalPoints: 0,
  };

  const enrichedChallenges = challenges.map((challenge) => {
    const challengeObj = challenge.toObject();
    challengeObj.participantCount = challenge.participants.length;
    challengeObj.isJoined = true;
    
    const participant = challenge.participants.find((p) =>
      p.userId.equals(req.user.id)
    );
    if (participant) {
      if (participant.completed) {
        stats.completed++;
        stats.totalPoints += challenge.points;
      } else if (
        challenge.isActive &&
        new Date() <= challenge.duration.endDate
      ) {
        stats.active++;
      }
    }
    
    return challengeObj;
  });

  res.status(200).json({
    success: true,
    data: {
      challenges: enrichedChallenges,
      stats,
    },
  });
});

/**
 * @desc    Get challenge leaderboard
 * @route   GET /challenges/:id/leaderboard
 * @access  Private
 */
exports.getChallengeLeaderboard = asyncHandler(async (req, res) => {
  const challenge = await Challenge.findById(req.params.id).populate(
    "participants.userId",
    "name userType totalPoints"
  );

  if (!challenge) {
    return res.status(404).json({
      success: false,
      message: "Challenge not found",
    });
  }

  const leaderboard = challenge.participants
    .sort((a, b) => b.progress - a.progress)
    .map((participant, index) => ({
      rank: index + 1,
      user: participant.userId,
      progress: participant.progress,
      completed: participant.completed,
      completedAt: participant.completedAt,
    }));

  res.status(200).json({
    success: true,
    data: { leaderboard },
  });
});
