
const express = require("express");
const router = express.Router();

const Booking = require("../models/bookingModel");
const {
  protect,
  authorize,
} = require("../middleware/authMiddleware");

// Admin-only: view bookings across students and mentors
router.get("/", protect, authorize("ADMIN"), async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 20)
    );

    const filter = {};

    if (req.query.status) {
      const allowedStatuses = [
        "PENDING_PAYMENT",
        "CONFIRMED",
        "COMPLETED",
        "EXPIRED",
        "CANCELLED",
        "DISPUTED",
      ];

      if (!allowedStatuses.includes(req.query.status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid booking status.",
        });
      }

      filter.status = req.query.status;
    }

    const [bookings, total] = await Promise.all([
      Booking.find(filter)
        .populate("studentId", "name email")
        .populate("mentorId", "name email")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Booking.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      bookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Admin bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not load bookings.",
    });
  }
});

module.exports = router;
