
require("dotenv").config({
  path: require("path").join(__dirname, ".env"),
});

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