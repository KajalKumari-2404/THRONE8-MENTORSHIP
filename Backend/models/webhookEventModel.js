
const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    gateway: {
      type: String,
      enum: ["razorpay"],
      default: "razorpay",
      required: true,
    },

    eventId: {
      type: String,
      required: true,
      trim: true,
    },

    eventType: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["RECEIVED", "PROCESSING", "PROCESSED", "FAILED"],
      default: "RECEIVED",
      required: true,
      index: true,
    },

    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },

    processedAt: {
      type: Date,
      default: null,
    },

    lastError: {
      type: String,
      default: null,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);

// Same gateway event must be stored only once.
webhookEventSchema.index(
  { gateway: 1, eventId: 1 },
  { unique: true }
);

const WebhookEventModel = mongoose.model(
  "WebhookEventModel",
  webhookEventSchema
);

module.exports = WebhookEventModel;