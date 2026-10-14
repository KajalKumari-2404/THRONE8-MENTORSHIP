
const mongoose = require("mongoose");
const { refundPayment } = require("../services/refundService");

const adminRefundHandler = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!mongoose.isValidObjectId(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID",
      });
    }

    if (typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Refund reason is required",
      });
    }

    if (reason.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: "Refund reason cannot exceed 500 characters",
      });
    }

    const result = await refundPayment({
      bookingId,
      reason: reason.trim(),
      requestedById: req.user._id,
    });

    return res.status(200).json({
      success: true,
      message: "Refund request processed",
      ...result,
    });
  } catch (error) {
    console.error("Admin refund error:", error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode
        ? error.message
        : "Refund processing failed. Check refund status before retrying.",
    });
  }
};

module.exports = { adminRefundHandler };
