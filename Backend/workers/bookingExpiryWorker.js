const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const BookingModel = require("../models/bookingModel");

const bookingExpiryWorker = new Worker(
  "booking-expiry",
  async () => {
    const now = new Date();

    const result = await BookingModel.updateMany(
      {
        status: "PENDING_PAYMENT",
        holdExpiresAt: { $lte: now },
      },
      {
        $set: { status: "EXPIRED" },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(
        `Booking expiry worker: ${result.modifiedCount} booking(s) marked EXPIRED`
      );
    }

    return { expired: result.modifiedCount };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

bookingExpiryWorker.on("completed", (job, result) => {
  if (result.expired > 0) {
    console.log(`Booking expiry job ${job.id} completed`, result);
  }
});

bookingExpiryWorker.on("failed", (job, error) => {
  console.error(`Booking expiry job ${job?.id} failed:`, error.message);
});

module.exports = bookingExpiryWorker;