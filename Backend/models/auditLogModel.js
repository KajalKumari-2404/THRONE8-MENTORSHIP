
const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    actorRole: {
      type: String,
      enum: ["STUDENT", "MENTOR", "ADMIN", "SYSTEM"],
      required: true,
    },

    action: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    entityType: {
      type: String,
      enum: [
        "BOOKING",
        "PAYMENT",
        "EARNING",
        "PAYOUT",
        "REFUND",
        "MENTOR_ACCOUNT",
        "SYSTEM",
      ],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },

    ipAddress: {
      type: String,
      default: null,
    },

    requestId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const AuditLogModel = mongoose.model(
  "AuditLogModel",
  auditLogSchema
);

module.exports = AuditLogModel;