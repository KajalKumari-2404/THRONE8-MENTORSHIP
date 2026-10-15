const PaymentModel = require("../models/paymentModel");
const BookingModel = require("../models/bookingModel");
const EarningModel = require("../models/earningModel");
const PayoutModel = require("../models/payoutModel");
const RefundModel = require("../models/refundModel");
const LedgerEntryModel = require("../models/ledgerEntryModel");

const moneySummary = (items, field) =>
  items.reduce((total, item) => total + (item[field] || 0), 0);

const getAdminFinanceSummary = async (req, res) => {
  try {
    const [
      paymentCounts,
      capturedPayments,
      bookingsByStatus,
      earningsByState,
      payoutsByState,
      refundsByStatus,
      ledgerTotals,
      recentPayments,
    ] = await Promise.all([
      PaymentModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      PaymentModel.aggregate([
        { $match: { status: { $in: ["CAPTURED", "PARTIALLY_REFUNDED"] } } },
        {
          $group: {
            _id: null,
            totalPaise: { $sum: "$amountPaise" },
            count: { $sum: 1 },
          },
        },
      ]),

      BookingModel.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      EarningModel.aggregate([
        {
          $group: {
            _id: "$state",
            amountPaise: { $sum: "$payablePaise" },
            count: { $sum: 1 },
          },
        },
      ]),

      PayoutModel.aggregate([
        {
          $group: {
            _id: "$state",
            amountPaise: { $sum: "$amountPaise" },
            count: { $sum: 1 },
          },
        },
      ]),

      RefundModel.aggregate([
        {
          $group: {
            _id: "$status",
            amountPaise: { $sum: "$amountPaise" },
            count: { $sum: 1 },
          },
        },
      ]),

      LedgerEntryModel.aggregate([
        {
          $group: {
            _id: { account: "$account", direction: "$direction" },
            amountPaise: { $sum: "$amountPaise" },
            count: { $sum: 1 },
          },
        },
      ]),

      PaymentModel.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select("bookingId amountPaise currency status gateway gatewayPaymentId createdAt")
        .lean(),
    ]);

    return res.status(200).json({
      success: true,
      summary: {
        capturedGrossPaise: capturedPayments[0]?.totalPaise || 0,
        capturedPaymentCount: capturedPayments[0]?.count || 0,
        paymentStatuses: paymentCounts,
        bookingStatuses: bookingsByStatus,
        earnings: earningsByState,
        payouts: payoutsByState,
        refunds: refundsByStatus,
        ledger: ledgerTotals,
      },
      recentPayments,
    });
  } catch (error) {
    console.error("Admin finance summary error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load admin finance summary.",
    });
  }
};

module.exports = { getAdminFinanceSummary };