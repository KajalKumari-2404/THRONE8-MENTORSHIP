require("dotenv").config();
const connectDB = require("./config/db");
const mongoose = require("mongoose");
const User = require("./models/userModel");

(async () => {
  try {
    await connectDB();

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error("Safety check failed: not connected to throne8_test");
    }

    const students = await User.find({ role: "STUDENT" })
      .select("_id name email role isActive")
      .limit(10)
      .lean();

    console.log("TEST STUDENTS:", JSON.stringify(students, null, 2));
  } catch (error) {
    console.error("Check failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
})();
