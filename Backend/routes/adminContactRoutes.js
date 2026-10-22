
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  listAdminContactMessages,
  updateContactMessageStatus,
} = require("../controllers/adminContactController");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/contact-messages", listAdminContactMessages);
router.patch("/contact-messages/:id/status", updateContactMessageStatus);

module.exports = router;