const mongoose = require("mongoose");

const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");
const EarningModel = require("../models/earningModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");

const processCapturedPayment = async ({
  orderId,
  paymentId,
  amount,
  currency,
  providerStatus,
  source,
}) => {
  if (
    !orderId ||
    !paymentId ||
    !Number.isSafeInteger(amount) ||
    amount <= 0 ||
    currency !== "INR" ||
    providerStatus !== "captured"
  ) {
    const error = new Error("Invalid captured payment details");
    error.statusCode = 400;
    throw error;
  }

  const session = await mongoose.startSession();

  try {
    let result;

    await session.withTransaction(async () => {
      const payment = await PaymentModel.findOne({
        gateway: "razorpay",
        gatewayOrderId: orderId,
      }).session(session);

      if (!payment) {
        const error = new Error("Payment order not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        payment.amountPaise !== amount ||
        payment.currency !== currency
      ) {
        const error = new Error("Payment amount or currency mismatch");
        error.statusCode = 400;
        throw error;
      }

      // Idempotency: already-captured payments must not create
      // another earning or another set of ledger entries.
      if (payment.status === "CAPTURED") {
        if (payment.gatewayPaymentId !== paymentId) {
          const error = new Error(
            "Payment order is already linked to another payment"
          );
          error.statusCode = 409;
          throw error;
        }

        const existingBooking = await BookingModel.findById(
          payment.bookingId
        ).session(session);

        if (!existingBooking) {
          const error = new Error("Booking not found");
          error.statusCode = 404;
          throw error;
        }

        result = {
          alreadyCaptured: true,
          paymentStatus: payment.status,
          bookingStatus: existingBooking.status,
        };

        return;
      }

      if (!["CREATED", "AUTHORIZED"].includes(payment.status)) {
        const error = new Error(
          `Cannot capture payment in ${payment.status} state`
        );
        error.statusCode = 409;
        throw error;
      }

      const conflictingPayment = await PaymentModel.findOne({
        gatewayPaymentId: paymentId,
        _id: { $ne: payment._id },
      }).session(session);

      if (conflictingPayment) {
        const error = new Error(
          "This Razorpay payment is linked to another order"
        );
        error.statusCode = 409;
        throw error;
      }

      const booking = await BookingModel.findById(
        payment.bookingId
      ).session(session);

      if (!booking) {
        const error = new Error("Booking not found");
        error.statusCode = 404;
        throw error;
      }

      if (
        booking.pricePaise !== amount ||
        booking.currency !== currency
      ) {
        const error = new Error("Booking amount or currency mismatch");
        error.statusCode = 400;
        throw error;
      }

      // if (booking.status !== "PENDING_PAYMENT") {
      //   const error = new Error(
      //     `Booking cannot be confirmed from ${booking.status} state`
      //   );
      //   error.statusCode = 409;
      //   throw error;
      // }


      if (["EXPIRED", "CANCELLED"].includes(booking.status)) {
        const now = new Date();

        payment.status = "CAPTURED";
        payment.gatewayPaymentId = paymentId;
        payment.capturedAt = now;
        payment.refundStatus = "PENDING";
        payment.rawProviderRefs = {
          ...(payment.rawProviderRefs || {}),
          captureSource: source || "unknown",
          lateCaptureNeedsRefundReview: true,
          lateCaptureOriginalBookingStatus: booking.status,
          lateCaptureDetectedAt: now.toISOString(),
        };

        await payment.save({ session });

        await LedgerEntryModel.updateOne(
          {
            eventKey: `razorpay:${paymentId}:captured`,
          },
          {
            $setOnInsert: {
              bookingId: booking._id,
              paymentId: payment._id,
              entryType: "PAYMENT_CAPTURED",
              account: "GATEWAY",
              direction: "DEBIT",
              amountPaise: amount,
              currency,
              eventKey: `razorpay:${paymentId}:captured`,
              description: "Razorpay payment captured for expired/cancelled booking",
              metadata: {
                orderId,
                paymentId,
                source: source || "unknown",
                lateCaptureNeedsRefundReview: true,
              },
            },
          },
          { upsert: true, session }
        );

        result = {
          alreadyCaptured: false,
          lateCaptureNeedsRefundReview: true,
          paymentStatus: payment.status,
          bookingStatus: booking.status,
          message:
            "Payment captured after booking expiry/cancellation. Refund review is required; booking was not confirmed.",
        };

        return;
      }

      if (booking.status !== "PENDING_PAYMENT") {
        const error = new Error(
          `Booking cannot be confirmed from ${booking.status} state`
        );
        error.statusCode = 409;
        throw error;
      }

      if (
        !Number.isSafeInteger(booking.commissionPaise) ||
        !Number.isSafeInteger(booking.mentorGrossPaise) ||
        booking.commissionPaise < 0 ||
        booking.mentorGrossPaise < 0 ||
        booking.commissionPaise + booking.mentorGrossPaise !== amount
      ) {
        const error = new Error(
          "Booking commission and mentor amount are inconsistent"
        );
        error.statusCode = 409;
        throw error;
      }

      const now = new Date();

      payment.status = "CAPTURED";
      payment.gatewayPaymentId = paymentId;
      payment.capturedAt = now;
      payment.rawProviderRefs = {
        ...(payment.rawProviderRefs || {}),
        captureSource: source || "unknown",
      };

      await payment.save({ session });

      booking.status = "CONFIRMED";
      await booking.save({ session });

      await EarningModel.create(
        [
          {
            bookingId: booking._id,
            mentorId: booking.mentorId,
            grossPaise: amount,
            commissionPaise: booking.commissionPaise,
            payablePaise: booking.mentorGrossPaise,
            state: "PENDING_SESSION",
          },
        ],
              { session, ordered: true }
      );

      const commonMetadata = {

        orderId,
        paymentId,
        source: source || "unknown",
      };

      await LedgerEntryModel.create(
        [
          {
            bookingId: booking._id,
            paymentId: payment._id,
            entryType: "PAYMENT_CAPTURED",
            account: "GATEWAY",
            direction: "DEBIT",
            amountPaise: amount,
            currency,
            eventKey: `razorpay:${paymentId}:captured`,
            description: "Razorpay payment captured",
            metadata: commonMetadata,
          },
          {
            bookingId: booking._id,
            paymentId: payment._id,
            entryType: "PLATFORM_COMMISSION",
            account: "PLATFORM",
            direction: "CREDIT",
            amountPaise: booking.commissionPaise,
            currency,
            eventKey: `booking:${booking._id}:commission`,
            description: "Platform commission from booking",
            metadata: commonMetadata,
          },
          {
            bookingId: booking._id,
            paymentId: payment._id,
            entryType: "MENTOR_EARNING",
            account: "MENTOR",
            direction: "CREDIT",
            amountPaise: booking.mentorGrossPaise,
            currency,
            eventKey: `booking:${booking._id}:mentor-earning`,
            description: "Mentor earning from booking",
            metadata: commonMetadata,
          },

              ],
        { session, ordered: true }
      );

      // result = {
      //   alreadyCaptured: false,
      //   paymentStatus: payment.status,
      //   bookingStatus: booking.status,
      // };

      result = {
  alreadyCaptured: true,
  lateCaptureNeedsRefundReview:
    payment.rawProviderRefs?.lateCaptureNeedsRefundReview === true,
  paymentStatus: payment.status,
  bookingStatus: existingBooking.status,
};
    });

    return result;
  } finally {
    await session.endSession();
  }
};

module.exports = { processCapturedPayment };
