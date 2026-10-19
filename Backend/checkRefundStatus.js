
require("dotenv").config();

const Razorpay = require("razorpay");
// const mongoose = require("mongoose");
const connectDB = require("./config/db");

const PaymentModel = require("./models/paymentModel");
const RefundModel = require("./models/refundModel");

async function main() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay credentials are not configured");
  }

//   await mongoose.connect(process.env.MONGODB_URI);
// await mongoose.connect(process.env.MONGO_URI);
await connectDB();

  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  const refundId = "rfnd_TnpkepmeaqoTZb";
  const expectedPaymentId = "pay_TmBYDlmQn8t2PN";

  // Read-only Razorpay API request.
  const providerRefund = await razorpay.refunds.fetch(refundId);

  console.log("\n--- RAZORPAY REFUND ---");
  console.log({
    id: providerRefund.id,
    payment_id: providerRefund.payment_id,
    amount: providerRefund.amount,
    status: providerRefund.status,
  });

  if (providerRefund.payment_id !== expectedPaymentId) {
    throw new Error("Provider payment ID does not match the expected payment");
  }

//   const payment = await PaymentModel.findOne({
//     gatewayPaymentId: expectedPaymentId,
//   }).lean();

//   const refund = await RefundModel.findOne({
//     providerRefundId: refundId,
//   }).lean();

const refund = await RefundModel.findOne({
  providerRefundId: refundId,
}).lean();

const paymentByGatewayId = await PaymentModel.findOne({
  gatewayPaymentId: expectedPaymentId,
}).lean();

const linkedPayment = refund?.paymentId
  ? await PaymentModel.findById(refund.paymentId).lean()
  : null;

console.log("\n--- PAYMENT LOOKUP ---");
console.log({
  paymentByGatewayIdFound: Boolean(paymentByGatewayId),
  linkedPaymentFound: Boolean(linkedPayment),
  linkedPaymentId: linkedPayment ? String(linkedPayment._id) : null,
  linkedGatewayPaymentId: linkedPayment?.gatewayPaymentId ?? null,
  linkedBookingId: linkedPayment?.bookingId
    ? String(linkedPayment.bookingId)
    : null,
});

const bookingPayments = await PaymentModel.find({
  bookingId: "6aca1be110278f43f9171e7f",
})
  .select(
    "_id bookingId gatewayPaymentId status refundStatus amountPaise refundAmountPaise"
  )
  .lean();

console.log("\n--- PAYMENTS FOR REFUNDED BOOKING ---");
console.log(bookingPayments);

const BookingModel = require("./models/bookingModel");
const LedgerEntryModel = require("./models/ledgerEntryModel");
const EarningModel = require("./models/earningModel");

const bookingId = "6aca1be110278f43f9171e7f";

const booking = await BookingModel.findById(bookingId).lean();

console.log("\n--- REFUNDED BOOKING ---");
console.log(
  booking
    ? {
        _id: booking._id,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        amountPaise: booking.amountPaise,
      }
    : "Booking record not found"
);

const ledgerEntries = await LedgerEntryModel.find({
  $or: [
    { bookingId },
    { referenceId: bookingId },
  ],
})
  .lean();

console.log("\n--- BOOKING LEDGER ENTRIES ---");
console.log(ledgerEntries);

const earnings = await EarningModel.find({ bookingId }).lean();

console.log("\n--- BOOKING EARNINGS ---");
console.log(earnings);

  console.log("\n--- LOCAL PAYMENT ---");
  console.log(
    // payment
    linkedPayment
      ? {
          id: String(payment._id),
          bookingId: String(payment.bookingId),
          status: payment.status,
          refundStatus: payment.refundStatus,
          refundAmountPaise: payment.refundAmountPaise,
        }
      : "Payment record not found"
  );

  console.log("\n--- LOCAL REFUND ---");
  console.log(
    refund
      ? {
          id: String(refund._id),
          paymentId: refund.paymentId ? String(refund.paymentId) : null,
          amountPaise: refund.amountPaise,
          status: refund.status,
          providerRefundId: refund.providerRefundId,
          processedAt: refund.processedAt,
        }
      : "Refund record not found"
  );
}

main()
  .catch((error) => {
    console.error("Verification failed:", error.message);
    process.exitCode = 1;
  })
//   .finally(async () => {
//     await mongoose.disconnect().catch(() => {});
//   });

.finally(async () => {
  const mongoose = require("mongoose");
  await mongoose.disconnect().catch(() => {});
});
