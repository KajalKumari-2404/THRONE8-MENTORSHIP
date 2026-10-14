
const Razorpay = require("razorpay");
const mongoose = require("mongoose");
const crypto = require("node:crypto");
const { refundPayment } = require("../services/refundService");

const BookingModel = require("../models/bookingModel");
const PaymentModel = require("../models/paymentModel");
const {
processCapturedPayment,
} = require("../services/processCapturedPayment");

const createPaymentOrder = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      studentId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    if (booking.status !== "PENDING_PAYMENT") {
      return res.status(400).json({
        success: false,
        message: "Booking is not awaiting payment",
      });
    }

    if (
      !booking.holdExpiresAt ||
      booking.holdExpiresAt <= new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking hold has expired. Please create a new booking.",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Razorpay keys are not configured",
      });
    }

    const existingPayment = await PaymentModel.findOne({
      bookingId: booking._id,
      status: { $in: ["CREATED", "AUTHORIZED"] },
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Existing payment order retrieved",
        order: {
          id: existingPayment.gatewayOrderId,
          amount: existingPayment.amountPaise,
          currency: existingPayment.currency,
        },
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: booking.pricePaise,
      currency: booking.currency,
      receipt: `booking_${booking._id}`,
      notes: {
        bookingId: booking._id.toString(),
        studentId: req.user._id.toString(),
      },
    });

    await PaymentModel.create({
      bookingId: booking._id,
      gateway: "razorpay",
      gatewayOrderId: order.id,
      amountPaise: booking.pricePaise,
      currency: booking.currency,
      status: "CREATED",
    });

    return res.status(201).json({
      success: true,
      message: "Payment order created successfully",
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Create payment order error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order",
    });
  }
};



const verifyPayment = async (req, res) => {
  try {
    const {
      bookingId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      !mongoose.isValidObjectId(bookingId) ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Booking ID and all Razorpay payment fields are required",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Razorpay keys are not configured",
      });
    }

    const booking = await BookingModel.findOne({
      _id: bookingId,
      studentId: req.user._id,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    const payment = await PaymentModel.findOne({
      bookingId: booking._id,
      gatewayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment order not found for this booking",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid Razorpay payment signature",
      });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const providerPayment = await razorpay.payments.fetch(
      razorpay_payment_id
    );

    if (
      providerPayment.order_id !== razorpay_order_id ||
      providerPayment.amount !== payment.amountPaise ||
      providerPayment.currency !== payment.currency
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment details do not match our order",
      });
    }

    if (providerPayment.status !== "captured") {
      return res.status(409).json({
        success: false,
        message: "Payment is not captured yet",
        providerStatus: providerPayment.status,
      });
    }

    const result = await processCapturedPayment({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      amount: providerPayment.amount,
      currency: providerPayment.currency,
      providerStatus: providerPayment.status,
      source: "frontend_verification",
    });

    return res.status(200).json({
  success: true,
  message: result.alreadyCaptured
    ? "Payment was already processed"
    : "Payment verified and processed",
  paymentStatus: result.paymentStatus,
  bookingStatus: result.bookingStatus,
  amountPaise: payment.amountPaise,
  currency: payment.currency,
  commissionPaise: booking.commissionPaise,
  mentorGrossPaise: booking.mentorGrossPaise,
});
  } catch (error) {
    console.error("Verify payment error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Payment verification failed. Check payment status before retrying.",
    });
  }
};

const requestPaymentRefund = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason = "Admin-approved booking refund" } = req.body || {};

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Valid bookingId is required",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Refund reason is required",
      });
    }

    if (
      !process.env.RAZORPAY_KEY_ID ||
      !process.env.RAZORPAY_KEY_SECRET
    ) {
      return res.status(500).json({
        success: false,
        message: "Razorpay keys are not configured",
      });
    }

    const result = await refundPayment({
      bookingId,
      reason: reason.trim().slice(0, 500),
      requestedById: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message:
        result.refundStatus === "PROCESSED"
          ? "Refund processed successfully"
          : "Refund submitted; provider confirmation is pending",
      refundId: result.refund.providerRefundId,
      refundStatus: result.refundStatus,
      paymentStatus: result.paymentStatus,
    });
  } catch (error) {
    console.error("Request payment refund error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Failed to request refund. Check refund status before retrying.",
    });
  }
};
      
module.exports = {
  createPaymentOrder,
  verifyPayment,
  requestPaymentRefund,
};