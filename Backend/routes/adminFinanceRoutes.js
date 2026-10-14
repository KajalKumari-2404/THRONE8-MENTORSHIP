
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  getAdminFinanceSummary,
} = require("../controllers/adminFinanceController");

const {
  adminRefundHandler,
} = require("../controllers/adminRefundController");

const router = express.Router();

// Existing admin finance summary
router.get(
  "/summary",
  protect,
  authorize("ADMIN"),
  getAdminFinanceSummary
);

// Admin-only refund endpoint
router.post(
  "/refunds/:bookingId",
  protect,
  authorize("ADMIN"),
  adminRefundHandler
);

module.exports = router;
