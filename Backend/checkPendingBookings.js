
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

const connectDB = require("./config/db");
const mongoose = require("mongoose");
const Booking = require("./models/bookingModel");
const Earning = require("./models/earningModel");

// const BOOKING_ID = "6acbb1d4f18ca57e44060525"
const BOOKING_ID = "6acbd43f82abfb2b08457237";

(async () => {
  try {
    await connectDB();

    console.log("Database:", mongoose.connection.name);

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error("Safety check failed: expected throne8_test");
    }

    const booking = await Booking.findById(BOOKING_ID)
      .select(
        "_id studentId mentorId status scheduledAt slotStart slotEnd completionRequestedAt studentConfirmedAt completedAt completionDisputedAt payoutEligibleAt"
      )
      .lean();

    const earning = await Earning.findOne({
      bookingId: BOOKING_ID,
    })
      .select(
        "_id bookingId mentorId grossPaise commissionPaise payablePaise state eligibleAt holdReason"
      )
      .lean();

    console.log(
      "BOOKING:",
      JSON.stringify(booking, null, 2)
    );

    console.log(
      "EARNING:",
      JSON.stringify(earning, null, 2)
    );
  } catch (error) {
    console.error("Error:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();