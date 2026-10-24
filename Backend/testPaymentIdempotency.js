
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

if (process.env.NODE_ENV !== "test") {
  console.error(
    "BLOCKED: This test can run only with NODE_ENV=test."
  );
  process.exit(1);
}

if (!process.env.MONGO_TEST_URI) {
  console.error(
    "BLOCKED: MONGO_TEST_URI is required for this test."
  );
  process.exit(1);
}

require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});


if (process.env.NODE_ENV !== "test") {
  throw new Error("BLOCKED: NODE_ENV must be test.");
}

if (!process.env.MONGO_TEST_URI) {
  throw new Error("BLOCKED: MONGO_TEST_URI is missing.");
}

let testDatabaseName;

try {
  testDatabaseName = new URL(
    process.env.MONGO_TEST_URI
  ).pathname.replace(/^\/+/, "");
} catch {
  throw new Error("BLOCKED: MONGO_TEST_URI is invalid.");
}

if (testDatabaseName !== "throne8_test") {
  throw new Error(
    "BLOCKED: Expected database throne8_test; refusing to run."
  );
}


const mongoose = require("mongoose");
const PaymentModel = require("./models/paymentModel");
const EarningModel = require("./models/earningModel");
const LedgerEntryModel = require("./models/ledgerEntryModel");
const {
  processCapturedPayment,
} = require("./services/processCapturedPayment");

async function testIdempotency() {
  try {
    await require("./config/db")();

    const orderId = "order_Tmetigdavrdp66";

    const payment = await PaymentModel.findOne({
      gateway: "razorpay",
      gatewayOrderId: orderId,
    });

    if (!payment || payment.status !== "CAPTURED") {
      throw new Error("Expected existing CAPTURED payment was not found.");
    }

    const beforeEarnings = await EarningModel.countDocuments({
      bookingId: payment.bookingId,
    });

    const beforeLedger = await LedgerEntryModel.countDocuments({
      bookingId: payment.bookingId,
    });

    console.log("Before:", {
      paymentStatus: payment.status,
      earnings: beforeEarnings,
      ledgerEntries: beforeLedger,
    });

    const result = await processCapturedPayment({
      orderId: payment.gatewayOrderId,
      paymentId: payment.gatewayPaymentId,
      amount: payment.amountPaise,
      currency: payment.currency,
      providerStatus: "captured",
      source: "idempotency-test",
    });

    const afterEarnings = await EarningModel.countDocuments({
      bookingId: payment.bookingId,
    });

    const afterLedger = await LedgerEntryModel.countDocuments({
      bookingId: payment.bookingId,
    });

    console.log("Service result:", result);
    console.log("After:", {
      earnings: afterEarnings,
      ledgerEntries: afterLedger,
    });

    if (
      result.alreadyCaptured !== true ||
      beforeEarnings !== afterEarnings ||
      beforeLedger !== afterLedger
    ) {
      throw new Error("Idempotency test FAILED.");
    }

    console.log("PASS: No duplicate earning or ledger entries created.");
  } catch (error) {
    console.error("Test failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

testIdempotency();