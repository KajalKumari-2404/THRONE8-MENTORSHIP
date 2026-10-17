
const RefundModel = require("../models/refundModel");
const PaymentModel = require("../models/paymentModel");

const listAdminRefunds = async (req, res) => {
  try {
    const { status = "ALL", page = 1, limit = 20 } = req.query;

    const allowedStatuses = [
      "REQUESTED",
      "PENDING",
      "PROCESSED",
      "FAILED",
      "CANCELLED",
    ];

    if (status !== "ALL" && !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid refund status",
      });
    }

    const currentPage = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(limit) || 20));

    const filter =
      status === "ALL" ? {} : { status };

    const [refunds, total] = await Promise.all([
      RefundModel.find(filter)
        .populate({
          path: "paymentId",
          select: "bookingId amountPaise currency status refundStatus gatewayPaymentId",
        })
        .populate("requestedBy", "name email")
        .populate("approvedBy", "name email")
        .sort({ createdAt: -1 })
        .skip((currentPage - 1) * pageSize)
        .limit(pageSize)
        .lean(),

      RefundModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      refunds,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Admin refund listing error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch refund records",
    });
  }
};

module.exports = { listAdminRefunds };
