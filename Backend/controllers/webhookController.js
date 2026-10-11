
const crypto = require("node:crypto");

const WebhookEventModel = require("../models/webhookEventModel");
const { processCapturedPayment } = require("../services/processCapturedPayment");

const handleRazorpayWebhook = async (req, res) => {
  let eventId;

  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers["x-razorpay-signature"];
    eventId = req.headers["x-razorpay-event-id"];

    if (!webhookSecret) {
      console.error("RAZORPAY_WEBHOOK_SECRET is not configured");

      return res.status(500).json({
        success: false,
        message: "Webhook configuration error",
      });
    }

    if (
      !Buffer.isBuffer(req.body) ||
      typeof signature !== "string" ||
      typeof eventId !== "string" ||
      !eventId.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook request",
      });
    }

    // Verify Razorpay signature against the original raw request body.
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(req.body)
      .digest("hex");

    const received = Buffer.from(signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected) ||
      !/^[a-f0-9]{64}$/i.test(signature)
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

    // Claim the event using the unique gateway + event ID index.
    let eventRecord;

    try {
      eventRecord = await WebhookEventModel.create({
        gateway: "razorpay",
        eventId,
        eventType,
        status: "PROCESSING",
        attempts: 1,
      });
    } catch (error) {
      if (error.code !== 11000) {
        throw error;
      }

      eventRecord = await WebhookEventModel.findOne({
        gateway: "razorpay",
        eventId,
      });

      if (!eventRecord) {
        throw error;
      }

      if (eventRecord.status === "PROCESSED") {
        return res.status(200).json({
          success: true,
          message: "Webhook already processed",
        });
      }

      // Avoid two deliveries processing the same event concurrently.
      if (eventRecord.status === "PROCESSING") {
        return res.status(200).json({
          success: true,
          message: "Webhook is already being processed",
        });
      }

      // Retry an event previously marked FAILED.
      const retry = await WebhookEventModel.updateOne(
        {
          _id: eventRecord._id,
          status: "FAILED",
        },
        {
          $set: {
            status: "PROCESSING",
            lastError: null,
          },
          $inc: { attempts: 1 },
        }
      );

      if (retry.modifiedCount !== 1) {
        return res.status(200).json({
          success: true,
          message: "Webhook is already being processed",
        });
      }

      eventRecord = await WebhookEventModel.findById(eventRecord._id);
    }

    try {
      if (["payment.captured", "order.paid"].includes(eventType)) {
        const paymentEntity =
          eventType === "payment.captured"
            ? payload.payload?.payment?.entity
            : payload.payload?.payment?.entity;

        if (
          !paymentEntity ||
          !paymentEntity.order_id ||
          !paymentEntity.id
        ) {
          throw new Error("Captured payment data is missing");
        }

        await processCapturedPayment({
          orderId: paymentEntity.order_id,
          paymentId: paymentEntity.id,
          amount: paymentEntity.amount,
          currency: paymentEntity.currency,
          providerStatus: paymentEntity.status,
          source: `webhook:${eventType}`,
        });
      }

      // Other configured event types are acknowledged and recorded.
      // Payment failure/refund accounting should be implemented separately.
      await WebhookEventModel.updateOne(
        { _id: eventRecord._id },
        {
          $set: {
            status: "PROCESSED",
            processedAt: new Date(),
            lastError: null,
          },
        }
      );

      return res.status(200).json({
        success: true,
        message: "Webhook processed successfully",
      });
    } catch (processingError) {
      await WebhookEventModel.updateOne(
        { _id: eventRecord._id },
        {
          $set: {
            status: "FAILED",
            lastError: processingError.message.slice(0, 1000),
          },
        }
      );

      throw processingError;
    }
  } catch (error) {
    console.error("Razorpay webhook error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
};

module.exports = { handleRazorpayWebhook };