const User = require("../models/user");

const getProfile = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user,
  });
};

const updateProfile = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        institutionId: user.institutionId,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { getProfile, updateProfile };
