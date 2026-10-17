
const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  listAdminRefunds,
} = require("../controllers/adminRefundListController");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/", listAdminRefunds);

module.exports = router;
