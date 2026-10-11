
const EarningModel = require("../models/earningModel");
const PayoutModel = require("../models/payoutModel");

const getMyEarnings = async (req, res) => {
  try {
    const mentorId = req.user._id;

    const earnings = await EarningModel.find({ mentorId })
      .sort({ createdAt: -1 })
      .lean();

    const payouts = await PayoutModel.find({ mentorId })
      .sort({ createdAt: -1 })
      .lean();

    const totals = {
      totalEarnedPaise: 0,
      pendingSessionPaise: 0,
      holdingPaise: 0,
      eligiblePaise: 0,
      processingPaise: 0,
      paidPaise: 0,
      onHoldPaise: 0,
      reversedPaise: 0,
    };

    for (const earning of earnings) {
      if (earning.state !== "REVERSED") {
        totals.totalEarnedPaise += earning.payablePaise;
      }

      switch (earning.state) {
        case "PENDING_SESSION":
          totals.pendingSessionPaise += earning.payablePaise;
          break;
        case "HOLDING":
          totals.holdingPaise += earning.payablePaise;
          break;
        case "ELIGIBLE":
          totals.eligiblePaise += earning.payablePaise;
          break;
        case "PROCESSING":
          totals.processingPaise += earning.payablePaise;
          break;
        case "PAID":
          totals.paidPaise += earning.payablePaise;
          break;
        case "ON_HOLD":
          totals.onHoldPaise += earning.payablePaise;
          break;
        case "REVERSED":
          totals.reversedPaise += earning.payablePaise;
          break;
        default:
          break;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Mentor earnings fetched successfully",
      currency: "INR",
      summary: totals,
      earnings,
      payouts,
    });
  } catch (error) {
    console.error("Get mentor earnings error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch mentor earnings",
    });
  }
};

module.exports = { getMyEarnings };