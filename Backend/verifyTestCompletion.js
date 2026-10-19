
require("dotenv").config();

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const mongoose = require("mongoose");
const Booking = require("./models/bookingModel");
const Earning = require("./models/earningModel");

async function main() {
  try {
    const uri = new URL(process.env.MONGO_URI);
    uri.pathname = "/throne8_test";

    await mongoose.connect(uri.toString());

    console.log("Database:", mongoose.connection.name);

    const bookingId = "6acbe9f5ac1ea525fede532b";

    const booking = await Booking.findById(bookingId).lean();
    const earning = await Earning.findOne({ bookingId }).lean();

    console.log("\n--- BOOKING STATUS ---");
    console.log(
      booking
        ? {
            status: booking.status,
            completionRequestedAt: booking.completionRequestedAt,
            studentConfirmedAt: booking.studentConfirmedAt,
            payoutEligibleAt: booking.payoutEligibleAt,
          }
        : "Booking not found"
    );

    console.log("\n--- EARNING STATUS ---");
    console.log(
      earning
        ? {
            state: earning.state,
            grossPaise: earning.grossPaise,
            commissionPaise: earning.commissionPaise,
            payablePaise: earning.payablePaise,
            eligibleAt: earning.eligibleAt,
          }
        : "Earning not found"
    );
  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();