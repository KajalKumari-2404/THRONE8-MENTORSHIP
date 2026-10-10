
const mongoose = require("mongoose");

const mentorAccountSchema = new mongoose.Schema(
  {
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    commissionRateBps: {
      type: Number,
      required: true,
      default: 2000,
      min: 0,
      max: 10000,
    },

    payoutProvider: {
      type: String,
      enum: ["razorpay", "cashfree"],
      default: "razorpay",
    },

    providerAccountId: {
      type: String,
      default: null,
      trim: true,
    },

    verificationStatus: {
      type: String,
      enum: ["PENDING", "VERIFIED", "REJECTED"],
      default: "PENDING",
      required: true,
      index: true,
    },

    payoutEnabled: {
      type: Boolean,
      default: false,
    },

    accountDetailsVerifiedAt: {
      type: Date,
      default: null,
    },

    verificationNotes: {
      type: String,
      default: null,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

// const MentorAccountModel = mongoose.model(
//   "MentorAccountModel",
//   mentorAccountSchema
// );

const MentorAccountModel = mongoose.model(
  "MentorAccountModel",
  mentorAccountSchema,
  "mentoraccounts"
);

module.exports = MentorAccountModel;