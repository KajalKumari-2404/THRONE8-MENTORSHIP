
const mongoose = require("mongoose");

const ledgerEntrySchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      // ref: "BookingModel",
      ref: "Booking",
      required: true,
      index: true,
    },

    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentModel",
      default: null,
    },

    entryType: {
      type: String,
      enum: [
        "PAYMENT_CAPTURED",
        "PLATFORM_COMMISSION",
        "MENTOR_EARNING",
        "REFUND",
        "PAYOUT",
        "REVERSAL",
      ],
      required: true,
    },

    account: {
      type: String,
      enum: ["PLATFORM", "MENTOR", "STUDENT", "GATEWAY"],
      required: true,
    },

    direction: {
      type: String,
      enum: ["CREDIT", "DEBIT"],
      required: true,
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

    eventKey: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const LedgerEntryModel = mongoose.model(
  "LedgerEntryModel",
  ledgerEntrySchema
);

module.exports = LedgerEntryModel;