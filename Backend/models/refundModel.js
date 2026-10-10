
const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentModel",
      required: true,
      index: true,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },

    providerRefundId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      trim: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: [
        "REQUESTED",
        "PENDING",
        "PROCESSED",
        "FAILED",
        "CANCELLED",
      ],
      default: "REQUESTED",
      required: true,
      index: true,
    },

    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const RefundModel = mongoose.model("RefundModel", refundSchema);

module.exports = RefundModel;