
const express = require("express");

const { protect, authorize } = require("../middleware/authMiddleware");

const {
  createBooking,
  getMyBookings,
  requestSessionCompletion,
  confirmSessionCompletion,
  disputeSessionCompletion,
  getMentorBookings,
} = require("../controllers/bookingController");

const router = express.Router();

// Create a booking
router.post("/", protect, authorize("STUDENT"), createBooking);

// Fetch bookings for the logged-in student
router.get(
  "/my-bookings",
  protect,
  authorize("STUDENT"),
  getMyBookings
);

router.get(
  "/mentor-bookings",
  protect,
  authorize("MENTOR"),
  getMentorBookings
);

// Mentor requests session completion
router.patch(
  "/:bookingId/request-completion",
  protect,
  authorize("MENTOR"),
  requestSessionCompletion
);

// Student confirms session completion
router.patch(
  "/:bookingId/confirm-completion",
  protect,
  authorize("STUDENT"),
  confirmSessionCompletion
);

// Student disputes session completion
router.patch(
  "/:bookingId/dispute-completion",
  protect,
  authorize("STUDENT"),
  disputeSessionCompletion
);

module.exports = router;