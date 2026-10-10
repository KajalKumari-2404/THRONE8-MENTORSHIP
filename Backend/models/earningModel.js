
const mongoose = require("mongoose");

const earningSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "BookingModel",
      required: true,
      unique: true,
    },

    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    grossPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    commissionPaise: {
      type: Number,
      required: true,
      min: 0,
    },

    payablePaise: {
      type: Number,
      required: true,
      min: 0,
    },

    eligibleAt: {
      type: Date,
      default: null,
      index: true,
    },

    state: {
      type: String,
      enum: [
        "PENDING_SESSION",
        "HOLDING",
        "ELIGIBLE",
        "PROCESSING",
        "PAID",
        "ON_HOLD",
        "REVERSED",
      ],
      default: "PENDING_SESSION",
      required: true,
      index: true,
    },

    holdReason: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const EarningModel = mongoose.model("EarningModel", earningSchema);

module.exports = EarningModel;