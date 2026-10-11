
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  getMyEarnings,
} = require("../controllers/mentorEarningsController");

const router = express.Router();

router.get("/", protect, authorize("MENTOR"), getMyEarnings);

module.exports = router;