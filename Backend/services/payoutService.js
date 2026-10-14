const mongoose = require("mongoose");

const EarningModel = require("../models/earningModel");
const PayoutModel = require("../models/payoutModel");
const MentorAccountModel = require("../models/mentorAccountModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");
const { initiateTransfer } = require("./payoutProvider");
const { logAudit } = require("./auditLog");

/**
 * Admin-approves a single ELIGIBLE earning for payout.
 * Spec §8: lease atomically, deterministic idempotency key, never treat API
 * submission as success — only the provider's returned status decides state.
 */
async function approvePayout({ earningId, adminId }) {
  const session = await mongoose.startSession();

  try {
    let leasedEarning;
    let mentorAccount;
    let payout;

    await session.withTransaction(async () => {
      leasedEarning = await EarningModel.findOneAndUpdate(
        { _id: earningId, state: "ELIGIBLE" },
        { $set: { state: "PROCESSING" } },
        { new: true, session }
      );

      if (!leasedEarning) {
        const error = new Error(
          "Earning is not ELIGIBLE (already processed, on hold, or not found)"
        );
        error.statusCode = 409;
        throw error;
      }

      mentorAccount = await MentorAccountModel.findOne({
        mentorId: leasedEarning.mentorId,
      }).session(session);

      if (
        !mentorAccount ||
        mentorAccount.verificationStatus !== "VERIFIED" ||
        !mentorAccount.payoutEnabled
      ) {
        const error = new Error(
          "Mentor account is not verified/payout-enabled"
        );
        error.statusCode = 409;
        throw error;
      }

      const idempotencyKey = `payout:${leasedEarning._id}:attempt:1`;

      payout = await PayoutModel.create(
        [
          {
            earningId: leasedEarning._id,
            mentorId: leasedEarning.mentorId,
            amountPaise: leasedEarning.payablePaise,
            attempt: 1,
            state: "INITIATED",
            idempotencyKey,
            initiatedAt: new Date(),
          },
        ],
        { session, ordered: true }
      ).then((docs) => docs[0]);
    });

    const transfer = await initiateTransfer({
      mentorAccount,
      amountPaise: payout.amountPaise,
      idempotencyKey: payout.idempotencyKey,
    });

    await session.withTransaction(async () => {
      if (transfer.status === "SUCCEEDED") {
        payout.state = "SUCCEEDED";
        payout.providerTransferId = transfer.providerTransferId;
        payout.confirmedAt = new Date();
        await payout.save({ session });

        leasedEarning.state = "PAID";
        await leasedEarning.save({ session });

        await LedgerEntryModel.create(
          [
            {
              bookingId: leasedEarning.bookingId,
              entryType: "PAYOUT",
              account: "MENTOR",
              direction: "DEBIT",
              amountPaise: payout.amountPaise,
              currency: "INR",
              eventKey: `payout:${payout._id}:settled`,
              description: "Mentor payout settled",
              metadata: { payoutId: payout._id.toString() },
            },
          ],
          { session, ordered: true }
        );
      } else {
        payout.state = "FAILED";
        payout.failureCode = transfer.failureCode;
        payout.failureMessage = transfer.failureMessage;
        await payout.save({ session });

        leasedEarning.state = "ELIGIBLE";
        await leasedEarning.save({ session });
      }

      await logAudit(
        {
          actorId: adminId,
          actorRole: "ADMIN",
          action: "PAYOUT_APPROVE",
          entityType: "PAYOUT",
          entityId: payout._id,
          before: { earningState: "ELIGIBLE" },
          after: { payoutState: payout.state, earningState: leasedEarning.state },
        },
        session
      );
    });

    return { payout, earning: leasedEarning };
  } finally {
    await session.endSession();
  }
}

/**
 * Retries a previously FAILED payout attempt with a fresh idempotency key
 * (attempt N+1).
 */
async function retryPayout({ payoutId, adminId }) {
  const session = await mongoose.startSession();

  try {
    let payout;
    let earning;
    let mentorAccount;

    await session.withTransaction(async () => {
      payout = await PayoutModel.findOne({
        _id: payoutId,
        state: "FAILED",
      }).session(session);

      if (!payout) {
        const error = new Error("Only a FAILED payout can be retried");
        error.statusCode = 409;
        throw error;
      }

      earning = await EarningModel.findOneAndUpdate(
        { _id: payout.earningId, state: "ELIGIBLE" },
        { $set: { state: "PROCESSING" } },
        { new: true, session }
      );

      if (!earning) {
        const error = new Error(
          "Underlying earning is no longer ELIGIBLE for retry"
        );
        error.statusCode = 409;
        throw error;
      }

      mentorAccount = await MentorAccountModel.findOne({
        mentorId: payout.mentorId,
      }).session(session);

      payout.attempt += 1;
      payout.idempotencyKey = `payout:${earning._id}:attempt:${payout.attempt}`;
      payout.state = "INITIATED";
      payout.failureCode = null;
      payout.failureMessage = null;
      payout.initiatedAt = new Date();
      await payout.save({ session });
    });

    const transfer = await initiateTransfer({
      mentorAccount,
      amountPaise: payout.amountPaise,
      idempotencyKey: payout.idempotencyKey,
    });

    await session.withTransaction(async () => {
      if (transfer.status === "SUCCEEDED") {
        payout.state = "SUCCEEDED";
        payout.providerTransferId = transfer.providerTransferId;
        payout.confirmedAt = new Date();
        await payout.save({ session });

        earning.state = "PAID";
        await earning.save({ session });

        await LedgerEntryModel.create(
          [
            {
              bookingId: earning.bookingId,
              entryType: "PAYOUT",
              account: "MENTOR",
              direction: "DEBIT",
              amountPaise: payout.amountPaise,
              currency: "INR",
              eventKey: `payout:${payout._id}:settled:attempt:${payout.attempt}`,
              description: "Mentor payout settled (retry)",
              metadata: { payoutId: payout._id.toString() },
            },
          ],
          { session, ordered: true }
        );
      } else {
        payout.state = "FAILED";
        payout.failureCode = transfer.failureCode;
        payout.failureMessage = transfer.failureMessage;
        await payout.save({ session });

        earning.state = "ELIGIBLE";
        await earning.save({ session });
      }

      await logAudit(
        {
          actorId: adminId,
          actorRole: "ADMIN",
          action: "PAYOUT_RETRY",
          entityType: "PAYOUT",
          entityId: payout._id,
          before: { attempt: payout.attempt - 1 },
          after: { attempt: payout.attempt, payoutState: payout.state },
        },
        session
      );
    });

    return { payout, earning };
  } finally {
    await session.endSession();
  }
}

module.exports = { approvePayout, retryPayout };