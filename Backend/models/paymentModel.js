
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "bookingModel",
      ref: "Booking",
      required: true,
      index: true,
    },

    gateway: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
      required: true,
    },

    gatewayOrderId: {
      type: String,
      trim: true,
      required: true,
    },

    gatewayPaymentId: {
      type: String,
      trim: true,
      default: undefined,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },

    currency: {
      type: String,
      enum: ["INR"],
      default: "INR",
    },

    status: {
      type: String,
      enum: [
        "CREATED",
        "AUTHORIZED",
        "CAPTURED",
        "FAILED",
        "PARTIALLY_REFUNDED",
        "REFUNDED",
      ],
      default: "CREATED",
      required: true,
      index: true,
    },

    
refundId: {
  type: String,
  trim: true,
  default: null,
},

refundAmountPaise: {
  type: Number,
  min: 0,
  default: 0,
},

refundStatus: {
  type: String,
  enum: ["NOT_REQUESTED", "PENDING", "PROCESSED", "FAILED"],
  default: "NOT_REQUESTED",
  index: true,
},

refundRequestedAt: {
  type: Date,
  default: null,
},

refundProcessedAt: {
  type: Date,
  default: null,
},

    capturedAt: {
      type: Date,
      default: null,
    },

    rawProviderRefs: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index(
  { gatewayPaymentId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      gatewayPaymentId: { $type: "string" },
    },
  }
);

const PaymentModel = mongoose.model("PaymentModel", paymentSchema);

module.exports = PaymentModel;