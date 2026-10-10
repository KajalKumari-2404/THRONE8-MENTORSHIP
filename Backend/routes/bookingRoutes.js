
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { createBooking } = require("../controllers/bookingController");

const router = express.Router();

router.post("/", protect, authorize("STUDENT"), createBooking);

module.exports = router;