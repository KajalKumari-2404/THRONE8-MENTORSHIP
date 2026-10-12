import { useState } from "react";
import "./App.css";
import SessionCompletion from "./SessionCompletion";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MentorEarnings from "./pages/MentorEarnings";
import ProtectedRoute from "./ProtectedRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Home";
import AdminFinance from "./pages/AdminFinance";
// import api from "../api";

const API_URL = "http://localhost:5000/api/v1";

// function App() {
function PaymentApp() {
const [bookingId, setBookingId] = useState("");
const [token, setToken] = useState("");
const [message, setMessage] = useState("");
const [status, setStatus] = useState("idle");
const [loading, setLoading] = useState(false);
const [receipt, setReceipt] = useState(null);
const [view, setView] = useState("payment");
const [activeScreen, setActiveScreen] = useState("payment");

const handlePayment = async () => {
if (!bookingId.trim() || !token.trim()) {
setStatus("error");
setMessage("Please enter both Booking ID and Student Token.");
return;
}

// if (!window.Razorpay) {
//   setStatus("error");
//   setMessage(
//     "Razorpay Checkout could not load. Refresh the page and try again."
//   );

// if (view === "earnings") {
//   return (
//     <>
//       <div className="dashboard-nav">
//         <button onClick={() => setView("payment")}>
//           ← Back to Payment
//         </button>
//       </div>

//       <MentorEarnings />
//     </>
//   );
// }

//   return;
// }



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
    body: JSON.stringify({ bookingId: bookingId.trim() }),
  });

  const orderData = await orderResponse.json();

  if (!orderResponse.ok || !orderData.success) {
    throw new Error(orderData.message || "Could not create payment order.");
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
      setMessage("Payment response received. Verifying with the server...");

      try {
        const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
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
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok || !verifyData.success) {
          setStatus("pending");
          setMessage(
            verifyData.message ||
              "Payment verification is pending. Please check the payment status before retrying."
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
        });
      } catch {
        setStatus("pending");
        setMessage(
          "We received the payment response, but could not confirm verification. Check payment status before trying again."
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

return ( <main className="payment-page">
  <div className="view-switch">
  <button
    type="button"
    onClick={() => setView("earnings")}
  >
    Mentor Earnings Dashboard
  </button>
  <button
  type="button"
  onClick={() => setActiveScreen("sessions")}
>
  Session Completion
</button>
</div>
   <section className="payment-card"> <p className="brand">THRONE8</p>

```
    <div className="payment-heading">
      <span className="eyebrow">MENTORSHIP EXPERIENCE</span>
      <h1>Mentorship Payment</h1>
      <p className="subtitle">
        Complete your session payment through our secure Razorpay checkout.
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

      <label htmlFor="token">Student Login Token</label>
      <input
        id="token"
        type="password"
        value={token}
        onChange={(event) => setToken(event.target.value)}
        placeholder="Paste your login token"
        autoComplete="off"
        required
      />

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
      Payment status is confirmed by the backend, not by the checkout screen alone.
    </p>
  </section>
</main>

);
}

function App() {
return ( <BrowserRouter> <Routes>
<Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/payment" element={<PaymentApp />} />
      <Route path="/mentor/earnings" element={<MentorEarnings />} />
      <Route path="/admin/finance" element={<AdminFinance />} />
    </Route>

    {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
    <Route path="/" element={<Home />} />
    <Route path="*" element={<Navigate to="/dashboard" replace />} />
  </Routes>
</BrowserRouter>

);
}

export default App;








































































// import { useState } from "react";
// import "./App.css";

// const API_URL = "http://localhost:5000/api/v1";

// function App() {
//   const [bookingId, setBookingId] = useState("");
//   const [token, setToken] = useState("");
//   const [message, setMessage] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handlePayment = async () => {
//     if (!bookingId.trim() || !token.trim()) {
//       setMessage("Please enter both Booking ID and Student Token.");
//       return;
//     }

//     if (!window.Razorpay) {
//       setMessage("Razorpay Checkout load nahi hua. Page refresh karke try karo.");
//       return;
//     }

//     setLoading(true);
//     setMessage("Creating your payment order...");

//     try {
//       // Step 1: Create order on backend
//       const orderResponse = await fetch(`${API_URL}/payments/orders`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${token.trim()}`,
//         },
//         body: JSON.stringify({ bookingId: bookingId.trim() }),
//       });

//       const orderData = await orderResponse.json();

//       if (!orderResponse.ok || !orderData.success) {
//         throw new Error(orderData.message || "Could not create payment order.");
//       }

//       // Step 2: Open Razorpay Checkout
//       const options = {
//         key: orderData.keyId,
//         amount: orderData.order.amount,
//         currency: orderData.order.currency,
//         name: "THRONE8 Mentorship",
//         description: "Mentorship Session Booking",
//         order_id: orderData.order.id,

//         handler: async (response) => {
//           setMessage("Verifying payment with backend...");

//           try {
//             // Step 3: Verify payment on backend
//             const verifyResponse = await fetch(`${API_URL}/payments/verify`, {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//                 Authorization: `Bearer ${token.trim()}`,
//               },
//               body: JSON.stringify({
//                 bookingId: bookingId.trim(),
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               }),
//             });

//             const verifyData = await verifyResponse.json();

//             if (!verifyResponse.ok || !verifyData.success) {
//               setMessage(
//                 verifyData.message ||
//                   "Payment verification pending. Please check payment status."
//               );
//               return;
//             }

//             setMessage(
//               `Success! Payment: ${verifyData.paymentStatus}. Booking: ${verifyData.bookingStatus}.`
//             );
//           } catch {
//             setMessage(
//               "Payment response received, but verification could not be confirmed. Check the backend/payment status before retrying."
//             );
//           }
//         },

//         modal: {
//           ondismiss: () => {
//             setMessage(
//               "Checkout closed. If you completed payment, verify its status before trying again."
//             );
//           },
//         },

//         theme: {
//           color: "#4f46e5",
//         },
//       };

//       const checkout = new window.Razorpay(options);

//       checkout.on("payment.failed", (response) => {
//         setMessage(
//           response.error?.description || "Payment failed. Please check status before retrying."
//         );
//       });

//       checkout.open();
//       setMessage("Razorpay Checkout opened. Complete the test payment there.");
//     } catch (error) {
//       setMessage(error.message || "Something went wrong.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <main className="payment-page">
//       <div className="payment-card">
//         <p className="brand">THRONE8</p>
//         <h1>Mentorship Payment</h1>
//         <p className="subtitle">
//           Book your mentorship session securely using Razorpay Test Mode.
//         </p>

//         <label htmlFor="bookingId">Booking ID</label>
//         <input
//           id="bookingId"
//           value={bookingId}
//           onChange={(event) => setBookingId(event.target.value)}
//           placeholder="Paste your fresh booking ID"
//         />

//         <label htmlFor="token">Student Login Token</label>
//         <input
//           id="token"
//           type="password"
//           value={token}
//           onChange={(event) => setToken(event.target.value)}
//           placeholder="Paste the token from login response"
//           autoComplete="off"
//         />

//         <button onClick={handlePayment} disabled={loading}>
//           {loading ? "Please wait..." : "Pay Now — Test Mode"}
//         </button>

//         {message && (
//           <p className="status-message" role="status">
//             {message}
//           </p>
//         )}

//         <p className="security-note">
//           Test mode only. Never share your login token or Razorpay secret key.
//         </p>
//       </div>
//     </main>
//   );
// }

// export default App;