const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const dotenv = require("dotenv");
dotenv.config();

const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
try {
if (!process.env.MONGO_URI) {
throw new Error("MONGO_URI is missing in Backend/.env");
}

await mongoose.connect(process.env.MONGO_URI);

console.log("MongoDB connected successfully");

app.listen(PORT, () => {
  console.log(`THRONE8 server running on port ${PORT}`);
});

} catch (error) {
console.error("Server startup failed:", error.message);
process.exit(1);
}
};

startServer();
