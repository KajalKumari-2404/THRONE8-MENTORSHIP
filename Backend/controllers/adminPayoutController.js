const mongoose = require("mongoose");

const EarningModel = require("../models/earningModel");
const PayoutModel = require("../models/payoutModel");
const MentorAccountModel = require("../models/mentorAccountModel");
const { approvePayout, retryPayout } = require("../services/payoutService");
const { logAudit } = require("../services/auditLog");

const listPayouts = async (req, res) => {
  try {
    const state = (req.query.state || "ELIGIBLE").toUpperCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);

    const validStates = [
      "PENDING_SESSION",
      "HOLDING",
      "ELIGIBLE",
      "PROCESSING",
      "PAID",
      "ON_HOLD",
      "REVERSED",
    ];

    if (!validStates.includes(state)) {
      return res.status(400).json({ success: false, message: "Invalid state" });
    }

    const [earnings, total] = await Promise.all([
      EarningModel.find({ state })
        .populate("mentorId", "name email")
        .sort({ eligibleAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      EarningModel.countDocuments({ state }),
    ]);

    const earningIds = earnings.map((e) => e._id);
    const payouts = await PayoutModel.find({ earningId: { $in: earningIds } })
      .sort({ createdAt: -1 })
      .lean();
    const latestPayoutByEarning = new Map();
    for (const p of payouts) {
      const key = String(p.earningId);
      if (!latestPayoutByEarning.has(key)) latestPayoutByEarning.set(key, p);
    }

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      earnings: earnings.map((e) => ({
        ...e,
        latestPayout: latestPayoutByEarning.get(String(e._id)) || null,
      })),
    });
  } catch (error) {
    console.error("List payouts error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to list payouts" });
  }
};

const approvePayoutHandler = async (req, res) => {
  try {
    const { earningId } = req.params;

    if (!mongoose.isValidObjectId(earningId)) {
      return res.status(400).json({ success: false, message: "Invalid earning ID" });
    }

    const { payout, earning } = await approvePayout({
      earningId,
      adminId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message:
        payout.state === "SUCCEEDED"
          ? "Payout settled successfully"
          : "Payout attempt failed; it can be retried",
      payout,
      earningState: earning.state,
    });
  } catch (error) {
    console.error("Approve payout error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to approve payout",
    });
  }
};

const retryPayoutHandler = async (req, res) => {
  try {
    const { payoutId } = req.params;

    if (!mongoose.isValidObjectId(payoutId)) {
      return res.status(400).json({ success: false, message: "Invalid payout ID" });
    }

    const { payout, earning } = await retryPayout({
      payoutId,
      adminId: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message:
        payout.state === "SUCCEEDED"
          ? "Retry succeeded; payout settled"
          : "Retry failed again; check failureMessage",
      payout,
      earningState: earning.state,
    });
  } catch (error) {
    console.error("Retry payout error:", error.message);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : "Failed to retry payout",
    });
  }
};

const setMentorCommission = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const { rateBps } = req.body;

    if (!mongoose.isValidObjectId(mentorId)) {
      return res.status(400).json({ success: false, message: "Invalid mentor ID" });
    }

    if (
      typeof rateBps !== "number" ||
      !Number.isInteger(rateBps) ||
      rateBps < 0 ||
      rateBps > 10000
    ) {
      return res.status(400).json({
        success: false,
        message: "rateBps must be an integer between 0 and 10000",
      });
    }

    const before = await MentorAccountModel.findOne({ mentorId }).lean();

    const mentorAccount = await MentorAccountModel.findOneAndUpdate(
      { mentorId },
      { $set: { commissionRateBps: rateBps } },
      { new: true }
    );

    if (!mentorAccount) {
      return res.status(404).json({ success: false, message: "Mentor account not found" });
    }

    await logAudit({
      actorId: req.user._id,
      actorRole: "ADMIN",
      action: "SET_MENTOR_COMMISSION",
      entityType: "MENTOR_ACCOUNT",
      entityId: mentorAccount._id,
      before: { commissionRateBps: before?.commissionRateBps ?? null },
      after: { commissionRateBps: rateBps },
    });

    return res.status(200).json({
      success: true,
      message: "Commission rate updated. Applies to future bookings only.",
      mentorAccount,
    });
  } catch (error) {
    console.error("Set mentor commission error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to update commission" });
  }
};

const listMentorAccounts = async (req, res) => {
  try {
    const accounts = await MentorAccountModel.find()
      .populate("mentorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({ success: true, accounts });
  } catch (error) {
    console.error("List mentor accounts error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to list mentor accounts" });
  }
};

module.exports = {
  listPayouts,
  approvePayoutHandler,
  retryPayoutHandler,
  setMentorCommission,
  listMentorAccounts,
};