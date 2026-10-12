
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getAdminFinanceSummary,
} = require("../controllers/adminFinanceController");

const router = express.Router();

router.get(
  "/summary",
  protect,
  authorize("ADMIN"),
  getAdminFinanceSummary
);

module.exports = router;