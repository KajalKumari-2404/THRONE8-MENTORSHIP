
const { Worker } = require("bullmq");
const redisConnection = require("../config/redis");
const EarningModel = require("../models/earningModel");

const earningWorker = new Worker(
  "earning-eligibility",
  async () => {
    const now = new Date();

    const result = await EarningModel.updateMany(
      {
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

    if (result.modifiedCount > 0) {
      console.log(
        `Earning worker: ${result.modifiedCount} earning(s) are now ELIGIBLE`
      );
    }

    return { updated: result.modifiedCount };
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
  console.error(`Earning eligibility job ${job?.id} failed:`, error.message);
});

module.exports = earningWorker;