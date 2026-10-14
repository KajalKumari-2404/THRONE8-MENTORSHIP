const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");
const EarningModel = require("../models/earningModel");
const RefundModel = require("../models/refundModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");
const { logAudit } = require("./auditLog");

async function refundPayment({ bookingId, reason, requestedById }) {
  const session = await mongoose.startSession();

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    let payment;
    let refundDoc;

    await session.withTransaction(async () => {
      const booking = await BookingModel.findById(bookingId).session(session);
      if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = 404;
        throw error;
      }

      payment = await PaymentModel.findOneAndUpdate(
        {
          bookingId: booking._id,
          status: "CAPTURED",
          refundStatus: { $in: ["NOT_REQUESTED", null] },
        },
        {
          $set: {
            refundStatus: "PENDING",
            refundAmountPaise: 0,
            refundRequestedAt: new Date(),
          },
        },
        { new: true, session }
      );

      if (!payment) {
        const error = new Error(
          "No capturable, not-yet-refunded payment found for this booking"
        );
        error.statusCode = 409;
        throw error;
      }

      payment.refundAmountPaise = payment.amountPaise;
      await payment.save({ session });

      refundDoc = await RefundModel.create(
        [
          {
            paymentId: payment._id,
            amountPaise: payment.amountPaise,
            reason: reason.trim().slice(0, 500),
            status: "REQUESTED",
            requestedBy: requestedById,
            approvedBy: requestedById,
          },
        ],
        { session, ordered: true }
      ).then((docs) => docs[0]);
    });

    let providerResult;
    try {
      providerResult = await razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: payment.refundAmountPaise,
        notes: { bookingId: String(bookingId), reason: refundDoc.reason },
      });
    } catch (providerError) {
      console.error("Razorpay refund call failed:", providerError.message);
      const error = new Error(
        "Refund could not be confirmed with the provider. It remains PENDING for manual reconciliation."
      );
      error.statusCode = 502;
      throw error;
    }

    const processed = providerResult.status === "processed";

    await session.withTransaction(async () => {
      refundDoc.status = processed ? "PROCESSED" : "PENDING";
      refundDoc.providerRefundId = providerResult.id;
      refundDoc.processedAt = processed ? new Date() : null;
      await refundDoc.save({ session });

      const freshPayment = await PaymentModel.findById(payment._id).session(session);
      freshPayment.refundId = providerResult.id;
      freshPayment.refundStatus = processed ? "PROCESSED" : "PENDING";
      if (processed) {
        freshPayment.status = "REFUNDED";
        freshPayment.refundProcessedAt = new Date();
      }
      await freshPayment.save({ session });

      if (processed) {
        const booking = await BookingModel.findById(bookingId).session(session);

        const reversalEntries = [
          {
            bookingId,
            paymentId: payment._id,
            entryType: "REFUND",
            account: "GATEWAY",
            direction: "CREDIT",
            amountPaise: payment.refundAmountPaise,
            currency: payment.currency,
            eventKey: `refund:${refundDoc._id}:gateway`,
            description: "Razorpay refund processed",
            metadata: { refundId: refundDoc._id.toString() },
          },
        ];

        if (booking?.commissionPaise > 0) {
          reversalEntries.push({
            bookingId,
            paymentId: payment._id,
            entryType: "REVERSAL",
            account: "PLATFORM",
            direction: "DEBIT",
            amountPaise: booking.commissionPaise,
            currency: payment.currency,
            eventKey: `refund:${refundDoc._id}:commission-reversal`,
            description: "Platform commission reversed on refund",
            metadata: { refundId: refundDoc._id.toString() },
          });
        }

        if (booking?.mentorGrossPaise > 0) {
          reversalEntries.push({
            bookingId,
            paymentId: payment._id,
            entryType: "REVERSAL",
            account: "MENTOR",
            direction: "DEBIT",
            amountPaise: booking.mentorGrossPaise,
            currency: payment.currency,
            eventKey: `refund:${refundDoc._id}:mentor-reversal`,
            description: "Mentor earning reversed on refund",
            metadata: { refundId: refundDoc._id.toString() },
          });
        }

        await LedgerEntryModel.create(reversalEntries, { session, ordered: true });

        const earning = await EarningModel.findOne({ bookingId }).session(session);
        if (earning && earning.state !== "PAID") {
          earning.state = "REVERSED";
          earning.holdReason = `Refunded: ${refundDoc.reason}`.slice(0, 1000);
          await earning.save({ session });
        } else if (earning && earning.state === "PAID") {
          earning.holdReason =
            "ALREADY PAID TO MENTOR — refund issued after payout, needs manual clawback";
          await earning.save({ session });
        }
      }

      await logAudit(
        {
          actorId: requestedById,
          actorRole: "ADMIN",
          action: processed ? "REFUND_PROCESSED" : "REFUND_REQUESTED",
          entityType: "REFUND",
          entityId: refundDoc._id,
          before: { paymentStatus: "CAPTURED" },
          after: { refundStatus: refundDoc.status, providerRefundId: providerResult.id },
        },
        session
      );
    });

    return {
      refund: refundDoc,
      paymentStatus: processed ? "REFUNDED" : "CAPTURED",
      refundStatus: refundDoc.status,
    };
  } finally {
    await session.endSession();
  }
}

module.exports = { refundPayment };