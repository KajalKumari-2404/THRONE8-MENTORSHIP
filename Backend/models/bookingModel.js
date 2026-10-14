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

    completionRequestedAt: {
      type: Date,
      default: null,
    },

    studentConfirmedAt: {
      type: Date,
      default: null,
    },

    completionDisputedAt: {
      type: Date,
      default: null,
      index: true,
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

    // Deterministic key so re-submitting the same booking intent
    // never creates two gateway orders for the same slot/student.
    idempotencyKey: {
      type: String,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce one active (not yet paid-and-expired, not cancelled/expired) booking
// per mentor+slot at the database level. Without this, two students racing
// to book the same slot can both succeed before either one pays.
bookingSchema.index(
  { mentorId: 1, slotStart: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["PENDING_PAYMENT", "CONFIRMED"] },
    },
    name: "unique_active_slot",
  }
);

const BookingModel = mongoose.model("Booking", bookingSchema);

module.exports = BookingModel;