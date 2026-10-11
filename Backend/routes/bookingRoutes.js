
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  createBooking,
  requestSessionCompletion,
  confirmSessionCompletion,
  disputeSessionCompletion,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", protect, authorize("STUDENT"), createBooking);

router.patch(
  "/:bookingId/request-completion",
  protect,
  authorize("MENTOR"),
  requestSessionCompletion
);

router.patch(
  "/:bookingId/confirm-completion",
  protect,
  authorize("STUDENT"),
  confirmSessionCompletion
);

router.patch(
  "/:bookingId/dispute-completion",
  protect,
  authorize("STUDENT"),
  disputeSessionCompletion
);

module.exports = router;