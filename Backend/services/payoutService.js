
const mongoose = require("mongoose");

const EarningModel = require("../models/earningModel");
const PayoutModel = require("../models/payoutModel");
const MentorAccountModel = require("../models/mentorAccountModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");
const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");

const { initiateTransfer } = require("./payoutProvider");
const { logAudit } = require("./auditLog");

async function validatePayoutEligibility(earning, session) {

  const booking = await BookingModel.findOne({
  _id: earning.bookingId,
  mentorId: earning.mentorId,
  status: "COMPLETED",
  completedAt: { $ne: null },
  completionRequestedAt: { $ne: null },
  studentConfirmedAt: { $ne: null },
  completionDisputedAt: null,
}).session(session);

if (!booking) {
  const error = new Error(
    "Booking must be completed, student-confirmed, and undisputed"
  );
  error.statusCode = 409;
  throw error;
}

const now = new Date();

if (
  !earning.eligibleAt ||
  earning.eligibleAt > now ||
  earning.state !== "ELIGIBLE"
) {
  const error = new Error("Earning is not yet eligible for payout");
  error.statusCode = 409;
  throw error;
}

if (
  !booking.payoutEligibleAt ||
  booking.payoutEligibleAt > now
) {
  const error = new Error(
    "Booking is still within the 15-day payout hold"
  );
  error.statusCode = 409;
  throw error;
}

  const payment = await PaymentModel.findOne({
    bookingId: earning.bookingId,
    status: "CAPTURED",
    refundStatus: "NOT_REQUESTED",
    refundAmountPaise: 0,
  })
    .sort({ createdAt: -1 })
    .session(session);

  if (!payment) {
    throw Object.assign(
      new Error("Captured payment missing or refund is present"),
      { statusCode: 409 }
    );
  }

  const mentorAccount = await MentorAccountModel.findOne({
    mentorId: earning.mentorId,
  }).session(session);

  if (
    !mentorAccount ||
    mentorAccount.verificationStatus !== "VERIFIED" ||
    mentorAccount.payoutEnabled !== true
  ) {
    throw Object.assign(
      new Error("Mentor account is not verified or payout-enabled"),
      { statusCode: 409 }
    );
  }

  if (!mentorAccount.providerAccountId) {
    throw Object.assign(
      new Error("Mentor has no linked payout account"),
      { statusCode: 409 }
    );
  }

  return mentorAccount;
}

async function settleTransfer({
  payout,
  earning,
  transfer,
  adminId,
  action,
}) {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const currentPayout = await PayoutModel.findOne({
        _id: payout._id,
        state: "INITIATED",
      }).session(session);

      const currentEarning = await EarningModel.findOne({
        _id: earning._id,
        state: "PROCESSING",
      }).session(session);

      if (!currentPayout || !currentEarning) {
        throw new Error("Payout state changed; manual reconciliation required");
      }

      if (transfer.status === "SUCCEEDED") {
        if (!transfer.providerTransferId) {
          throw new Error(
            "Provider returned success without a transfer ID; reconcile manually"
          );
        }

        currentPayout.state = "SUCCEEDED";
        currentPayout.providerTransferId = transfer.providerTransferId;
        currentPayout.confirmedAt = new Date();

        currentEarning.state = "PAID";
        currentEarning.holdReason = null;

        await LedgerEntryModel.create(
          [
            {
              bookingId: currentEarning.bookingId,
              entryType: "PAYOUT",
              account: "MENTOR",
              direction: "DEBIT",
              amountPaise: currentPayout.amountPaise,
              currency: "INR",
              eventKey: `payout:${currentPayout._id}:settled`,
              description: "Mentor payout settled",
              metadata: { payoutId: currentPayout._id.toString() },
            },
          ],
          { session }
        );
      } else if (transfer.status === "FAILED") {
        currentPayout.state = "FAILED";
        currentPayout.failureCode = transfer.failureCode || "TRANSFER_FAILED";
        currentPayout.failureMessage =
          transfer.failureMessage || "Provider reported transfer failure";

        currentEarning.state = "ELIGIBLE";
      } else {
        // Unknown/pending status is NOT a failure.
        // Keep INITIATED + PROCESSING until provider reconciliation.
        return;
      }

      await currentPayout.save({ session });
      await currentEarning.save({ session });

      await logAudit(
        {
          actorId: adminId,
          actorRole: "ADMIN",
          action,
          entityType: "PAYOUT",
          entityId: currentPayout._id,
          before: {
            payoutState: "INITIATED",
            earningState: "PROCESSING",
          },
          after: {
            payoutState: currentPayout.state,
            earningState: currentEarning.state,
          },
        },
        session
      );

      payout = currentPayout;
      earning = currentEarning;
    });
  } finally {
    await session.endSession();
  }

  return { payout, earning };
}

async function approvePayout({ earningId, adminId }) {
  const session = await mongoose.startSession();

  let payout;
  let earning;
  let mentorAccount;

  try {
    await session.withTransaction(async () => {
      earning = await EarningModel.findOne({
        _id: earningId,
        state: "ELIGIBLE",
      }).session(session);

      if (!earning) {
        throw Object.assign(
          new Error("Earning is not ELIGIBLE or was already processed"),
          { statusCode: 409 }
        );
      }

      mentorAccount = await validatePayoutEligibility(earning, session);

      const leased = await EarningModel.findOneAndUpdate(
        { _id: earning._id, state: "ELIGIBLE" },
        { $set: { state: "PROCESSING" } },
        { new: true, session }
      );

      if (!leased) {
        throw Object.assign(
          new Error("Earning was claimed by another request"),
          { statusCode: 409 }
        );
      }

      earning = leased;

      const idempotencyKey = `payout:${earning._id}:attempt:1`;

      payout = await PayoutModel.create(
        [
          {
            earningId: earning._id,
            mentorId: earning.mentorId,
            amountPaise: earning.payablePaise,
            attempt: 1,
            state: "INITIATED",
            idempotencyKey,
            initiatedAt: new Date(),
          },
        ],
        { session }
      ).then((docs) => docs[0]);
    });
  } finally {
    await session.endSession();
  }

  // If the provider call throws/times out, leave the payout INITIATED
  // and earning PROCESSING. Reconcile provider status before retrying.
  const transfer = await initiateTransfer({
    mentorAccount,
    amountPaise: payout.amountPaise,
    idempotencyKey: payout.idempotencyKey,
  });

  return settleTransfer({
    payout,
    earning,
    transfer,
    adminId,
    action: "PAYOUT_APPROVE",
  });
}

async function retryPayout({ payoutId, adminId }) {
  const session = await mongoose.startSession();

  let payout;
  let earning;
  let mentorAccount;

  try {
    await session.withTransaction(async () => {
      payout = await PayoutModel.findOne({
        _id: payoutId,
        state: "FAILED",
      }).session(session);

      if (!payout) {
        throw Object.assign(
          new Error("Only a confirmed FAILED payout can be retried"),
          { statusCode: 409 }
        );
      }

      earning = await EarningModel.findOne({
        _id: payout.earningId,
        state: "ELIGIBLE",
      }).session(session);

      if (!earning) {
        throw Object.assign(
          new Error("Earning is not ELIGIBLE for retry"),
          { statusCode: 409 }
        );
      }

      mentorAccount = await validatePayoutEligibility(earning, session);

      const leased = await EarningModel.findOneAndUpdate(
        { _id: earning._id, state: "ELIGIBLE" },
        { $set: { state: "PROCESSING" } },
        { new: true, session }
      );

      if (!leased) {
        throw Object.assign(
          new Error("Earning was claimed by another request"),
          { statusCode: 409 }
        );
      }

      earning = leased;

      // Preserve the failed attempt for audit history.
      payout = await PayoutModel.create(
        [
          {
            earningId: earning._id,
            mentorId: earning.mentorId,
            amountPaise: earning.payablePaise,
            attempt: payout.attempt + 1,
            state: "INITIATED",
            idempotencyKey:
              `payout:${earning._id}:attempt:${payout.attempt + 1}`,
            initiatedAt: new Date(),
          },
        ],
        { session }
      ).then((docs) => docs[0]);
    });
  } finally {
    await session.endSession();
  }

  const transfer = await initiateTransfer({
    mentorAccount,
    amountPaise: payout.amountPaise,
    idempotencyKey: payout.idempotencyKey,
  });

  return settleTransfer({
    payout,
    earning,
    transfer,
    adminId,
    action: "PAYOUT_RETRY",
  });
}

module.exports = { approvePayout, retryPayout };