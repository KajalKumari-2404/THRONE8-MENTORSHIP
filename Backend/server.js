
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const connectDB = require("./config/db");
const redisConnection = require("./config/redis");
const { Queue } = require("bullmq");
const earningWorker = require("./workers/earningWorker");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const earningQueue = new Queue("earning-eligibility", {
  connection: redisConnection,
});

const startServer = async () => {
  try {
    await connectDB();

    await earningQueue.upsertJobScheduler(
      "earning-eligibility-scheduler",
      { every: 60 * 1000 },
      {
        name: "check-eligible-earnings",
        data: {},
      }
    );

    console.log("Earning eligibility scheduler started");

    app.listen(PORT, () => {
      console.log(`THRONE8 server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("Shutting down THRONE8...");
  await earningWorker.close();
  await earningQueue.close();
  await redisConnection.quit();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();














































































// const dns = require("node:dns");
// dns.setServers(["8.8.8.8", "1.1.1.1"]);
// const dotenv = require("dotenv");
// dotenv.config();

// const connectDB = require("./config/db");
// const app = require("./app");

// const PORT = process.env.PORT || 5000;

// const startServer = async () => {
//   try {
//     await connectDB();

//     app.listen(PORT, () => {
//       console.log(`THRONE8 server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error("Server startup failed:", error.message);
//     process.exit(1);
//   }
// };

// startServer();