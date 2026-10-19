
require("dotenv").config();
const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const Booking = require("./models/bookingModel");
const Earning = require("./models/earningModel");

async function main() {
  try {
    // await mongoose.connect(process.env.MONGO_URI);
    const testUri = new URL(process.env.MONGO_URI);
testUri.pathname = "/throne8_test";

await mongoose.connect(testUri.toString());

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error(
        `Wrong database: ${mongoose.connection.name}. Aborting for safety.`
      );
    }

    const originalBookingId = "6acbb1d4f18ca57e44060525";

    const original = await Booking.findById(originalBookingId);

    if (!original) throw new Error("Original booking not found.");

    const testStart = new Date(Date.now() - 60 * 60 * 1000);
    const testEnd = new Date(Date.now() - 30 * 60 * 1000);

    const booking = await Booking.create({
      studentId: original.studentId,
      mentorId: original.mentorId,
      slotStart: testStart,
      slotEnd: testEnd,
      pricePaise: original.pricePaise,
      currency: "INR",
      status: "CONFIRMED",
      holdExpiresAt: testStart,
      commissionRateBps: original.commissionRateBps,
      commissionPaise: original.commissionPaise,
      mentorGrossPaise: original.mentorGrossPaise,
    });

    await Earning.create({
      bookingId: booking._id,
      mentorId: booking.mentorId,
      grossPaise: booking.mentorGrossPaise,
      commissionPaise: booking.commissionPaise,
      payablePaise:
        booking.mentorGrossPaise - booking.commissionPaise,
      state: "PENDING_SESSION",
    });

    console.log("TEST BOOKING CREATED:", booking._id.toString());
    console.log("TEST SLOT END:", booking.slotEnd.toISOString());
  } catch (error) {
    console.error("TEST SETUP FAILED:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();