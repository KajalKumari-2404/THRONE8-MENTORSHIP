const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserModel = require("./models/userModel");
const BookingModel = require("./models/bookingModel");
const EarningModel = require("./models/earningModel");

async function prepareDisputeTest() {
try {
if (process.env.NODE_ENV !== "development") {
throw new Error("Test setup allowed only in development");
}

if (process.env.ALLOW_SESSION_TEST_SETUP !== "true") {
  throw new Error("ALLOW_SESSION_TEST_SETUP must be true");
}

if (!process.env.MONGO_TEST_URI) {
  throw new Error("MONGO_TEST_URI is missing");
}

await mongoose.connect(process.env.MONGO_TEST_URI);

if (mongoose.connection.name !== "throne8_test") {
  throw new Error(
    `Wrong database: ${mongoose.connection.name}`
  );
}

console.log("Connected database:", mongoose.connection.name);

const uniqueId = `${Date.now()}-${Math.random()
  .toString(36)
  .slice(2, 8)}`;

const password = `DisputeTest-${uniqueId}`;
const hashedPassword = await bcrypt.hash(password, 10);

const student = await UserModel.create({
  name: "Dispute Test Student",
  email: `dispute-student-${uniqueId}@example.com`,
  password: hashedPassword,
  role: "STUDENT",
});

const mentor = await UserModel.create({
  name: "Dispute Test Mentor",
  email: `dispute-mentor-${uniqueId}@example.com`,
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

console.log("DISPUTE TEST SETUP SUCCESSFUL");
console.log("Booking ID:", booking._id.toString());
console.log("Student ID:", student._id.toString());
console.log("Mentor ID:", mentor._id.toString());

} catch (error) {
console.error("Dispute test setup failed:", error.message);
process.exitCode = 1;
} finally {
if (mongoose.connection.readyState !== 0) {
await mongoose.disconnect();
}
}
}

prepareDisputeTest();
