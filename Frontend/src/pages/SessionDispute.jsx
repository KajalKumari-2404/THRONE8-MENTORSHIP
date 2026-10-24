
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const API_URL = "http://localhost:5000/api/v1";
// const API_URL = "https://throne8-mentorship-api.onrender.com/api/v1";

export default function SessionDispute() {
  const navigate = useNavigate();

  const [bookingId, setBookingId] = useState("");
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState("");

  const submitDispute = async (event) => {
    event.preventDefault();

    const token = sessionStorage.getItem("throne8Token");

    if (!token) {
      setResult("error");
      setMessage("Your session has expired. Please log in again.");
      return;
    }

    if (!bookingId.trim() || !reason || !details.trim()) {
      setResult("error");
      setMessage("Please complete all fields before submitting.");
      return;
    }

    setLoading(true);
    setMessage("");
    setResult("");

    try {
    //   const response = await fetch(`${API_URL}/bookings/${bookingId.trim()}/dispute-completion`, {
    //     method: "POST",
const response = await fetch(
  `${API_URL}/bookings/${bookingId.trim()}/dispute-completion`,
  {
    method: "PATCH",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
  reason: `${reason}: ${details.trim()}`.slice(0, 1000),
}),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        throw new Error(data.message || "Unable to submit the dispute.");
      }

      setResult("success");
      setMessage(data.message || "Your dispute was submitted successfully.");
    } catch (error) {
      setResult("error");
      setMessage(error.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dispute-page">
      <section className="dispute-card">
        <div className="dispute-eyebrow">THRONE8 · STUDENT SUPPORT</div>

        <h1>Session Dispute</h1>
        <p className="dispute-subtitle">
          Report a problem with a completed-session request. Our team can
          review the booking and the details you provide.
        </p>

        <div className="dispute-notice">
          <strong>Before you submit</strong>
          <p>
            Enter the correct booking ID and explain the issue clearly.
            Submitting a dispute does not guarantee a refund.
          </p>
        </div>

        <form onSubmit={submitDispute} className="dispute-form">
          <label htmlFor="dispute-booking">Booking ID</label>
          <input
            id="dispute-booking"
            value={bookingId}
            onChange={(event) => setBookingId(event.target.value)}
            placeholder="Paste the booking ID"
            required
          />

          <label htmlFor="dispute-reason">Reason for dispute</label>
          <select
            id="dispute-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
          >
            <option value="">Select a reason</option>
            <option value="SESSION_NOT_COMPLETED">Session not completed</option>
            <option value="MENTOR_DID_NOT_ATTEND">Mentor did not attend</option>
            <option value="SESSION_QUALITY">Session quality concern</option>
            <option value="OTHER">Other issue</option>
          </select>

          <label htmlFor="dispute-details">Explain the issue</label>
          <textarea
            id="dispute-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Describe what happened..."
            rows={5}
            minLength={10}
            maxLength={1500}
            required
          />

          <div className="dispute-character-count">
            {details.length}/1500 characters
          </div>

          <button type="submit" disabled={loading || result === "success"}>
            {loading
              ? "Submitting dispute..."
              : result === "success"
                ? "Dispute submitted"
                : "Submit dispute"}
          </button>
        </form>

        {message && (
          <div
            className={`dispute-message ${result === "success" ? "success" : "error"}`}
            role="status"
          >
            {message}
          </div>
        )}

        <button
          type="button"
          className="dispute-back-button"
          onClick={() => navigate("/dashboard")}
        >
          ← Back to Dashboard
        </button>
      </section>
    </main>
  );
}
