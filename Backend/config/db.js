
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // const mongoURI = process.env.MONGO_URI;

    const mongoURI =
  process.env.NODE_ENV === "test"
    ? process.env.MONGO_TEST_URI
    : process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error("MONGO_URI is missing in Backend/.env");
    }

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully");
    console.log("Connected database:", mongoose.connection.name);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDB;