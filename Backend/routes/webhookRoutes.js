
const express = require("express");
const { handleRazorpayWebhook } = require("../controllers/webhookController");

const router = express.Router();

// Razorpay sends a raw JSON body for signature verification.
router.post(
  "/razorpay",
  express.raw({ type: "application/json" }),
  handleRazorpayWebhook
);

module.exports = router;