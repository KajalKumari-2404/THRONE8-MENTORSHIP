
require("dotenv").config();
const dns = require("node:dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const readline = require("readline");
const UserModel = require("./models/userModel");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const ask = (question) =>
  new Promise((resolve) => rl.question(question, resolve));

async function main() {
  try {
    const name = (await ask("Admin name: ")).trim();
    const email = (await ask("Admin email: ")).trim().toLowerCase();
    const password = await ask("Admin password (minimum 8 characters): ");

    if (!name || !email || password.length < 8) {
      throw new Error("Name, valid email and an 8+ character password are required.");
    }

    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);

    const existing = await UserModel.findOne({ email });

    if (existing) {
      throw new Error(
        `This email already belongs to a ${existing.role} account. No changes were made.`
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("\nAdmin created successfully.");
    console.log("Email:", admin.email);
    console.log("Role:", admin.role);
    console.log("Now log in through the existing login API.");
  } catch (error) {
    console.error("\nAdmin creation failed:", error.message);
    process.exitCode = 1;
  } finally {
    rl.close();
    await mongoose.disconnect().catch(() => {});
  }
}

main();