const crypto = require("node:crypto");

/**
 * MOCK PAYOUT ADAPTER.
 *
 * Spec §2 / §12 (go-live gate): real mentor payouts require Razorpay Route
 * (or Cashfree Easy Split) marketplace approval, linked-account setup and
 * Indian compliance sign-off, none of which exist yet. Until that approval
 * lands, this adapter simulates a provider transfer so the rest of the
 * payout pipeline (worker, state machine, admin UI, reconciliation) can be
 * built and tested end-to-end.
 *
 * Swap-in point: replace the body of `initiateTransfer` with a real
 * `razorpayX.transfers.create(...)` (or Cashfree Easy Split) call, keep the
 * same return shape ({ providerTransferId, status }).
 */

const MOCK_FAILURE_RATE = 0; // set >0 locally to rehearse failure handling

async function initiateTransfer({ mentorAccount, amountPaise, idempotencyKey }) {
  if (!mentorAccount?.providerAccountId) {
    const error = new Error(
      "Mentor has no linked payout account; cannot transfer"
    );
    error.code = "NO_LINKED_ACCOUNT";
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
  return { providerTransferId, status: "SUCCEEDED" };
}

module.exports = { initiateTransfer, fetchTransferStatus };