require("dotenv").config();
const connectDB = require("./config/db");
const User = require("./models/userModel");
const MentorAccount = require("./models/mentorAccountModel");
const mongoose = require("mongoose");

(async () => {
  try {
    await connectDB();

    const mentors = await User.find({
      role: "MENTOR",
      isActive: true
    }).select("_id name email role isActive").limit(5).lean();

    const accounts = await MentorAccount.find({})
      .select("mentorId verificationStatus payoutEnabled")
      .limit(10)
      .lean();

    console.log("ACTIVE MENTORS:", JSON.stringify(mentors, null, 2));
    console.log("MENTOR ACCOUNTS:", JSON.stringify(accounts, null, 2));
  } catch (error) {
    console.error(error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
