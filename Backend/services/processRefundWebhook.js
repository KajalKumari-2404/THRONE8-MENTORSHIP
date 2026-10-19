
const mongoose = require("mongoose");

const PaymentModel = require("../models/paymentModel");
const RefundModel = require("../models/refundModel");
const BookingModel = require("../models/bookingModel");
const EarningModel = require("../models/earningModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");

async function processRefundWebhook({ eventType, refundEntity }) {
  if (!refundEntity?.id || !refundEntity?.payment_id) {
    throw new Error("Refund webhook is missing provider refund/payment ID");
  }

  const providerStatus = refundEntity.status;
  const isProcessed =
    eventType === "refund.processed" && providerStatus === "processed";
  const isFailed =
    eventType === "refund.failed" && providerStatus === "failed";

  const isPending =
    eventType === "refund.created" &&
    ["created", "pending"].includes(providerStatus);

  if (!isProcessed && !isFailed && !isPending) {
    throw new Error(
      `Unsupported or inconsistent refund status: ${eventType}/${providerStatus}`
    );
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Match by provider refund ID first. If the webhook arrives before
      // the API response is saved, fall back to the pending local refund.
      let refund = await RefundModel.findOne({
        providerRefundId: refundEntity.id,
      }).session(session);

      let payment;

      
      if (refund) {
        if (refund.paymentId) {
          payment = await PaymentModel.findById(refund.paymentId).session(
            session
          );
        }

        if (!payment && refundEntity.payment_id) {
          payment = await PaymentModel.findOne({
            gatewayPaymentId: refundEntity.payment_id,
          }).session(session);
        }
      } else {

        payment = await PaymentModel.findOne({
          gatewayPaymentId: refundEntity.payment_id,
          refundStatus: { $in: ["PENDING", "NOT_REQUESTED"] },
        }).session(session);

        if (!payment) {
          throw new Error("No matching payment found for refund webhook");
        }

        refund = await RefundModel.findOne({
          paymentId: payment._id,
          status: { $in: ["REQUESTED", "PENDING"] },
        })
          .sort({ createdAt: -1 })
          .session(session);
      }

      if (!payment || !refund) {
        throw new Error("No matching local refund record found");
      }

      if (payment.gatewayPaymentId !== refundEntity.payment_id) {
        throw new Error("Refund payment ID does not match local payment");
      }

            if (
        !Number.isSafeInteger(refundEntity.amount) ||
        refundEntity.amount <= 0 ||
        !Number.isSafeInteger(refund.amountPaise) ||
        refund.amountPaise <= 0 ||
        refundEntity.amount !== refund.amountPaise
      ) {
        throw new Error(
          "Refund amount is missing, invalid, or does not match the local refund"
        );
      }

            // Repair a missing payment link only after validation.
      if (!refund.paymentId) {
        refund.paymentId = payment._id;
        await refund.save({ session });
      }

      // Idempotency: do not write refund ledger entries twice.
      if (refund.status === "PROCESSED" && payment.refundStatus === "PROCESSED") {
        return;
      }

      refund.providerRefundId = refundEntity.id;

      if (isPending) {
        if (refund.status !== "PROCESSED") {
          refund.status = "PENDING";
          payment.refundStatus = "PENDING";
        }

        await refund.save({ session });
        await payment.save({ session });
        return;
      }

      if (isFailed) {
        if (refund.status !== "PROCESSED") {
          refund.status = "FAILED";
          payment.refundStatus = "FAILED";
          await refund.save({ session });
          await payment.save({ session });
        }

        return;
      }

      // Only a verified refund.processed event reaches this point.
      if (refund.status === "FAILED" || refund.status === "CANCELLED") {
        throw new Error(
          "Processed event conflicts with the local refund terminal state"
        );
      }

      const booking = await BookingModel.findById(payment.bookingId).session(session);

      if (!booking) {
        throw new Error("Booking for refund was not found");
      }

      refund.status = "PROCESSED";
      refund.processedAt = refund.processedAt || new Date();

      payment.refundId = refundEntity.id;
      payment.refundStatus = "PROCESSED";
      payment.refundAmountPaise = refund.amountPaise;
      payment.status =
        refund.amountPaise >= payment.amountPaise
          ? "REFUNDED"
          : "PARTIALLY_REFUNDED";
      payment.refundProcessedAt = payment.refundProcessedAt || new Date();

      await refund.save({ session });
      await payment.save({ session });

      const earning = await EarningModel.findOne({
        bookingId: booking._id,
      }).session(session);

      const reversalEntries = [
        {
          bookingId: booking._id,
          paymentId: payment._id,
          entryType: "REFUND",
          account: "GATEWAY",
          direction: "CREDIT",
          amountPaise: refund.amountPaise,
          currency: payment.currency,
          eventKey: `refund:${refund._id}:gateway`,
          description: "Provider-confirmed refund processed",
          metadata: { refundId: String(refund._id), providerRefundId: refundEntity.id },
        },
      ];

      // Reverse platform/mentor amounts only for a full refund.
      // Partial refunds require a separately defined allocation policy.
      const isFullRefund = refund.amountPaise >= payment.amountPaise;

      if (isFullRefund && booking.commissionPaise > 0) {
        reversalEntries.push({
          bookingId: booking._id,
          paymentId: payment._id,
          entryType: "REVERSAL",
          account: "PLATFORM",
          direction: "DEBIT",
          amountPaise: booking.commissionPaise,
          currency: payment.currency,
          eventKey: `refund:${refund._id}:commission-reversal`,
          description: "Platform commission reversed on full refund",
          metadata: { refundId: String(refund._id) },
        });
      }

      if (isFullRefund && booking.mentorGrossPaise > 0) {
        reversalEntries.push({
          bookingId: booking._id,
          paymentId: payment._id,
          entryType: "REVERSAL",
          account: "MENTOR",
          direction: "DEBIT",
          amountPaise: booking.mentorGrossPaise,
          currency: payment.currency,
          eventKey: `refund:${refund._id}:mentor-reversal`,
          description: "Mentor earning reversed on full refund",
          metadata: { refundId: String(refund._id) },
        });
      }

      // Avoid duplicate-key failures when the API response and webhook race.
      for (const entry of reversalEntries) {
        await LedgerEntryModel.updateOne(
          { eventKey: entry.eventKey },
          { $setOnInsert: entry },
          { upsert: true, session }
        );
      }

      if (earning && isFullRefund) {
        if (earning.state === "PAID") {
          earning.holdReason =
            "Refund issued after mentor payout; manual clawback review required";
        } else {
          earning.state = "REVERSED";
          earning.holdReason = `Refunded: ${refund.reason}`.slice(0, 1000);
        }

        await earning.save({ session });
      }
    });
  } finally {
    await session.endSession();
  }
}

module.exports = { processRefundWebhook };
