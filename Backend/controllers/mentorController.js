
const UserModel = require("../models/userModel");
const MentorAccountModel = require("../models/mentorAccountModel");

const getAvailableMentors = async (req, res) => {
  try {
    const accounts = await MentorAccountModel.find({
      verificationStatus: "VERIFIED",
      payoutEnabled: true,
    }).select("mentorId");

    const mentorIds = accounts.map((account) => account.mentorId);

    const mentors = await UserModel.find({
      _id: { $in: mentorIds },
      role: "MENTOR",
      isActive: true,
    }).select("name email");

    return res.status(200).json({
      success: true,
      count: mentors.length,
      mentors,
    });
  } catch (error) {
    console.error("Get available mentors error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available mentors",
    });
  }
};

module.exports = { getAvailableMentors };