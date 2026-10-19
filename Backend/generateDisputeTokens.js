const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const UserModel = require("./models/userModel");

const studentId = "6acb5591dfab8d20498c512f";
const mentorId = "6acb5592dfab8d20498c5130";

async function generateTokens() {
try {
if (process.env.NODE_ENV !== "development") {
throw new Error("Allowed only in development");
}

if (!process.env.MONGO_TEST_URI || !process.env.JWT_SECRET) {
  throw new Error("Test database or JWT configuration is missing");
}

await mongoose.connect(process.env.MONGO_TEST_URI);

if (mongoose.connection.name !== "throne8_test") {
  throw new Error(`Wrong database: ${mongoose.connection.name}`);
}

const student = await UserModel.findOne({
  _id: studentId,
  role: "STUDENT",
  isActive: true,
});

const mentor = await UserModel.findOne({
  _id: mentorId,
  role: "MENTOR",
  isActive: true,
});

if (!student || !mentor) {
  throw new Error("Test student or mentor missing/inactive");
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

console.log("Database:", mongoose.connection.name);
console.log("Student token generated successfully.");
console.log("Mentor token generated successfully.");
console.log("Copy tokens locally from the variables below if needed.");
console.log("STUDENT_ID:", student._id.toString());
console.log("MENTOR_ID:", mentor._id.toString());

// Print tokens locally for Postman testing.
console.log("STUDENT_JWT:", studentToken);
console.log("MENTOR_JWT:", mentorToken);

} catch (error) {
console.error("Token generation failed:", error.message);
process.exitCode = 1;
} finally {
if (mongoose.connection.readyState !== 0) {
await mongoose.disconnect();
}
}
}

generateTokens();
