require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const connectDB = require("./config/db");

const Payment = require("./models/paymentModel");
const Booking = require("./models/bookingModel");
const Earning = require("./models/earningModel");
const LedgerEntry = require("./models/ledgerEntryModel");

const BOOKING_ID = "6acbb1d4f18ca57e44060525";

(async () => {
  try {
    await connectDB();

    if (mongoose.connection.name !== "throne8_test") {
      throw new Error("Safety check failed: not connected to throne8_test");
    }

    const booking = await Booking.findById(BOOKING_ID).lean();

    if (!booking) {
      throw new Error("Test booking not found");
    }

    const payment = await Payment.findOne({
      bookingId: booking._id,
      status: "CAPTURED",
    }).lean();

    const earning = await Earning.find({
      bookingId: booking._id,
    }).lean();

    const ledger = await LedgerEntry.find({
      bookingId: booking._id,
    }).sort({ createdAt: 1 }).lean();

    console.log("\n--- PAYMENT RECORD ---");
    console.log(
      JSON.stringify(
        payment
          ? {
              status: payment.status,
              amountPaise: payment.amountPaise,
              gatewayOrderId: payment.gatewayOrderId,
            }
          : null,
        null,
        2
      )
    );

    console.log("\n--- BOOKING STATUS ---");
    console.log(booking.status);

    console.log("\n--- EARNING RECORDS ---");
    console.log("Count:", earning.length);
    console.log(
      JSON.stringify(
        earning.map((item) => ({
          state: item.state,
          grossPaise: item.grossPaise,
          commissionPaise: item.commissionPaise,
          payablePaise: item.payablePaise,
        })),
        null,
        2
      )
    );

    console.log("\n--- LEDGER RECORDS ---");
    console.log("Count:", ledger.length);
    console.log(
      JSON.stringify(
        ledger.map((item) => ({
          entryType: item.entryType,
          account: item.account,
          direction: item.direction,
          amountPaise: item.amountPaise,
          eventKey: item.eventKey,
        })),
        null,
        2
      )
    );
  } catch (error) {
    console.error("Verification failed:", error.message);
  } finally {
    await mongoose.disconnect();
  }
})();