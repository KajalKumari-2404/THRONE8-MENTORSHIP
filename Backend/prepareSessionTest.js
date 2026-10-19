
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const UserModel = require("./models/userModel");
const BookingModel = require("./models/bookingModel");
const EarningModel = require("./models/earningModel");

const TEST_BOOKING_ID = "6acbd43f82abfb2b08457237";

async function prepareSessionTest() {
  try {
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NODE_ENV !== "test"
    ) {
      throw new Error("Allowed only in test/development");
    }

    if (process.env.ALLOW_SESSION_TEST_SETUP !== "true") {
      throw new Error("Test setup flag is not enabled");
    }

    if (!process.env.MONGO_TEST_URI || !process.env.JWT_SECRET) {
      throw new Error("Test database or JWT configuration is missing");
    }

    await mongoose.connect(process.env.MONGO_TEST_URI);

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error(`Wrong database: ${mongoose.connection.name}`);
    }

    const booking = await BookingModel.findOne({
      _id: TEST_BOOKING_ID,
      status: "CONFIRMED",
      completionRequestedAt: null,
      studentConfirmedAt: null,
      completionDisputedAt: null,
    }).lean();

    if (!booking) {
      throw new Error("The specified test booking is not eligible");
    }

    const earning = await EarningModel.findOne({
      bookingId: booking._id,
      state: "PENDING_SESSION",
    }).lean();

    if (!earning) {
      throw new Error("Pending session earning not found");
    }

    const student = await UserModel.findOne({
      _id: booking.studentId,
      role: "STUDENT",
      isActive: true,
    }).select("_id role");

    const mentor = await UserModel.findOne({
      _id: booking.mentorId,
      role: "MENTOR",
      isActive: true,
    }).select("_id role");

    if (!student || !mentor) {
      throw new Error("Test student or mentor is missing/inactive");
    }

    const studentToken = jwt.sign(
      { userId: student._id, role: student.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    const mentorToken = jwt.sign(
      { userId: mentor._id, role: mentor.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("SESSION TEST READY");
    console.log("Database:", mongoose.connection.name);
    console.log("Booking ID:", booking._id.toString());
    console.log("Student ID:", student._id.toString());
    console.log("Mentor ID:", mentor._id.toString());
    console.log("Student JWT:", studentToken);
    console.log("Mentor JWT:", mentorToken);
    console.log("Existing passwords were not changed.");
  } catch (error) {
    console.error("Test preparation failed:", error.message);
    process.exitCode = 1;
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  }
}

prepareSessionTest();