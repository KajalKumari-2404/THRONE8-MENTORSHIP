
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const { getAvailableMentors } = require("../controllers/mentorController");

const router = express.Router();

router.get(
  "/available",
  protect,
  authorize("STUDENT"),
  getAvailableMentors
);

module.exports = router;