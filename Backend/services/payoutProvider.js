
const crypto = require("node:crypto");
const mongoose = require("mongoose");

/**
 * MOCK PAYOUT ADAPTER
 *
 * IMPORTANT:
 * - Mock payouts are allowed only in the throne8_test database.
 * - Production payouts remain disabled until a real provider is integrated.
 * - Mock success is a simulation, NOT an actual bank transfer.
 */

const MOCK_FAILURE_RATE = 0;

async function initiateTransfer({
  mentorAccount,
  amountPaise,
  idempotencyKey,
}) {
  // Never simulate a payout in production or in any non-test database.
  if (
    process.env.NODE_ENV === "production" ||
    mongoose.connection.name !== "throne8_test"
  ) {
    const error = new Error(
      "Mock payouts are allowed only with the throne8_test database"
    );
    error.statusCode = 503;
    error.code = "MOCK_PAYOUTS_DISABLED";
    throw error;
  }

  if (!mentorAccount?.providerAccountId) {
    const error = new Error(
      "Mentor has no linked payout account; cannot simulate transfer"
    );
    error.code = "NO_LINKED_ACCOUNT";
    throw error;
  }

  if (
    !Number.isSafeInteger(amountPaise) ||
    amountPaise <= 0
  ) {
    const error = new Error("Invalid payout amount");
    error.code = "INVALID_PAYOUT_AMOUNT";
    throw error;
  }

  if (
    typeof idempotencyKey !== "string" ||
    idempotencyKey.trim().length === 0
  ) {
    const error = new Error("A valid idempotency key is required");
    error.code = "INVALID_IDEMPOTENCY_KEY";
    throw error;
  }

  const providerTransferId = `mock_tfr_${crypto
    .createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 20)}`;

  if (Math.random() < MOCK_FAILURE_RATE) {
    return {
      providerTransferId,
      status: "FAILED",
      failureCode: "MOCK_SIMULATED_FAILURE",
      failureMessage: "Simulated provider failure (mock adapter)",
    };
  }

  return {
    providerTransferId,
    status: "SUCCEEDED",
    failureCode: null,
    failureMessage: null,
  };
}

async function fetchTransferStatus(providerTransferId) {
  if (!providerTransferId) {
    const error = new Error(
      "Transfer ID is required for reconciliation"
    );
    error.code = "TRANSFER_ID_REQUIRED";
    throw error;
  }

  // A mock adapter cannot verify an actual bank transfer.
  return {
    providerTransferId,
    status: "UNKNOWN",
    failureCode: null,
    failureMessage: "Mock provider cannot verify real transfer status",
  };
}

module.exports = {
  initiateTransfer,
  fetchTransferStatus,
};
