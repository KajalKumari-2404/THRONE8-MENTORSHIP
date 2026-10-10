
const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
} = require("../controllers/paymentController");

const router = express.Router();

// Create Razorpay order
router.post(
  "/orders",
  protect,
  authorize("STUDENT"),
  createPaymentOrder
);

// Verify Razorpay payment
router.post(
  "/verify",
  protect,
  authorize("STUDENT"),
  verifyPayment
);

module.exports = router;