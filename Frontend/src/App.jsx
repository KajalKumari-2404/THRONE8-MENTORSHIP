
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

const API_URL = "http://localhost:5000/api/v1";
// const API_URL = "https://throne8-mentorship-api.onrender.com/api/v1";

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
    <main className="payment-page payment-page-v2">
      <div className="payment-shell">
        <header className="payment-topbar">
          <div className="payment-brand-lockup">
            <span className="payment-brand-mark">T8</span>
            <div>
              <strong>THRONE8</strong>
              <span>MENTORSHIP</span>
            </div>
          </div>
          <div className="payment-secure-label"><span aria-hidden="true">●</span> Secure checkout</div>
        </header>

        <div className="payment-intro">
          <span className="payment-eyebrow">YOUR NEXT STEP STARTS HERE</span>
          <h1>Confirm your mentorship session</h1>
          <p>Complete your payment securely. Your booking is confirmed only after the server verifies the payment.</p>
        </div>

        <div className="payment-layout">
          <section className="payment-card payment-card-main">
            <div className="payment-card-heading">
              <div>
                <span className="payment-step-label">STEP 1 OF 2</span>
                <h2>Booking details</h2>
                <p>Use the booking ID created when you requested your session.</p>
              </div>
              <span className="payment-heading-icon" aria-hidden="true">↗</span>
            </div>

            <div className={`payment-status status-${status}`} role="status" aria-live="polite">
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
                aria-describedby="booking-help"
              />
              <p className="payment-field-help" id="booking-help">The booking ID links this payment to your session. The server validates ownership and amount.</p>

              <div className="payment-account-info">
                <span className="payment-account-dot" />
                <div>
                  <strong>Student session detected</strong>
                  <p>Your authenticated login is used for this payment.</p>
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? "Preparing secure checkout…" : "Continue to secure payment"}
                {!loading && <span aria-hidden="true">→</span>}
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
              <section className="receipt" aria-labelledby="receipt-title">
                <div className="receipt-heading">
                  <span className="receipt-check">✓</span>
                  <div>
                    <h2 id="receipt-title">Payment receipt</h2>
                    <p>Verified by the THRONE8 server</p>
                  </div>
                </div>
                <div className="receipt-row"><span>Payment status</span><strong>{receipt.paymentStatus}</strong></div>
                <div className="receipt-row"><span>Booking status</span><strong>{receipt.bookingStatus}</strong></div>
                <div className="receipt-row"><span>Total paid</span><strong>{receipt.amountPaise != null ? formatINR(receipt.amountPaise) : "Unavailable"}</strong></div>
                <div className="receipt-row"><span>Platform commission</span><strong>{receipt.commissionPaise != null ? formatINR(receipt.commissionPaise) : "Unavailable"}</strong></div>
                <div className="receipt-row"><span>Mentor earning snapshot</span><strong>{receipt.mentorGrossPaise != null ? formatINR(receipt.mentorGrossPaise) : "Unavailable"}</strong></div>
                <div className="receipt-row"><span>Payment ID</span><strong className="receipt-id">{receipt.paymentId}</strong></div>
                <div className="receipt-row"><span>Order ID</span><strong className="receipt-id">{receipt.orderId}</strong></div>
                <button type="button" className="secondary-button" onClick={() => window.print()}>Print / Save receipt</button>
              </section>
            )}

            {(status === "error" || status === "pending") && (
              <button type="button" className="secondary-button" onClick={() => { setStatus("idle"); setMessage(""); setReceipt(null); }}>
                Return to payment form
              </button>
            )}
          </section>

          <aside className="payment-side-column">
            <section className="payment-card payment-summary-card">
              <span className="payment-step-label">PAYMENT SUMMARY</span>
              <h2>Secure Razorpay checkout</h2>
              <p className="payment-summary-copy">Your final amount is calculated by the backend from your booking. It cannot be edited in this form.</p>
              <div className="payment-summary-row"><span>Booking reference</span><strong>{bookingId.trim() || "Not entered yet"}</strong></div>
              <div className="payment-summary-row"><span>Payment provider</span><strong>Razorpay</strong></div>
              <div className="payment-summary-total"><span>Amount</span><strong>{receipt?.amountPaise != null ? formatINR(receipt.amountPaise) : "Calculated securely"}</strong></div>
              <div className="payment-provider-note"><span aria-hidden="true">✓</span><p>Card and UPI details are entered on the provider’s secure checkout, not stored by THRONE8.</p></div>
            </section>

            <section className="payment-card payment-steps-card">
              <h2>What happens next?</h2>
              <ol className="payment-timeline">
                <li className={status !== "idle" && status !== "error" ? "is-done" : "is-current"}><span>1</span><div><strong>Create secure order</strong><p>Server checks your booking and prepares checkout.</p></div></li>
                <li className={status === "processing" || status === "pending" || status === "success" ? "is-current" : ""}><span>2</span><div><strong>Verify payment</strong><p>Payment confirmation is checked by the server.</p></div></li>
                <li className={status === "success" ? "is-done" : ""}><span>3</span><div><strong>Confirm your booking</strong><p>We show success only after verification succeeds.</p></div></li>
              </ol>
            </section>
          </aside>
        </div>

        <footer className="payment-footer"><span>🔒 Protected payment flow</span><span>Never share your password, login token or provider secrets.</span></footer>
      </div>
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