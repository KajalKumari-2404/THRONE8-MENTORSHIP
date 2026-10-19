
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

// process.env.MONGO_URI = process.env.MONGO_TEST_URI;
process.env.MONGO_URI = process.env.MONGO_URI;

const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Earning = require("./models/earningModel");

(async () => {
  try {
    await connectDB();

    console.log("Database:", mongoose.connection.name);

    // if (mongoose.connection.name !== "throne8_test") {
    if (mongoose.connection.name !== "throne8") {
      throw new Error("Safety check failed: expected throne8_test");
    }

    const earnings = await Earning.find({
      state: "HOLDING",
    })
      .select(
        "_id bookingId mentorId grossPaise commissionPaise payablePaise state eligibleAt"
      )
      .lean();

    console.log("HOLDING EARNINGS:");
    console.log(JSON.stringify(earnings, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
