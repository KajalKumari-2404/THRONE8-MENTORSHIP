
import { useState } from "react";
import { useLocation } from "react-router-dom";
import "./App.css";

import SessionCompletion from "./SessionCompletion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MentorEarnings from "./pages/MentorEarnings";
import ProtectedRoute from "./ProtectedRoute";
import MentorDiscovery from "./pages/MentorDiscovery";
import SessionDispute from "./pages/SessionDispute";
import AdminDashboard from "./pages/AdminDashboard";
import MentorManagement from "./pages/MentorManagement";
import PayoutManagement from "./pages/PayoutManagement";
import AdminRefunds from "./pages/AdminRefunds";
import InfoPages from "./pages/InfoPages";
import AdminContactMessages from "./pages/AdminContactMessages";
import AdminBookings from "./pages/AdminBookings";
import AdminUsers from "./pages/AdminUsers";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Home from "./Home";
import AdminFinance from "./pages/AdminFinance";
import Navbar from "./Navbar";
import BookSession from "./pages/BookSession";

// const API_URL = "http://localhost:5000/api/v1";
const API_URL = "https://throne8-mentorship-api.onrender.com/api/v1";

const formatINR = (paise = 0) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format((Number(paise) || 0) / 100);

function PaymentApp() {
  const location = useLocation();

  const [bookingId, setBookingId] = useState(
  location.state?.bookingId || ""
);

const token = sessionStorage.getItem("throne8Token") || "";

  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);

  const [view, setView] = useState("payment");
  const [activeScreen, setActiveScreen] = useState("payment");

  const handlePayment = async () => {
    if (!bookingId.trim()) {
  setStatus("error");
  setMessage(
    "Booking ID is missing. Please open payment from your booking."
  );
  return;
}

if (!token) {
  setStatus("error");
  setMessage("Your login session has expired. Please log in again.");
  return;
}
    if (!window.Razorpay) {
      setStatus("error");
      setMessage(
        "Razorpay Checkout could not load. Refresh the page and try again."
      );
      return;
    }

    setLoading(true);
    setReceipt(null);
    setStatus("processing");
    setMessage("Creating a secure payment order...");

    try {
      const orderResponse = await fetch(`${API_URL}/payments/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token.trim()}`,
        },
        body: JSON.stringify({
          bookingId: bookingId.trim(),
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || !orderData.success) {
        throw new Error(
          orderData.message || "Could not create payment order."
        );
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "THRONE8 Mentorship",
        description: "Mentorship Session Booking",
        order_id: orderData.order.id,

        handler: async (response) => {
          setStatus("processing");
          setMessage(
            "Payment response received. Verifying with the server..."
          );

          try {
            const verifyResponse = await fetch(
              `${API_URL}/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token.trim()}`,
                },
                body: JSON.stringify({
                  bookingId: bookingId.trim(),
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                }),
              }
            );

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || !verifyData.success) {
              setStatus("pending");
              setMessage(
                verifyData.message ||
                  "Payment verification is pending. Check payment status before retrying."
              );
              return;
            }

            setStatus("success");
            setMessage("Payment verification successful.");

            setReceipt({
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              paymentStatus: verifyData.paymentStatus || "Verified",
              bookingStatus: verifyData.bookingStatus || "Confirmed",
              amountPaise: verifyData.amountPaise,
              currency: verifyData.currency || "INR",
              commissionPaise: verifyData.commissionPaise,
              mentorGrossPaise: verifyData.mentorGrossPaise,
            });
          } catch {
            setStatus("pending");
            setMessage(
              "Payment response received, but verification could not be confirmed. Check payment status before retrying."
            );
          }
        },

        modal: {
          ondismiss: () => {
            setStatus("pending");
            setMessage(
              "Checkout closed. If you completed payment, verify its status before retrying."
            );
          },
        },

        theme: {
          color: "#8b5cf6",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setStatus("error");
        setMessage(
          response.error?.description ||
            "Payment failed. Check its status before retrying."
        );
      });

      checkout.open();
      setMessage("Checkout opened. Complete your test payment securely.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  if (activeScreen === "sessions") {
    return (
      <>
        <div className="dashboard-nav">
          <button onClick={() => setActiveScreen("payment")}>
            ← Back to Payment
          </button>
        </div>
        <SessionCompletion />
      </>
    );
  }

  if (view === "earnings") {
    return (
      <>
        <div className="dashboard-nav">
          <button onClick={() => setView("payment")}>
            ← Back to Payment
          </button>
        </div>
        <MentorEarnings />
      </>
    );
  }

  const statusLabels = {
    idle: "Ready for payment",
    processing: "Payment in progress",
    pending: "Verification pending",
    success: "Payment verified",
    error: "Action required",
  };

  return (
    <main className="payment-page">
      <section className="payment-card">
        <p className="brand">THRONE8</p>

        <div className="payment-heading">
          <span className="eyebrow">MENTORSHIP EXPERIENCE</span>
          <h1>Mentorship Payment</h1>
          <p className="subtitle">
            Complete your session payment through our secure Razorpay
            checkout.
          </p>
        </div>

        <div className={`payment-status status-${status}`} role="status">
          <span className="status-dot" />
          <span>{statusLabels[status]}</span>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            handlePayment();
          }}
        >
          <label htmlFor="bookingId">Booking ID</label>
          <input
            id="bookingId"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder="Paste your booking ID"
            autoComplete="off"
            required
          />

          <div className="payment-account-info">
  <span className="payment-account-dot" />
  <div>
    <strong>Student account authenticated</strong>
    <p>Your login session will be used securely.</p>
  </div>
</div>

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Pay Now — Test Mode"}
          </button>
        </form>

        {message && (
          <div className={`status-message message-${status}`}>
            <strong>
              {status === "success"
                ? "Payment confirmed"
                : status === "pending"
                  ? "Verification pending"
                  : status === "error"
                    ? "Payment needs attention"
                    : "Please wait"}
            </strong>
            <p>{message}</p>
          </div>
        )}

        {status === "success" && receipt && (
          <section className="receipt">
            <div className="receipt-heading">
              <span className="receipt-check">✓</span>
              <div>
                <h2>Payment Receipt</h2>
                <p>Server verification completed</p>
              </div>
            </div>

            <div className="receipt-row">
              <span>Payment status</span>
              <strong>{receipt.paymentStatus}</strong>
            </div>

            <div className="receipt-row">
              <span>Booking status</span>
              <strong>{receipt.bookingStatus}</strong>
            </div>

            <div className="receipt-row">
              <span>Total paid</span>
              <strong>
                {receipt.amountPaise != null
                  ? formatINR(receipt.amountPaise)
                  : "Unavailable"}
              </strong>
            </div>

            <div className="receipt-row">
              <span>Platform commission</span>
              <strong>
                {receipt.commissionPaise != null
                  ? formatINR(receipt.commissionPaise)
                  : "Unavailable"}
              </strong>
            </div>

            <div className="receipt-row">
              <span>Mentor earning</span>
              <strong>
                {receipt.mentorGrossPaise != null
                  ? formatINR(receipt.mentorGrossPaise)
                  : "Unavailable"}
              </strong>
            </div>

            <div className="receipt-row">
              <span>Payment ID</span>
              <strong className="receipt-id">{receipt.paymentId}</strong>
            </div>

            <div className="receipt-row">
              <span>Order ID</span>
              <strong className="receipt-id">{receipt.orderId}</strong>
            </div>

            <button
              type="button"
              className="secondary-button"
              onClick={() => window.print()}
            >
              Print / Save Receipt
            </button>
          </section>
        )}

        {(status === "error" || status === "pending") && (
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setStatus("idle");
              setMessage("");
              setReceipt(null);
            }}
          >
            Try Again
          </button>
        )}

        <p className="security-note">
          Test mode only. Never share your login token or Razorpay secret key.
          Payment status is confirmed by the backend, not by the checkout
          screen alone.
        </p>
      </section>
    </main>
  );
}

function ProtectedLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/about" element={<InfoPages />} />
<Route path="/contact" element={<InfoPages />} />
<Route path="/faq" element={<InfoPages />} />

        {/* Student routes */}
        <Route element={<ProtectedRoute allowedRoles={["STUDENT"]} />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/mentors" element={<MentorDiscovery />} />
            <Route path="/payment" element={<PaymentApp />} />
            <Route path="/book-session" element={<BookSession />} />
          </Route>
        </Route>

        {/* Mentor routes */}
        <Route element={<ProtectedRoute allowedRoles={["MENTOR"]} />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/mentor/dashboard" element={<Dashboard />} />
            <Route
              path="/mentor/earnings"
              element={<MentorEarnings />}
            />
          </Route>
          </Route>           
{/* Session Completion and Dispute: Student and Mentor */}
<Route
  element={
    <ProtectedRoute allowedRoles={["STUDENT", "MENTOR"]} />
  }
>
  <Route element={<ProtectedLayout />}>
    <Route
      path="/session-completion"
      element={<SessionCompletion />}
    />

    <Route
      path="/session-dispute"
      element={<SessionDispute />}
    />
  </Route>
</Route>

{/* admin route */}
<Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
  <Route element={<ProtectedLayout />}>
    <Route path="/admin" element={<AdminDashboard />} />
    <Route path="/admin/bookings" element={<AdminBookings />} />
    <Route path="/admin/users" element={<AdminUsers />} />
    <Route path="/admin/finance" element={<AdminFinance />} />
    <Route path="/admin/mentors" element={<MentorManagement />} />
    <Route path="/admin/payouts" element={<PayoutManagement />} />
    <Route path="/admin/refunds" element={<AdminRefunds />} />
    <Route
  path="/admin/contact-messages"
  element={<AdminContactMessages />}
/>
  </Route>
</Route>


        {/* Unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;