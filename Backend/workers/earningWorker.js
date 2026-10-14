
const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");

const EarningModel = require("../models/earningModel");
const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");
const MentorAccountModel = require("../models/mentorAccountModel");

const earningWorker = new Worker(
  "earning-eligibility",
  async () => {
    const now = new Date();

    const earnings = await EarningModel.find({
      state: "HOLDING",
      eligibleAt: { $ne: null, $lte: now },
    }).limit(100);

    let updated = 0;
    let held = 0;

    for (const earning of earnings) {
      try {
        const booking = await BookingModel.findOne({
          _id: earning.bookingId,
          mentorId: earning.mentorId,
          status: "COMPLETED",
          completedAt: { $ne: null },
          completionDisputedAt: null,
        }).lean();

        if (!booking) {
          held++;
          continue;
        }

        const payment = await PaymentModel.findOne({
          bookingId: earning.bookingId,
        })
          .sort({ createdAt: -1 })
          .lean();

        if (
          !payment ||
          payment.status !== "CAPTURED" ||
          payment.refundStatus !== "NOT_REQUESTED" ||
          (payment.refundAmountPaise || 0) > 0
        ) {
          held++;
          continue;
        }

        const mentorAccount = await MentorAccountModel.findOne({
          mentorId: earning.mentorId,
        }).lean();

        if (
          !mentorAccount ||
          mentorAccount.verificationStatus !== "VERIFIED" ||
          mentorAccount.payoutEnabled !== true
        ) {
          held++;
          continue;
        }

        const result = await EarningModel.updateOne(
          {
            _id: earning._id,
            state: "HOLDING",
            eligibleAt: { $ne: null, $lte: now },
          },
          {
            $set: {
              state: "ELIGIBLE",
              holdReason: null,
            },
          }
        );

        updated += result.modifiedCount;
      } catch (error) {
        console.error(
          `Could not process earning ${earning._id}:`,
          error.message
        );
      }
    }

    if (updated > 0 || held > 0) {
      console.log(
        `Earning worker: ${updated} eligible, ${held} held`
      );
    }

    return { updated, held };
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

earningWorker.on("completed", (job, result) => {
  console.log(`Earning eligibility job ${job.id} completed`, result);
});

earningWorker.on("failed", (job, error) => {
  console.error(
    `Earning eligibility job ${job?.id} failed:`,
    error.message
  );
});

module.exports = earningWorker;
