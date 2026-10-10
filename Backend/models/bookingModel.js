
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    slotStart: {
      type: Date,
      required: true,
    },

    slotEnd: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.slotStart;
        },
        message: "Slot end must be after slot start",
      },
    },

    pricePaise: {
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
        "PENDING_PAYMENT",
        "CONFIRMED",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
        "DISPUTED",
      ],
      default: "PENDING_PAYMENT",
      index: true,
    },

    holdExpiresAt: {
      type: Date,
      required: true,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    commissionRateBps: {
      type: Number,
      required: true,
      default: 2000,
      min: 0,
      max: 10000,
    },

    commissionPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    mentorGrossPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    payoutEligibleAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const BookingModel = mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;