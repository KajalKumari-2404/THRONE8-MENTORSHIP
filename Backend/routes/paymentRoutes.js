
const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createPaymentOrder,
  verifyPayment,
  requestPaymentRefund,
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


router.post(
  "/:bookingId/refund",
  protect,
  authorize("ADMIN"),
  requestPaymentRefund
);

module.exports = router;