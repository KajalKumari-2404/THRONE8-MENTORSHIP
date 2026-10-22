
const mongoose = require("mongoose");
const Razorpay = require("razorpay");

const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");
const EarningModel = require("../models/earningModel");
const RefundModel = require("../models/refundModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");
const { logAudit } = require("./auditLog");

async function upsertLedgerEntries(entries, session) {
  for (const entry of entries) {
    await LedgerEntryModel.updateOne(
      { eventKey: entry.eventKey },
      { $setOnInsert: entry },
      { upsert: true, session }
    );
  }
}

async function refundPayment({ bookingId, reason, requestedById }) {
  const session = await mongoose.startSession();

  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      const error = new Error("Razorpay credentials are not configured");
      error.statusCode = 500;
      throw error;
    }

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

      // payment = await PaymentModel.findOneAndUpdate(
      //   {
      //     bookingId: booking._id,
      //     status: "CAPTURED",
      //     refundStatus: { $in: ["NOT_REQUESTED", null] },
      //   },
      //   {
      //     $set: {
      //       refundStatus: "PENDING",
      //       refundAmountPaise: 0,
      //       refundRequestedAt: new Date(),
      //     },
      //   },
      //   { new: true, session }
      // );


      payment = await PaymentModel.findOneAndUpdate(
        {
          bookingId: booking._id,
          status: "CAPTURED",
          $or: [
            {
              refundStatus: { $in: ["NOT_REQUESTED", null] },
            },
            {
              refundStatus: "PENDING",
              refundAmountPaise: 0,
              "rawProviderRefs.lateCaptureNeedsRefundReview": true,
              "rawProviderRefs.lateCaptureRefundClaimed": {
                $ne: true,
              },
            },
          ],
        },
        {
          $set: {
            refundStatus: "PENDING",
            refundAmountPaise: 0,
            refundRequestedAt: new Date(),
            "rawProviderRefs.lateCaptureRefundClaimed": true,
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

      const docs = await RefundModel.create(
        [
          {
            paymentId: payment._id,
            amountPaise: payment.amountPaise,
            reason: String(reason || "").trim().slice(0, 500),
            status: "REQUESTED",
            requestedBy: requestedById,
            approvedBy: requestedById,
          },
        ],
        { session, ordered: true }
      );

      refundDoc = docs[0];
    });

    let providerResult;

    try {
      providerResult = await razorpay.payments.refund(
        payment.gatewayPaymentId,
        {
          amount: payment.refundAmountPaise,
          notes: {
            bookingId: String(bookingId),
            reason: refundDoc.reason,
          },
        }
      );
    } catch (providerError) {
      console.error("Razorpay refund call failed:", providerError.message);

      // Provider status may be unknown after a timeout.
      // Keep the refund pending for reconciliation. Do not blindly retry.
      const error = new Error(
        "Refund status could not be confirmed. It remains pending for provider reconciliation."
      );
      error.statusCode = 502;
      throw error;
    }

    if (!providerResult?.id || !providerResult?.status) {
      const error = new Error(
        "Razorpay returned an incomplete refund response. Reconciliation is required."
      );
      error.statusCode = 502;
      throw error;
    }

    const providerProcessed = providerResult.status === "processed";
    const providerFailed = providerResult.status === "failed";

    const validProviderStatuses = ["processed", "pending", "failed"];

if (!validProviderStatuses.includes(providerResult.status)) {
  const error = new Error(
    `Unexpected Razorpay refund status: ${providerResult.status}`
  );
  error.statusCode = 502;
  throw error;
}

    await session.withTransaction(async () => {
      const freshRefund = await RefundModel.findById(refundDoc._id).session(
        session
      );
      const freshPayment = await PaymentModel.findById(payment._id).session(
        session
      );

      if (!freshRefund || !freshPayment) {
        throw new Error("Refund or payment record was not found");
      }

      if (
        freshRefund.providerRefundId &&
        freshRefund.providerRefundId !== providerResult.id
      ) {
        throw new Error(
          "Refund provider ID mismatch. Manual reconciliation is required."
        );
      }

      const alreadyProcessed =
        freshRefund.status === "PROCESSED" &&
        freshPayment.refundStatus === "PROCESSED";

      // A delayed API response must not downgrade a processed webhook result.
      const isProcessed = alreadyProcessed || providerProcessed;

      freshRefund.providerRefundId = providerResult.id;

      if (isProcessed) {
        freshRefund.status = "PROCESSED";
        freshRefund.processedAt =
          freshRefund.processedAt || new Date();

        freshPayment.refundId = providerResult.id;
        freshPayment.refundStatus = "PROCESSED";
        freshPayment.refundAmountPaise = freshRefund.amountPaise;
        freshPayment.status =
          freshRefund.amountPaise >= freshPayment.amountPaise
            ? "REFUNDED"
            : "PARTIALLY_REFUNDED";
        freshPayment.refundProcessedAt =
          freshPayment.refundProcessedAt || new Date();
      } else if (
        freshRefund.status !== "PROCESSED" &&
        freshPayment.refundStatus !== "PROCESSED"
      ) {
        freshRefund.status = providerFailed ? "FAILED" : "PENDING";
        freshPayment.refundStatus = providerFailed ? "FAILED" : "PENDING";
        freshPayment.refundId = providerResult.id;
      }

      await freshRefund.save({ session });
      await freshPayment.save({ session });

      if (isProcessed) {
        const booking = await BookingModel.findById(bookingId).session(
          session
        );

        if (!booking) {
          throw new Error("Booking not found while recording refund");
        }

        const reversalEntries = [
          {
            bookingId: booking._id,
            paymentId: freshPayment._id,
            entryType: "REFUND",
            account: "GATEWAY",
            direction: "CREDIT",
            amountPaise: freshRefund.amountPaise,
            currency: freshPayment.currency,
            eventKey: `refund:${freshRefund._id}:gateway`,
            description: "Razorpay refund processed",
            metadata: {
              refundId: String(freshRefund._id),
              providerRefundId: providerResult.id,
            },
          },
        ];

        // Reverse commission and mentor earning only for a full refund.
        const isFullRefund =
          freshRefund.amountPaise >= freshPayment.amountPaise;

        if (isFullRefund && booking.commissionPaise > 0) {
          reversalEntries.push({
            bookingId: booking._id,
            paymentId: freshPayment._id,
            entryType: "REVERSAL",
            account: "PLATFORM",
            direction: "DEBIT",
            amountPaise: booking.commissionPaise,
            currency: freshPayment.currency,
            eventKey: `refund:${freshRefund._id}:commission-reversal`,
            description: "Platform commission reversed on refund",
            metadata: { refundId: String(freshRefund._id) },
          });
        }

        if (isFullRefund && booking.mentorGrossPaise > 0) {
          reversalEntries.push({
            bookingId: booking._id,
            paymentId: freshPayment._id,
            entryType: "REVERSAL",
            account: "MENTOR",
            direction: "DEBIT",
            amountPaise: booking.mentorGrossPaise,
            currency: freshPayment.currency,
            eventKey: `refund:${freshRefund._id}:mentor-reversal`,
            description: "Mentor earning reversed on refund",
            metadata: { refundId: String(freshRefund._id) },
          });
        }

        // Stable event keys prevent duplicate ledger records.
        await upsertLedgerEntries(reversalEntries, session);

        if (isFullRefund) {
          const earning = await EarningModel.findOne({
            bookingId: booking._id,
          }).session(session);

          if (earning && earning.state !== "PAID") {
            earning.state = "REVERSED";
            earning.holdReason = `Refunded: ${freshRefund.reason}`.slice(
              0,
              1000
            );
            await earning.save({ session });
          } else if (earning && earning.state === "PAID") {
            earning.holdReason =
              "ALREADY PAID TO MENTOR — refund issued after payout, needs manual clawback";
            await earning.save({ session });
          }
        }
      }

      await logAudit(
        {
          actorId: requestedById,
          actorRole: "ADMIN",
          action: isProcessed
            ? "REFUND_PROCESSED"
            : providerFailed
              ? "REFUND_FAILED"
              : "REFUND_REQUESTED",
          entityType: "REFUND",
          entityId: freshRefund._id,
          before: { paymentStatus: "CAPTURED" },
          after: {
            refundStatus: freshRefund.status,
            providerRefundId: providerResult.id,
          },
        },
        session
      );

      // Return the latest database state, including any webhook update.
      refundDoc = freshRefund;
      payment = freshPayment;
    });

    return {
      refund: refundDoc,
      paymentStatus: payment.status,
      refundStatus: refundDoc.status,
    };
  } finally {
    await session.endSession();
  }
}

module.exports = { refundPayment };
