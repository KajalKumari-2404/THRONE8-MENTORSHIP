const express = require("express");
const { protect, authorize } = require("../middleware/authMiddleware");
const {
  listPayouts,
  approvePayoutHandler,
  retryPayoutHandler,
  setMentorCommission,
  listMentorAccounts,
} = require("../controllers/adminPayoutController");

const router = express.Router();

router.use(protect, authorize("ADMIN"));

router.get("/payouts", listPayouts);
router.post("/payouts/:earningId/approve", approvePayoutHandler);
router.post("/payouts/:payoutId/retry", retryPayoutHandler);

router.get("/mentors", listMentorAccounts);
router.post("/mentors/:mentorId/commission", setMentorCommission);

module.exports = router;