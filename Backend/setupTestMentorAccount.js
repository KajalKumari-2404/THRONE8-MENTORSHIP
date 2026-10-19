require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const User = require("./models/userModel");
const MentorAccount = require("./models/mentorAccountModel");

(async () => {
  try {
    await connectDB();

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error("Safety check failed: not connected to throne8_test");
    }

    const mentor = await User.findOne({
      _id: "6acb4998e764a7b50b5143a7",
      role: "MENTOR",
      isActive: true,
    });

    if (!mentor) {
      throw new Error("Test mentor not found");
    }

    const existing = await MentorAccount.findOne({
      mentorId: mentor._id,
    });

    if (existing) {
      console.log("Mentor account already exists:", existing._id);
    } else {
      const account = await MentorAccount.create({
        mentorId: mentor._id,
        verificationStatus: "VERIFIED",
        payoutEnabled: true,
        verificationNotes: "Test-only account for sandbox payment testing",
      });

      console.log("Test mentor account created:", account._id);
    }
  } catch (error) {
    console.error("Setup failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
