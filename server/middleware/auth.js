const jwt = require("jsonwebtoken");
const User = require("../models/user");

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route. Please login.",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select("-password");

      if (!user) {
        return res.status(401).json({
          success: false,
          message: "User no longer exists",
        });
      }

      if (user.status !== "active" && user.status !== "pending") {
        return res.status(403).json({
          success: false,
          message: "Your account has been suspended or deleted",
        });
      }

      if (user.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          success: false,
          message: "Password recently changed. Please login again.",
        });
      }

      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please login again.",
      });
    }
  } catch (error) {
    next(error);
  }
};

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};

exports.verifyEmail = async (req, res, next) => {
  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email to access this feature",
    });
  }
  next();
};

exports.requireInstitution = async (req, res, next) => {
  if (!req.user.institutionId) {
    return res.status(403).json({
      success: false,
      message:
        "You must be associated with an institution to access this feature",
    });
  }
  next();
};

exports.checkAccountLock = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (user.isLocked) {
    const lockTimeRemaining = Math.ceil(
      (user.lockUntil - Date.now()) / (1000 * 60)
    );
    return res.status(423).json({
      success: false,
      message: `Account temporarily locked. Please try again in ${lockTimeRemaining} minutes.`,
    });
  }

  next();
};

// Optional auth - doesn't fail if no token
exports.optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // Token invalid, but continue without user
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Verify token for password reset/email verification
exports.verifyToken = (tokenType) => {
  return async (req, res, next) => {
    try {
      const token = req.params.token || req.body.token;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: "Token is required",
        });
      }

      const tokenField =
        tokenType === "reset" ? "resetPasswordToken" : "verificationToken";
      const expiresField =
        tokenType === "reset"
          ? "resetPasswordExpiresAt"
          : "verificationTokenExpiresAt";

      const user = await User.findOne({
        [tokenField]: token,
        [expiresField]: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired token",
        });
      }

      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};
