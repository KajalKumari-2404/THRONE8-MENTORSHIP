
import { useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000/api/v1";

function App() {
  const [bookingId, setBookingId] = useState("");
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!bookingId.trim() || !token.trim()) {
      setMessage("Please enter both Booking ID and Student Token.");
      return;
    }

    if (!window.Razorpay) {
      setMessage("Razorpay Checkout load nahi hua. Page refresh karke try karo.");
      return;
    }

    setLoading(true);
    setMessage("Creating your payment order...");

    try {
      // Step 1: Create order on backend
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

      // Step 2: Open Razorpay Checkout
      const options = {
        key: orderData.keyId,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "THRONE8 Mentorship",
        description: "Mentorship Session Booking",
        order_id: orderData.order.id,

        handler: async (response) => {
          setMessage("Verifying payment with backend...");

          try {
            // Step 3: Verify payment on backend
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
              setMessage(
                verifyData.message ||
                  "Payment verification pending. Please check payment status."
              );
              return;
            }

            setMessage(
              `Success! Payment: ${verifyData.paymentStatus}. Booking: ${verifyData.bookingStatus}.`
            );
          } catch {
            setMessage(
              "Payment response received, but verification could not be confirmed. Check the backend/payment status before retrying."
            );
          }
        },

        modal: {
          ondismiss: () => {
            setMessage(
              "Checkout closed. If you completed payment, verify its status before trying again."
            );
          },
        },

        theme: {
          color: "#4f46e5",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (response) => {
        setMessage(
          response.error?.description || "Payment failed. Please check status before retrying."
        );
      });

      checkout.open();
      setMessage("Razorpay Checkout opened. Complete the test payment there.");
    } catch (error) {
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="payment-page">
      <div className="payment-card">
        <p className="brand">THRONE8</p>
        <h1>Mentorship Payment</h1>
        <p className="subtitle">
          Book your mentorship session securely using Razorpay Test Mode.
        </p>

        <label htmlFor="bookingId">Booking ID</label>
        <input
          id="bookingId"
          value={bookingId}
          onChange={(event) => setBookingId(event.target.value)}
          placeholder="Paste your fresh booking ID"
        />

        <label htmlFor="token">Student Login Token</label>
        <input
          id="token"
          type="password"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="Paste the token from login response"
          autoComplete="off"
        />

        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Please wait..." : "Pay Now — Test Mode"}
        </button>

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

        <p className="security-note">
          Test mode only. Never share your login token or Razorpay secret key.
        </p>
      </div>
    </main>
  );
}

export default App;