
const crypto = require("node:crypto");
const WebhookEventModel = require("../models/webhookEventModel");

const handleRazorpayWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    const eventId = req.headers["x-razorpay-event-id"];

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
      return res.status(500).json({
        success: false,
        message: "Webhook configuration error",
      });
    }

    if (!Buffer.isBuffer(req.body) || !signature || !eventId) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request",
      });
    }

    // Verify signature using the exact raw request body.
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const received = Buffer.from(signature, "utf8");
    const expected = Buffer.from(expectedSignature, "utf8");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    let payload;

    try {
      payload = JSON.parse(req.body.toString("utf8"));
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid JSON payload",
      });
    }

    const eventType = payload.event;

    if (!eventType) {
      return res.status(400).json({
        success: false,
        message: "Missing event type",
      });
    }

    // Record the event once. Duplicate delivery is expected from gateways.
    try {
      await WebhookEventModel.create({
        gateway: "razorpay",
        eventId,
        eventType,
        status: "RECEIVED",
        attempts: 1,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(200).json({
          success: true,
          message: "Duplicate webhook already received",
        });
      }

      throw error;
    }

    // Payment/booking state changes will be added after this
    // verified event is safely recorded.
    return res.status(200).json({
      success: true,
      message: "Webhook signature verified and event recorded",
    });
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

module.exports = { handleRazorpayWebhook };