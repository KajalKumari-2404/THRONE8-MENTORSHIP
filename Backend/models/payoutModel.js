
const mongoose = require("mongoose");

const payoutSchema = new mongoose.Schema(
  {
    earningId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EarningModel",
      required: true,
      index: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },

    providerTransferId: {
      type: String,
      default: null,
      unique: true,
      sparse: true,
      trim: true,
    },

    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },

    state: {
      type: String,
      enum: [
        "QUEUED",
        "INITIATED",
        "PROCESSING",
        "SUCCEEDED",
        "FAILED",
        "CANCELLED",
      ],
      default: "QUEUED",
      required: true,
      index: true,
    },

    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    initiatedAt: {
      type: Date,
      default: null,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    failureCode: {
      type: String,
      default: null,
      trim: true,
    },

    failureMessage: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const PayoutModel = mongoose.model("PayoutModel", payoutSchema);

module.exports = PayoutModel;