const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
// require("dotenv").config();
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const BookingModel = require("./models/bookingModel");
const EarningModel = require("./models/earningModel");
const UserModel = require("./models/userModel");

const runTest = async () => {
  try {
    // if (process.env.NODE_ENV !== "development") {
    //   throw new Error("Test setup allowed only in development");
    // }

    if (
  process.env.NODE_ENV !== "development" &&
  process.env.NODE_ENV !== "test"
) {
  throw new Error("Test setup allowed only in development/test");
}

    if (process.env.ALLOW_SESSION_TEST_SETUP !== "true") {
      throw new Error(
        "Set ALLOW_SESSION_TEST_SETUP=true in .env"
      );
    }

    if (!process.env.MONGO_TEST_URI) {
      throw new Error("MONGO_TEST_URI is missing in .env");
    }

    await mongoose.connect(process.env.MONGO_TEST_URI);

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error(
        `Wrong database: ${mongoose.connection.name}. Expected throne8_test.`
      );
    }

    console.log("Connected to:", mongoose.connection.name);

    const uniqueId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const hashedPassword = await bcrypt.hash(
      `TestOnly-${uniqueId}-Password`,
      10
    );

    const student = await UserModel.create({
      name: "Test Student",
      email: `student-${uniqueId}@example.com`,
      password: hashedPassword,
      role: "STUDENT",
    });

    const mentor = await UserModel.create({
      name: "Test Mentor",
      email: `mentor-${uniqueId}@example.com`,
      password: hashedPassword,
      role: "MENTOR",
    });

    const now = Date.now();

    const booking = await BookingModel.create({
      studentId: student._id,
      mentorId: mentor._id,
      slotStart: new Date(now - 2 * 60 * 60 * 1000),
      slotEnd: new Date(now - 60 * 60 * 1000),
      pricePaise: 100000,
      currency: "INR",
      status: "CONFIRMED",
      holdExpiresAt: new Date(now - 3 * 60 * 60 * 1000),
      commissionRateBps: 2000,
      commissionPaise: 20000,
      mentorGrossPaise: 80000,
    });

    await EarningModel.create({
      bookingId: booking._id,
      mentorId: mentor._id,
      grossPaise: 100000,
      commissionPaise: 20000,
      payablePaise: 80000,
      state: "PENDING_SESSION",
      eligibleAt: null,
      holdReason: null,
    });

    console.log("TEST SETUP SUCCESSFUL");
    console.log("Test booking ID:", booking._id.toString());
    console.log("Test student ID:", student._id.toString());
    console.log("Test mentor ID:", mentor._id.toString());
    console.log("Database:", mongoose.connection.name);
  } catch (error) {
    console.error("Test setup failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
};

runTest();