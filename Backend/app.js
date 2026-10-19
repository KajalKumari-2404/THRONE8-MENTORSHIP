
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const { protect } = require("./middleware/authMiddleware");
const bookingRoutes = require("./routes/bookingRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const authRoutes = require("./routes/authRoutes");
const webhookRoutes = require("./routes/webhookRoutes");
const mentorEarningsRoutes = require("./routes/mentorEarningsRoutes");
const adminFinanceRoutes = require("./routes/adminFinanceRoutes");
const adminPayoutRoutes = require("./routes/adminPayoutRoutes");
const mentorRoutes = require("./routes/mentorRoutes");
const adminRefundRoutes = require("./routes/adminRefundRoutes");
const adminContactRoutes = require("./routes/adminContactRoutes");
const contactRoutes = require("./routes/contactRoutes");
const adminBookingRoutes = require("./routes/adminBookingRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

// Webhook ko JSON parser se pehle mount karna zaroori hai.
app.use("/api/v1/webhooks", webhookRoutes);

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "THRONE8 Mentorship API is running",
  });
});

app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
    timestamp: new Date().toISOString(),
  });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/mentor/earnings", mentorEarningsRoutes);
app.use("/api/v1/admin/finance", adminFinanceRoutes);
app.use("/api/v1/admin", adminPayoutRoutes);
app.use("/api/v1/mentors", mentorRoutes);
app.use("/api/v1/admin/refunds", adminRefundRoutes);
app.use("/api/v1/admin", adminContactRoutes);
app.use("/api/v1/admin/bookings", adminBookingRoutes);
app.use("/api/v1/admin", adminUserRoutes);
app.use("/api/v1/contact", contactRoutes);

app.get("/api/v1/auth/me", protect, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user fetched successfully",
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

module.exports = app;